/**
 * Daemon entrypoint. Capture + storage + WAL + retrieval only.
 * No LLM calls here — summarization runs out-of-band through the MCP server,
 * which delegates to the host (Claude Code) via sampling. No API key required.
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

const IDLE_SHUTDOWN_MS = 30 * 60 * 1000;

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

  const localEmbedder = new DeterministicEmbedder(384);
  const cdgEmbedder = CdgEmbedder.fromEnv(process.env, localEmbedder);
  const embedder = cdgEmbedder ?? localEmbedder;
  if (cdgEmbedder) logger.info('cdg embedder enabled', {});
  const consolidator = new Consolidator(storage);
  consolidator.start();

  const regexFallback = new AsyncFromSync(new RegexSymbolExtractor());
  const asyncSymbols = CdgSymbolExtractor.fromEnv(process.env, regexFallback);
  if (asyncSymbols) logger.info('cdg adapter enabled', { url: process.env['SIFTCODER_CDG_URL'] });

  const server = startServer({
    embedder,
    storage,
    wal,
    socketPath: paths.socket,
    cwd,
    asyncSymbols,
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

  const idleTimer = setInterval(() => {
    if (stopping || Date.now() - lastClientTs > IDLE_SHUTDOWN_MS) {
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
