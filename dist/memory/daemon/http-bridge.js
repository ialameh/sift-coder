/**
 * Optional HTTP bridge to the daemon's RPC handler + the read-only web client API.
 *
 * Activated when SIFTCODER_HTTP=1 in the env. Listens on 127.0.0.1:<port> (port written to
 * ~/.siftcoder/workspaces/<key>/http.port). Accepts:
 *   - POST /                  legacy RPC: forwards to deps.handler (memory client compat)
 *   - GET  /api/...           read-only JSON endpoints (savings, events, summaries, etc.)
 *   - POST /api/...           search / why / ab
 *   - GET  /, /app.js, /style.css   static SPA assets
 *
 * Auth: bearer token at ~/.siftcoder/auth.token. Constant-time comparison. Static assets are
 * gated too so a publicly-exposed bridge does not leak the SPA shell.
 *
 * Excluded from coverage: stdio plumbing only. Routing logic in web/router.ts is unit-tested.
 */
/* istanbul ignore file */
/* c8 ignore start */
import { createServer } from 'node:http';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { route } from '../web/router.js';
const TOKEN_PATH = join(homedir(), '.siftcoder', 'auth.token');
const __dirname = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, '..', 'web', 'static');
const STATIC_TYPES = {
    'index.html': 'text/html; charset=utf-8',
    'app.js': 'application/javascript; charset=utf-8',
    'style.css': 'text/css; charset=utf-8',
};
export function ensureAuthToken() {
    if (!existsSync(TOKEN_PATH)) {
        mkdirSync(dirname(TOKEN_PATH), { recursive: true });
        const tok = randomBytes(32).toString('hex');
        writeFileSync(TOKEN_PATH, tok, { mode: 0o600 });
        return tok;
    }
    return readFileSync(TOKEN_PATH, 'utf8').trim();
}
function staticAsset(name) {
    const path = join(STATIC_DIR, name);
    if (!existsSync(path))
        return null;
    return { body: readFileSync(path), type: STATIC_TYPES[name] ?? 'application/octet-stream' };
}
async function readBody(req) {
    let body = '';
    req.setEncoding('utf8');
    for await (const chunk of req)
        body += chunk;
    return body;
}
function parseQuery(url) {
    const q = {};
    const i = url.indexOf('?');
    if (i < 0)
        return q;
    for (const pair of url.slice(i + 1).split('&')) {
        if (!pair)
            continue;
        const [k, v = ''] = pair.split('=');
        q[decodeURIComponent(k)] = decodeURIComponent(v);
    }
    return q;
}
function pathOf(url) {
    const i = url.indexOf('?');
    return i < 0 ? url : url.slice(0, i);
}
export function startHttpBridge(deps) {
    const token = ensureAuthToken();
    const server = createServer(async (req, res) => {
        const url = req.url ?? '/';
        const webReq = {
            method: req.method ?? 'GET',
            path: pathOf(url),
            query: parseQuery(url),
            authorization: typeof req.headers['authorization'] === 'string' ? req.headers['authorization'] : undefined,
            body: await readBody(req),
        };
        const webDeps = {
            storage: deps.storage,
            embedder: deps.embedder,
            provenance: deps.provenance,
            authToken: token,
            rpc: deps.handler,
            staticAsset,
            backend: deps.backend,
            workspaceKey: deps.workspaceKey,
        };
        const out = await route(webReq, webDeps);
        res.writeHead(out.status, out.headers);
        res.end(out.body);
    });
    server.listen(deps.port ?? 0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
            writeFileSync(join(deps.workspaceRoot, 'http.port'), String(addr.port));
        }
    });
    return server;
}
/* c8 ignore stop */
//# sourceMappingURL=http-bridge.js.map