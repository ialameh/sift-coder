/**
 * MCP stdio entrypoint. Thin proxy: routes all tool calls to the daemon via socket.
 * No direct DB access, no model clients — all business logic lives in the daemon.
 * Upgrading the daemon picks up new backends without restarting Claude Code.
 *
 * Excluded from coverage: stdio plumbing only; pure logic lives in handler.ts and is unit-tested.
 */
/* istanbul ignore file */
/* c8 ignore start */
import { workspacePaths } from '../workspace.js';
import { MemoryClient } from '../client.js';
import { dispatch, type JsonRpcRequest, type JsonRpcResponse } from './handler.js';
class StdioBridge {
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
        let msg: JsonRpcRequest;
        try { msg = JSON.parse(line); } catch { continue; }
        const res = await onRequest(msg);
        process.stdout.write(JSON.stringify(res) + '\n');
      }
    });
  }
}

async function main() {
  const cwd = process.env.SIFTCODER_WORKSPACE_CWD || process.cwd();
  const paths = workspacePaths(cwd);
  const memClient = new MemoryClient({ socketPath: paths.socket });
  const bridge = new StdioBridge();

  bridge.start(async req => dispatch(req, {
    client: memClient,
    drainBatch: 4,
    onInitialize: info => {
      const cap = info.samplingAdvertised ? 'sampling=advertised' : 'sampling=NOT advertised';
      const ci = info.clientInfo ? `${info.clientInfo.name ?? '?'}@${info.clientInfo.version ?? '?'}` : '?';
      process.stderr.write(`siftcoder-mem mcp: host=${ci} ${cap}; caps=${JSON.stringify(info.clientCaps)}\n`);
    },
  }));
}

main().catch(err => {
  process.stderr.write(`siftcoder-mem mcp: ${err?.message ?? err}\n`);
  process.exit(1);
});
/* c8 ignore stop */
