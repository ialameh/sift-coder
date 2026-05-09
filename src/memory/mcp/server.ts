/**
 * MCP stdio entrypoint.
 *
 * Bidirectional JSON-RPC over stdio:
 *   - stdin:  host → server requests (initialize, tools/list, tools/call)
 *   - stdout: server → host responses, AND server → host requests (sampling/createMessage)
 *
 * The bridge tracks `id` so server-initiated requests can match responses from the host. This
 * lets the server delegate summarization to the host's LLM via `sampling/createMessage` when
 * the host advertises the `sampling` capability — the daemon then never needs an API key.
 *
 * Excluded from coverage: stdio plumbing only; pure logic lives in handler.ts and is unit-tested.
 */
/* istanbul ignore file */
/* c8 ignore start */
import { workspacePaths } from '../workspace.js';
import { MemoryClient } from '../client.js';
import { dispatch, type JsonRpcRequest, type JsonRpcResponse } from './handler.js';
import type { SamplingTransport, SamplingRequestParams, SamplingResponse } from './sampling-client.js';

class StdioBridge implements SamplingTransport {
  private buf = '';
  private nextRequestId = 1_000_000;
  private pending = new Map<number, { resolve: (v: SamplingResponse) => void; reject: (e: Error) => void }>();

  start(onRequest: (req: JsonRpcRequest) => Promise<JsonRpcResponse>): void {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async chunk => {
      this.buf += chunk;
      let idx: number;
      while ((idx = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, idx).trim();
        this.buf = this.buf.slice(idx + 1);
        if (!line) continue;
        let msg: { id?: number | string; method?: string; result?: unknown; error?: { code: number; message: string } };
        try { msg = JSON.parse(line); } catch { continue; }
        // Response to a server-initiated request? Match by id.
        if (msg.method === undefined && typeof msg.id === 'number' && this.pending.has(msg.id)) {
          const waiter = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          if (msg.error) waiter.reject(new Error(`${msg.error.code}: ${msg.error.message}`));
          else waiter.resolve(msg.result as SamplingResponse);
          continue;
        }
        // Otherwise: incoming request from host.
        if (msg.method !== undefined) {
          const res = await onRequest(msg as JsonRpcRequest);
          process.stdout.write(JSON.stringify(res) + '\n');
        }
      }
    });
  }

  async requestSampling(params: SamplingRequestParams): Promise<SamplingResponse> {
    const id = this.nextRequestId++;
    const promise = new Promise<SamplingResponse>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      // Reasonable per-call timeout so a non-responsive host doesn't hang the drain forever.
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('sampling/createMessage timed out after 60s'));
        }
      }, 60_000).unref();
    });
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'sampling/createMessage',
      params,
    }) + '\n');
    return promise;
  }
}

async function main() {
  const cwd = process.env.SIFTCODER_WORKSPACE_CWD || process.cwd();
  const paths = workspacePaths(cwd);
  const memClient = new MemoryClient({ socketPath: paths.socket });
  const bridge = new StdioBridge();
  let samplingAvailable = false;

  bridge.start(async req => dispatch(req, {
    client: memClient,
    drainBatch: 4,
    samplingTransport: samplingAvailable ? bridge : null,
    onInitialize: info => {
      samplingAvailable = info.samplingAdvertised;
      const cap = samplingAvailable ? 'sampling=advertised' : 'sampling=NOT advertised';
      const ci = info.clientInfo ? `${info.clientInfo.name ?? '?'}@${info.clientInfo.version ?? '?'}` : '?';
      process.stderr.write(`siftcoder-mem mcp: host=${ci} ${cap}; caps=${JSON.stringify(info.clientCaps)}\n`);
    },
  }));

  // Last-resort error logging so a silent crash leaves a forensic trail.
  process.on('uncaughtException', err => {
    process.stderr.write(`siftcoder-mem mcp uncaught: ${err.stack ?? err.message}\n`);
    process.exit(1);
  });
  process.on('unhandledRejection', reason => {
    process.stderr.write(`siftcoder-mem mcp rejection: ${reason instanceof Error ? reason.stack : String(reason)}\n`);
  });
}

main().catch(err => {
  process.stderr.write(`siftcoder-mem mcp: ${err?.message ?? err}\n`);
  process.exit(1);
});
/* c8 ignore stop */
