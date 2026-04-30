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
import { dispatch } from './handler.js';
import { McpSamplingClient } from './sampling-client.js';
import { Summarizer } from '../daemon/summarizer.js';
import { DeterministicEmbedder } from '../embedder.js';
import { Storage } from '../storage/storage.js';
import { ProvenanceStore } from '../provenance.js';
class StdioBridge {
    nextId = 1_000_000;
    pending = new Map();
    buf = '';
    start(onRequest) {
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', async (chunk) => {
            this.buf += chunk;
            let idx;
            while ((idx = this.buf.indexOf('\n')) >= 0) {
                const line = this.buf.slice(0, idx).trim();
                this.buf = this.buf.slice(idx + 1);
                if (!line)
                    continue;
                let msg;
                try {
                    msg = JSON.parse(line);
                }
                catch {
                    continue;
                }
                const m = msg;
                if (m.method === undefined && typeof m.id === 'number' && this.pending.has(m.id)) {
                    const cb = this.pending.get(m.id);
                    this.pending.delete(m.id);
                    cb(m.result);
                    continue;
                }
                const res = await onRequest(msg);
                process.stdout.write(JSON.stringify(res) + '\n');
            }
        });
    }
    requestSampling(params) {
        const id = this.nextId++;
        return new Promise(resolve => {
            this.pending.set(id, resolve);
            const out = { jsonrpc: '2.0', id, method: 'sampling/createMessage', params };
            process.stdout.write(JSON.stringify(out) + '\n');
        });
    }
}
async function main() {
    const cwd = process.env.SIFTCODER_WORKSPACE_CWD || process.cwd();
    const paths = workspacePaths(cwd);
    const memClient = new MemoryClient({ socketPath: paths.socket });
    let storage = null;
    try {
        const mod = (await import('better-sqlite3'));
        storage = new Storage(new mod.default(paths.db));
    }
    catch {
        try {
            const wasm = await import('../storage/wasm-db.js');
            storage = new Storage(await wasm.openWasmDatabase(paths.db));
        }
        catch {
            storage = null;
        }
    }
    const bridge = new StdioBridge();
    const sampling = new McpSamplingClient(bridge);
    const summarizer = storage ? new Summarizer(storage, sampling) : null;
    const embedder = new DeterministicEmbedder(384);
    const provenance = storage ? new ProvenanceStore(storage) : null;
    bridge.start(async (req) => dispatch(req, { client: memClient, storage, summarizer, embedder, provenance, drainBatch: 4 }));
}
main().catch(err => {
    process.stderr.write(`siftcoder-mem mcp: ${err?.message ?? err}\n`);
    process.exit(1);
});
/* c8 ignore stop */
//# sourceMappingURL=server.js.map