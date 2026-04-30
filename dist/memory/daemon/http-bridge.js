/**
 * Optional HTTP bridge to the same daemon handler. Activated when SIFTCODER_HTTP=1 in the env.
 * Listens on 127.0.0.1:<port> (port written to ~/.siftcoder/workspaces/<key>/http.port). Accepts
 * POST / with bearer token auth (token at ~/.siftcoder/auth.token, generated on first start).
 *
 * Same Request/Response protocol as the UDS path. Enables browser extensions, IDE plugins, and
 * cross-process ingestion (Linear webhooks, git hooks, CI/CD) to write into memory.
 *
 * Excluded from coverage: integration plumbing (real HTTP). Pure logic in handler is unit-tested.
 */
/* istanbul ignore file */
/* c8 ignore start */
import { createServer } from 'node:http';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { randomBytes, timingSafeEqual } from 'node:crypto';
const TOKEN_PATH = join(homedir(), '.siftcoder', 'auth.token');
export function ensureAuthToken() {
    if (!existsSync(TOKEN_PATH)) {
        mkdirSync(dirname(TOKEN_PATH), { recursive: true });
        const tok = randomBytes(32).toString('hex');
        writeFileSync(TOKEN_PATH, tok, { mode: 0o600 });
        return tok;
    }
    return readFileSync(TOKEN_PATH, 'utf8').trim();
}
function constantTimeEquals(a, b) {
    if (a.length !== b.length)
        return false;
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function startHttpBridge(deps) {
    const token = ensureAuthToken();
    const server = createServer(async (req, res) => {
        if (req.method !== 'POST' || req.url !== '/') {
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'POST / only' }));
            return;
        }
        const auth = req.headers['authorization'] ?? '';
        const presented = auth.replace(/^Bearer\s+/i, '');
        if (!constantTimeEquals(presented, token)) {
            res.writeHead(401, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
            return;
        }
        let body = '';
        req.setEncoding('utf8');
        for await (const chunk of req)
            body += chunk;
        let parsed;
        try {
            parsed = JSON.parse(body);
        }
        catch {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'invalid json' }));
            return;
        }
        const result = await deps.handler(parsed);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(result));
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