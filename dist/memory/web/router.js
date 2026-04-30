import { computeSavings } from '../metrics.js';
import { hybridSearch } from '../retrieval.js';
import { AbHarness } from '../ab.js';
const STATIC_PATHS = {
    '/': 'index.html',
    '/app.js': 'app.js',
    '/style.css': 'style.css',
};
function json(status, body) {
    return {
        status,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    };
}
function unauthorized() {
    return json(401, { ok: false, error: 'unauthorized' });
}
function badRequest(message) {
    return json(400, { ok: false, error: message });
}
function isAuthorized(req, token) {
    const presented = (req.authorization ?? '').replace(/^Bearer\s+/i, '') ||
        req.query['token'] ||
        '';
    return presented === token && presented.length > 0;
}
function parseBody(raw) {
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function countRows(storage, sql) {
    const db = storage['db'];
    /* c8 ignore next -- count(*) always returns a row; ?? 0 is a defensive type guard */
    return db.prepare(sql).get()?.c ?? 0;
}
function eventTail(storage, limit) {
    const db = storage['db'];
    return db.prepare('SELECT id, ts, tool, status, session_id FROM events ORDER BY id DESC LIMIT ?').all(limit);
}
function summaryTail(storage, limit) {
    const db = storage['db'];
    return db.prepare('SELECT id, ts, model, substr(text, 1, 240) AS text, confidence FROM summaries ORDER BY id DESC LIMIT ?').all(limit);
}
export async function route(req, deps) {
    // Static assets — gate behind auth too so a publicly-exposed bridge does not leak the SPA.
    if (req.method === 'GET' && STATIC_PATHS[req.path] && deps.staticAsset) {
        if (!isAuthorized(req, deps.authToken))
            return unauthorized();
        const asset = deps.staticAsset(STATIC_PATHS[req.path]);
        if (!asset)
            return json(404, { ok: false, error: 'not found' });
        return { status: 200, headers: { 'content-type': asset.type }, body: asset.body };
    }
    // Legacy RPC endpoint — kept for the existing MemoryClient over HTTP path.
    if (req.method === 'POST' && req.path === '/' && deps.rpc) {
        if (!isAuthorized(req, deps.authToken))
            return unauthorized();
        const body = parseBody(req.body);
        if (!body)
            return badRequest('invalid json');
        const result = await deps.rpc(body);
        return json(200, result);
    }
    if (!req.path.startsWith('/api/'))
        return json(404, { ok: false, error: 'not found' });
    if (!isAuthorized(req, deps.authToken))
        return unauthorized();
    if (req.method === 'GET' && req.path === '/api/health') {
        return json(200, {
            ok: true,
            data: {
                backend: deps.backend,
                workspace: deps.workspaceKey,
                events: countRows(deps.storage, 'SELECT count(*) AS c FROM events'),
                summaries: countRows(deps.storage, 'SELECT count(*) AS c FROM summaries'),
                embeddings: countRows(deps.storage, 'SELECT count(*) AS c FROM summary_embeddings'),
                superseded: countRows(deps.storage, 'SELECT count(DISTINCT older_id) AS c FROM summary_supersedes'),
            },
        });
    }
    if (req.method === 'GET' && req.path === '/api/savings') {
        return json(200, { ok: true, data: computeSavings(deps.storage) });
    }
    if (req.method === 'GET' && req.path === '/api/events') {
        const limit = parseInt(req.query['limit'] ?? '50', 10) || 50;
        return json(200, { ok: true, data: { events: eventTail(deps.storage, limit) } });
    }
    if (req.method === 'GET' && req.path === '/api/summaries') {
        const limit = parseInt(req.query['limit'] ?? '50', 10) || 50;
        return json(200, { ok: true, data: { summaries: summaryTail(deps.storage, limit) } });
    }
    if (req.method === 'POST' && req.path === '/api/search') {
        const body = parseBody(req.body);
        if (!body || typeof body.query !== 'string')
            return badRequest('query required');
        const hits = await hybridSearch(deps.storage, deps.embedder, body.query, Date.now(), { k: body.k ?? 5 });
        return json(200, { ok: true, data: { hits } });
    }
    if (req.method === 'POST' && req.path === '/api/timeline') {
        const body = parseBody(req.body);
        if (!body || !Number.isFinite(body.nearId))
            return badRequest('nearId required');
        const rows = deps.storage.timeline(body.nearId, body.window ?? 10);
        return json(200, { ok: true, data: { rows } });
    }
    if (req.method === 'POST' && req.path === '/api/get') {
        const body = parseBody(req.body);
        if (!body || !Array.isArray(body.ids))
            return badRequest('ids[] required');
        const rows = deps.storage.getSummariesByIds(body.ids);
        return json(200, { ok: true, data: { rows } });
    }
    if (req.method === 'POST' && req.path === '/api/why') {
        const body = parseBody(req.body);
        if (!body || typeof body.kind !== 'string' || typeof body.id !== 'string') {
            return badRequest('kind and id required');
        }
        if (!deps.provenance)
            return json(200, { ok: true, data: { edges: [] } });
        const node = { kind: body.kind, id: body.id };
        return json(200, { ok: true, data: { edges: deps.provenance.trace(node, body.depth ?? 4) } });
    }
    if (req.method === 'POST' && req.path === '/api/ab') {
        const body = parseBody(req.body);
        const harness = new AbHarness(deps.storage, deps.embedder);
        const report = await harness.run({ turns: body?.turns ?? 100, memoryK: body?.k ?? 5 });
        return json(200, { ok: true, data: report });
    }
    return json(404, { ok: false, error: 'not found' });
}
//# sourceMappingURL=router.js.map