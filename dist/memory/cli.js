/**
 * CLI surface for SiftCoder memory v2.
 * Used by slash commands (/siftcoder:handoff) to query the per-workspace memory daemon.
 *
 * Subcommands:
 *   search <query> [--k=N]       Hybrid search; prints JSON {hits: [...]}.
 *   timeline <near-id> [--w=N]   Chronological neighbors.
 *   get <id>[,<id>...]           Fetch summaries by id.
 *   ping                         Liveness check; exit 0 if daemon up.
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
        default:
            process.stderr.write(`unknown command: ${args.command}\nusage: siftcoder-mem <ping|search|timeline|get> ...\n`);
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
function parseIntFlag(v, def) {
    if (v === undefined)
        return def;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : def;
}
main().catch(err => {
    process.stderr.write(`siftcoder-mem cli: ${err?.message ?? err}\n`);
    process.exit(1);
});
/* c8 ignore stop */
//# sourceMappingURL=cli.js.map