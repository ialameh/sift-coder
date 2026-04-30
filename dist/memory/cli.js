/**
 * CLI surface for SiftCoder memory v2.
 * Used by slash commands (/siftcoder:handoff) to query the per-workspace memory daemon.
 *
 * Subcommands:
 *   search <query> [--k=N]                    Hybrid search; prints JSON {hits: [...]}.
 *   timeline <near-id> [--w=N]                Chronological neighbors.
 *   get <id>[,<id>...]                        Fetch summaries by id.
 *   ping                                      Liveness check; exit 0 if daemon up.
 *   eval [--k=N] [--rerank]                   Self-recall eval over mined golden set.
 *   mine-golden [--max=N]                     Print the mined golden set as JSON.
 *   watch [--limit=N]                         Stream the events table; pretty-printed.
 *   note <text...> [--source=X] [--session=X] Capture a free-text note. Source defaults to "cli".
 *   ingest [--file=P|--stdin] [--tool=X]      Capture a typed event from a file or stdin.
 *                                             [--source=X] [--session=X]
 *
 * Exit codes:
 *   0 success, 1 daemon unreachable, 2 bad args, 3 daemon error.
 */
/* c8 ignore start */
import { workspacePaths } from './workspace.js';
import { MemoryClient } from './client.js';
function parseArgs(argv) {
    const command = argv[0] ?? '';
    const positional = [];
    const flags = {};
    for (const a of argv.slice(1)) {
        if (a.startsWith('--')) {
            const eq = a.indexOf('=');
            if (eq >= 0)
                flags[a.slice(2, eq)] = a.slice(eq + 1);
            else
                flags[a.slice(2)] = 'true';
        }
        else {
            positional.push(a);
        }
    }
    return { command, positional, flags };
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const cwd = process.env['CLAUDE_PROJECT_DIR'] || process.cwd();
    const paths = workspacePaths(cwd);
    const client = new MemoryClient({ socketPath: paths.socket, timeoutMs: 3000 });
    let req;
    switch (args.command) {
        case 'ping':
            req = { kind: 'ping' };
            break;
        case 'search': {
            const query = args.positional.join(' ').trim();
            if (!query) {
                process.stderr.write('search: query required\n');
                process.exit(2);
            }
            req = { kind: 'search', query, k: parseIntFlag(args.flags['k'], 5) };
            break;
        }
        case 'timeline': {
            const nearId = Number(args.positional[0]);
            if (!Number.isFinite(nearId)) {
                process.stderr.write('timeline: numeric near-id required\n');
                process.exit(2);
            }
            req = { kind: 'timeline', nearId, window: parseIntFlag(args.flags['w'], 10) };
            break;
        }
        case 'get': {
            const ids = (args.positional[0] ?? '').split(',').map(s => Number(s.trim())).filter(Number.isFinite);
            if (ids.length === 0) {
                process.stderr.write('get: comma-separated ids required\n');
                process.exit(2);
            }
            req = { kind: 'get', ids };
            break;
        }
        case 'eval':
        case 'mine-golden':
        case 'watch':
            await runLocal(args, paths.db);
            return;
        case 'note': {
            const text = args.positional.join(' ').trim();
            if (!text) {
                process.stderr.write('note: text required\n');
                process.exit(2);
            }
            req = {
                kind: 'capture',
                sessionId: args.flags['session'] ?? 'note',
                tool: 'Note',
                payload: { text },
                source: args.flags['source'] ?? 'cli',
                ts: Date.now(),
            };
            break;
        }
        case 'ingest': {
            const filePath = args.flags['file'];
            const useStdin = args.flags['stdin'] === 'true' || !filePath;
            const tool = args.flags['tool'] ?? 'Ingest';
            const source = args.flags['source'] ?? 'cli-ingest';
            const sessionId = args.flags['session'] ?? `ingest-${Date.now()}`;
            const content = await readContent(filePath, useStdin);
            if (!content) {
                process.stderr.write('ingest: empty input\n');
                process.exit(2);
            }
            req = {
                kind: 'capture',
                sessionId,
                tool,
                payload: {
                    content,
                    ...(filePath ? { file_path: filePath } : {}),
                },
                source,
                ts: Date.now(),
            };
            break;
        }
        default:
            process.stderr.write(`unknown command: ${args.command}\nusage: siftcoder-mem <ping|search|timeline|get|eval|mine-golden|watch|note|ingest> ...\n`);
            process.exit(2);
            return;
    }
    try {
        const res = await client.send(req);
        process.stdout.write(JSON.stringify(res) + '\n');
        process.exit(res.ok ? 0 : 3);
    }
    catch (err) {
        process.stderr.write(`siftcoder-mem cli: ${err.message}\n`);
        process.exit(1);
    }
}
async function runLocal(args, dbPath) {
    const { Storage } = await import('./storage/storage.js');
    const { DeterministicEmbedder } = await import('./embedder.js');
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(dbPath);
    const storage = new Storage(db);
    const embedder = new DeterministicEmbedder(384);
    if (args.command === 'mine-golden') {
        const { mineGolden } = await import('./eval-mine.js');
        const items = mineGolden(storage, { maxItems: parseIntFlag(args.flags['max'], 200) });
        process.stdout.write(JSON.stringify({ ok: true, data: { items } }) + '\n');
        process.exit(0);
    }
    if (args.command === 'eval') {
        const { mineGolden } = await import('./eval-mine.js');
        const { evaluate } = await import('./eval.js');
        const golden = mineGolden(storage);
        const k = parseIntFlag(args.flags['k'], 5);
        const useRerank = args.flags['rerank'] === 'true';
        const report = await evaluate(storage, embedder, golden, k, Date.now(), { decayTauMs: 1e15, rerank: useRerank });
        const summary = { k: report.k, recallAtK: report.recallAtK, mrr: report.mrr, golden: golden.length };
        process.stdout.write(JSON.stringify({ ok: true, data: summary }) + '\n');
        process.exit(0);
    }
    if (args.command === 'watch') {
        const { renderWatchSnapshot } = await import('./tui.js');
        const limit = parseIntFlag(args.flags['limit'], 20);
        process.stdout.write(renderWatchSnapshot(storage, { limit }));
        process.exit(0);
    }
}
function parseIntFlag(v, def) {
    if (v === undefined)
        return def;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
}
async function readContent(filePath, useStdin) {
    if (filePath) {
        const { readFileSync } = await import('node:fs');
        return readFileSync(filePath, 'utf8');
    }
    if (useStdin) {
        return new Promise(resolve => {
            let data = '';
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', chunk => { data += chunk; });
            process.stdin.on('end', () => resolve(data));
        });
    }
    return '';
}
main().catch(err => {
    process.stderr.write(`siftcoder-mem cli: ${err?.message ?? err}\n`);
    process.exit(1);
});
/* c8 ignore stop */
//# sourceMappingURL=cli.js.map