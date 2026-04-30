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
                    const entry = this.pending.get(m.id);
                    this.pending.delete(m.id);
                    if (m.error) {
                        entry.reject(new Error(`sampling/createMessage failed: ${m.error.message} (code ${m.error.code})`));
                    }
                    else if (m.result) {
                        entry.resolve(m.result);
                    }
                    else {
                        entry.reject(new Error('sampling/createMessage returned neither result nor error'));
                    }
                    continue;
                }
                const res = await onRequest(msg);
                process.stdout.write(JSON.stringify(res) + '\n');
            }
        });
    }
    requestSampling(params) {
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
    // Drain backend resolution. Priority:
    //   1. SIFTCODER_DRAIN_BACKEND=ollama|anthropic|mcp explicit override.
    //   2. Auto-detect: Ollama at http://localhost:11434 → use Ollama (local, free).
    //   3. ANTHROPIC_API_KEY set → use direct Anthropic.
    //   4. MCP host sampling (works once Claude Code ships sampling/createMessage).
    //
    // Wraps with FallbackModelClient (primary -> sampling) only when explicitly enabled, so
    // a transient Ollama hiccup falls back to the host instead of failing.
    let modelClient = sampling;
    const backendChoice = (process.env['SIFTCODER_DRAIN_BACKEND'] ?? 'auto').toLowerCase();
    const { OllamaClient } = await import('../ollama-client.js');
    const { AnthropicClient } = await import('../anthropic-client.js');
    let chosen = 'mcp-sampling';
    if (backendChoice === 'ollama' || (backendChoice === 'auto' && await OllamaClient.available())) {
        modelClient = new OllamaClient();
        chosen = `ollama (model=${process.env['SIFTCODER_OLLAMA_MODEL'] ?? 'llama3.2:3b'})`;
    }
    else if (backendChoice === 'anthropic' || (backendChoice === 'auto' && AnthropicClient.available(process.env))) {
        modelClient = new AnthropicClient();
        chosen = 'anthropic-direct';
    }
    else if (backendChoice !== 'mcp' && backendChoice !== 'auto') {
        process.stderr.write(`siftcoder-mem mcp: unknown SIFTCODER_DRAIN_BACKEND=${backendChoice}; staying on MCP sampling\n`);
    }
    process.stderr.write(`siftcoder-mem mcp: drain backend = ${chosen}\n`);
    const summarizer = storage ? new Summarizer(storage, modelClient) : null;
    const embedder = new DeterministicEmbedder(384);
    const provenance = storage ? new ProvenanceStore(storage) : null;
    bridge.start(async (req) => dispatch(req, {
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
//# sourceMappingURL=server.js.map