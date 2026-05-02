/**
 * Daemon entrypoint. Owns all business logic: capture, storage, WAL, retrieval, and drain.
 * Model client selection: GEMINI_API_KEY → Ollama → ANTHROPIC_API_KEY → none (events accumulate).
 * Override with SIFTCODER_DRAIN_BACKEND=gemini|ollama|anthropic.
 *
 * The MCP server is a thin proxy that routes all tool calls through the daemon socket.
 * Upgrading the daemon (siftcoder stop && siftcoder start) picks up a new version without
 * restarting Claude Code.
 *
 * Excluded from coverage: wires concrete I/O (fs, net, sqlite). Pure logic is unit-tested.
 */
/* istanbul ignore file */
/* c8 ignore start */
import { writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { workspacePaths, ensureWorkspaceDirs } from '../workspace.js';
import { Storage, type DBHandle } from '../storage/storage.js';
import { WAL } from './wal.js';
import { startServer } from './server.js';
import { Consolidator } from './consolidator.js';
import { DeterministicEmbedder } from '../embedder.js';
import { FileSink, Logger } from '../logger.js';
import { buildHandler } from './server.js';
import { startHttpBridge } from './http-bridge.js';
import { CdgSymbolExtractor, AsyncFromSync } from '../cdg-adapter.js';
import { CdgEmbedder } from '../cdg-embedder.js';
import { RegexSymbolExtractor } from '../symbols.js';

/**
 * Idle-shutdown window in ms. Disabled by default so a quiet Claude Code
 * session (lunch, meeting, end-of-day pause) doesn't silently kill the
 * daemon and lose subsequent captures. Set `SIFTCODER_IDLE_SHUTDOWN_MS`
 * to a positive integer to enable; set to 0 to keep it disabled.
 */
const IDLE_SHUTDOWN_MS = (() => {
  const raw = process.env['SIFTCODER_IDLE_SHUTDOWN_MS'];
  if (raw === undefined || raw === '') return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
})();

async function main() {
  const cwd = process.env.SIFTCODER_WORKSPACE_CWD || process.cwd();
  const paths = workspacePaths(cwd);
  ensureWorkspaceDirs(paths);

  if (existsSync(paths.pid)) {
    try { unlinkSync(paths.pid); } catch { /* ignore */ }
  }
  writeFileSync(paths.pid, String(process.pid));

  let db: DBHandle & { close(): void };
  let backend: 'native' | 'wasm';
  try {
    const mod = (await import('better-sqlite3' as string)) as { default: new (path: string) => DBHandle & { close(): void } };
    db = new mod.default(paths.db);
    backend = 'native';
  } catch (nativeErr) {
    try {
      const wasm = await import('../storage/wasm-db.js');
      db = await wasm.openWasmDatabase(paths.db);
      backend = 'wasm';
    } catch (wasmErr) {
      process.stderr.write(
        'siftcoder-mem: neither better-sqlite3 nor node-sqlite3-wasm could be loaded; daemon exiting\n' +
        `  native: ${(nativeErr as Error).message}\n` +
        `  wasm:   ${(wasmErr as Error).message}\n`
      );
      process.exit(0);
      return;
    }
  }
  const storage = new Storage(db);

  const wal = new WAL(paths.wal);
  wal.open();

  let lastClientTs = Date.now();
  let stopping = false;

  const sink = new FileSink(paths.log);
  const logger = new Logger('siftcoder-mem', sink);
  logger.info('daemon booting', { pid: process.pid, key: paths.key, backend });

  // Embedder selection cascade: CDG (remote) -> Ollama (local) -> Deterministic (hash-bucket).
  // SIFTCODER_EMBEDDER=deterministic|ollama|cdg overrides; default is auto-detect.
  const embedderChoice = (process.env['SIFTCODER_EMBEDDER'] ?? 'auto').toLowerCase();
  const localEmbedder = new DeterministicEmbedder(384);
  const cdgEmbedder = CdgEmbedder.fromEnv(process.env, localEmbedder);
  let embedder: typeof localEmbedder = localEmbedder;
  let embedderName = 'deterministic-hash';
  if ((embedderChoice === 'cdg' || embedderChoice === 'auto') && cdgEmbedder) {
    embedder = cdgEmbedder;
    embedderName = 'cdg';
  } else if (embedderChoice === 'ollama' || embedderChoice === 'auto') {
    const { OllamaEmbedder } = await import('../ollama-embedder.js');
    if (await OllamaEmbedder.available()) {
      embedder = new OllamaEmbedder();
      embedderName = `ollama (model=${process.env['SIFTCODER_OLLAMA_EMBED_MODEL'] ?? 'nomic-embed-text'})`;
    }
  }
  logger.info('embedder selected', { name: embedderName, dim: embedder.dim });
  const consolidator = new Consolidator(storage);
  consolidator.start();

  const regexFallback = new AsyncFromSync(new RegexSymbolExtractor());
  const asyncSymbols = CdgSymbolExtractor.fromEnv(process.env, regexFallback);
  if (asyncSymbols) logger.info('cdg adapter enabled', { url: process.env['SIFTCODER_CDG_URL'] });

  // Model client selection for drain: GLM → Gemini → Ollama → Anthropic → none.
  // GLM (glm-4-flash) is the default: free 10M tokens/month, no per-day hard cap.
  // SIFTCODER_DRAIN_BACKEND=glm|gemini|ollama|anthropic overrides auto-detect.
  const backendChoice = (process.env['SIFTCODER_DRAIN_BACKEND'] ?? 'auto').toLowerCase();
  const { GlmClient } = await import('../glm-client.js');
  const { GeminiClient } = await import('../gemini-client.js');
  const { OllamaClient } = await import('../ollama-client.js');
  const { AnthropicClient } = await import('../anthropic-client.js');
  const { Summarizer } = await import('./summarizer.js');
  const { ProvenanceStore } = await import('../provenance.js');

  let modelClient: import('./summarizer.js').ModelClient | null = null;
  let drainBackend = 'none';
  if (backendChoice === 'glm' || (backendChoice === 'auto' && GlmClient.available(process.env))) {
    modelClient = new GlmClient();
    drainBackend = `glm (model=${process.env['SIFTCODER_GLM_MODEL'] ?? 'glm-4.5-air'})`;
  } else if (backendChoice === 'gemini' || (backendChoice === 'auto' && GeminiClient.available(process.env))) {
    modelClient = new GeminiClient();
    drainBackend = `gemini (model=${process.env['SIFTCODER_GEMINI_MODEL'] ?? 'gemini-2.0-flash'})`;
  } else if (backendChoice === 'ollama' || (backendChoice === 'auto' && await OllamaClient.available())) {
    modelClient = new OllamaClient();
    drainBackend = `ollama (model=${process.env['SIFTCODER_OLLAMA_MODEL'] ?? 'llama3.2:3b'})`;
  } else if (backendChoice === 'anthropic' || (backendChoice === 'auto' && AnthropicClient.available(process.env))) {
    modelClient = new AnthropicClient();
    drainBackend = 'anthropic-direct';
  }
  logger.info('drain backend selected', { name: drainBackend });
  const summarizer = modelClient ? new Summarizer(storage, modelClient) : null;
  const provenance = new ProvenanceStore(storage);

  const server = startServer({
    embedder,
    storage,
    wal,
    socketPath: paths.socket,
    cwd,
    asyncSymbols,
    summarizer,
    drainBatch: 16,
    drainBackend,
    provenance,
    onShutdown: () => {
      stopping = true;
    },
  });
  server.on('connection', () => {
    lastClientTs = Date.now();
  });

  let httpServer: ReturnType<typeof startHttpBridge> | null = null;
  if (process.env['SIFTCODER_NO_HTTP'] !== '1') {
    const handler = buildHandler({ storage, wal, cwd, embedder });
    const { ProvenanceStore } = await import('../provenance.js');
    httpServer = startHttpBridge({
      workspaceRoot: paths.root,
      workspaceKey: paths.key,
      backend,
      handler,
      storage,
      embedder,
      provenance: new ProvenanceStore(storage),
    });
    logger.info('http bridge enabled', {});
  }

  const idleTimer = IDLE_SHUTDOWN_MS > 0
    ? setInterval(() => {
        if (stopping || Date.now() - lastClientTs > IDLE_SHUTDOWN_MS) {
          clearInterval(idleTimer);
          shutdown();
        }
      }, 60_000)
    : setInterval(() => {
        if (stopping) {
          clearInterval(idleTimer);
          shutdown();
        }
      }, 60_000);

  function shutdown() {
    consolidator.stop();
    logger.info('daemon stopping');
    try { httpServer?.close(); } catch { /* ignore */ }
    try { server.close(); } catch { /* ignore */ }
    try { wal.close(); } catch { /* ignore */ }
    try { db.close(); } catch { /* ignore */ }
    try { unlinkSync(paths.pid); } catch { /* ignore */ }
    try { unlinkSync(paths.socket); } catch { /* ignore */ }
    process.exit(0);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(err => {
  process.stderr.write(`siftcoder-mem daemon: ${err?.message ?? err}\n`);
  process.exit(1);
});
/* c8 ignore stop */
