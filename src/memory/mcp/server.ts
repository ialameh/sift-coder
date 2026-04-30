/**
 * MCP stdio entrypoint. Wires the handler dispatch + a sampling bridge that issues
 * `sampling/createMessage` requests on stdout and correlates incoming responses by id.
 *
 * Excluded from coverage: stdio plumbing only; pure logic lives in handler.ts and is unit-tested.
 */
/* istanbul ignore file */
/* c8 ignore start */
import { workspacePaths } from '../workspace.js';
import { MemoryClient } from '../client.js';
import { dispatch, type JsonRpcRequest, type JsonRpcResponse } from './handler.js';
import { McpSamplingClient, type SamplingRequestParams, type SamplingResponse, type SamplingTransport } from './sampling-client.js';
import { Summarizer } from '../daemon/summarizer.js';
import { DeterministicEmbedder } from '../embedder.js';
import { Storage, type DBHandle } from '../storage/storage.js';
import { ProvenanceStore } from '../provenance.js';

interface PendingEntry {
  resolve: (res: SamplingResponse) => void;
  reject: (err: Error) => void;
}

class StdioBridge implements SamplingTransport {
  private nextId = 1_000_000;
  private pending = new Map<number, PendingEntry>();
  private buf = '';

  start(onRequest: (req: JsonRpcRequest) => Promise<JsonRpcResponse>): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async chunk => {
      this.buf += chunk;
      let idx: number;
      while ((idx = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, idx).trim();
        this.buf = this.buf.slice(idx + 1);
        if (!line) continue;
        let msg: JsonRpcRequest | (JsonRpcResponse & { result?: SamplingResponse });
        try { msg = JSON.parse(line); } catch { continue; }
        const m = msg as { method?: string; id?: number; result?: SamplingResponse; error?: { code: number; message: string } };
        if (m.method === undefined && typeof m.id === 'number' && this.pending.has(m.id)) {
          const entry = this.pending.get(m.id)!;
          this.pending.delete(m.id);
          if (m.error) {
            entry.reject(new Error(`sampling/createMessage failed: ${m.error.message} (code ${m.error.code})`));
          } else if (m.result) {
            entry.resolve(m.result);
          } else {
            entry.reject(new Error('sampling/createMessage returned neither result nor error'));
          }
          continue;
        }
        const res = await onRequest(msg as JsonRpcRequest);
        process.stdout.write(JSON.stringify(res) + '\n');
      }
    });
  }

  requestSampling(params: SamplingRequestParams): Promise<SamplingResponse> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const out = { jsonrpc: '2.0', id, method: 'sampling/createMessage', params };
      process.stdout.write(JSON.stringify(out) + '\n');
    });
  }
}

async function main() {
  const cwd = process.env.SIFTCODER_WORKSPACE_CWD || process.cwd();
  const paths = workspacePaths(cwd);
  const memClient = new MemoryClient({ socketPath: paths.socket });

  let storage: Storage | null = null;
  try {
    const mod = (await import('better-sqlite3' as string)) as { default: new (path: string) => DBHandle & { close(): void } };
    storage = new Storage(new mod.default(paths.db));
  } catch {
    try {
      const wasm = await import('../storage/wasm-db.js');
      storage = new Storage(await wasm.openWasmDatabase(paths.db));
    } catch {
      storage = null;
    }
  }

  const bridge = new StdioBridge();
  const sampling = new McpSamplingClient(bridge);

  // Default path: MCP host sampling only. Host (Claude Code) executes the LLM call under its
  // own credentials and billing — no plugin-side API key. Matches the original design.
  //
  // Opt-in fallback: SIFTCODER_DRAIN_FALLBACK=1 + ANTHROPIC_API_KEY enables a chain that falls
  // back to the direct Anthropic API when sampling fails. Only for users on hosts that don't
  // expose sampling/createMessage and who explicitly accept the API key cost path.
  let modelClient: import('../daemon/summarizer.js').ModelClient = sampling;
  if (process.env['SIFTCODER_DRAIN_FALLBACK'] === '1') {
    const { AnthropicClient } = await import('../anthropic-client.js');
    if (AnthropicClient.available(process.env)) {
      const { FallbackModelClient } = await import('../fallback-client.js');
      const direct = new AnthropicClient();
      modelClient = new FallbackModelClient(sampling, direct, {
        onFallback: (err) => process.stderr.write(`siftcoder-mem mcp: sampling fallback engaged: ${err.message}\n`),
      });
      process.stderr.write('siftcoder-mem mcp: drain fallback to direct Anthropic API enabled (SIFTCODER_DRAIN_FALLBACK=1)\n');
    } else {
      process.stderr.write('siftcoder-mem mcp: SIFTCODER_DRAIN_FALLBACK=1 but no ANTHROPIC_API_KEY; staying on MCP sampling only\n');
    }
  }
  const summarizer = storage ? new Summarizer(storage, modelClient) : null;
  const embedder = new DeterministicEmbedder(384);
  const provenance = storage ? new ProvenanceStore(storage) : null;

  bridge.start(async req => dispatch(req, {
    client: memClient,
    storage,
    summarizer,
    embedder,
    provenance,
    drainBatch: 4,
    onInitialize: info => {
      const cap = info.samplingAdvertised ? 'sampling=advertised' : 'sampling=NOT advertised';
      const ci = info.clientInfo ? `${info.clientInfo.name ?? '?'}@${info.clientInfo.version ?? '?'}` : '?';
      process.stderr.write(`siftcoder-mem mcp: host=${ci} ${cap}; caps=${JSON.stringify(info.clientCaps)}\n`);
      if (!info.samplingAdvertised) {
        process.stderr.write('siftcoder-mem mcp: host did NOT advertise sampling capability — drain will fail. Set SIFTCODER_DRAIN_FALLBACK=1 + ANTHROPIC_API_KEY for direct API.\n');
      }
    },
  }));
}

main().catch(err => {
  process.stderr.write(`siftcoder-mem mcp: ${err?.message ?? err}\n`);
  process.exit(1);
});
/* c8 ignore stop */
