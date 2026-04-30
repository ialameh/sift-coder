export class ProvenanceStore {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    get db() {
        return this.storage['db'];
    }
    addEdge(input) {
        const ts = input.ts ?? Date.now();
        const conf = input.confidence ?? 1.0;
        const source = input.source ?? 'siftcoder';
        const meta = input.meta ? JSON.stringify(input.meta) : null;
        const result = this.db.prepare(`INSERT INTO provenance_edges (ts, from_kind, from_id, to_kind, to_id, edge_type, confidence, source, meta_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(ts, input.from.kind, input.from.id, input.to.kind, input.to.id, input.edgeType, conf, source, meta);
        return Number(result.lastInsertRowid);
    }
    outgoing(node, edgeType) {
        const sql = edgeType
            ? `SELECT * FROM provenance_edges WHERE from_kind = ? AND from_id = ? AND edge_type = ? ORDER BY ts DESC`
            : `SELECT * FROM provenance_edges WHERE from_kind = ? AND from_id = ? ORDER BY ts DESC`;
        const rows = edgeType
            ? this.db.prepare(sql).all(node.kind, node.id, edgeType)
            : this.db.prepare(sql).all(node.kind, node.id);
        return rows.map(rowToEdge);
    }
    incoming(node, edgeType) {
        const sql = edgeType
            ? `SELECT * FROM provenance_edges WHERE to_kind = ? AND to_id = ? AND edge_type = ? ORDER BY ts DESC`
            : `SELECT * FROM provenance_edges WHERE to_kind = ? AND to_id = ? ORDER BY ts DESC`;
        const rows = edgeType
            ? this.db.prepare(sql).all(node.kind, node.id, edgeType)
            : this.db.prepare(sql).all(node.kind, node.id);
        return rows.map(rowToEdge);
    }
    /**
     * BFS from `node` following outgoing edges up to `maxDepth`. Returns a flat list of edges in
     * traversal order so the caller can render a causal chain.
     */
    trace(node, maxDepth = 4) {
        const seen = new Set([nodeKey(node)]);
        const out = [];
        let frontier = [node];
        for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
            const next = [];
            for (const n of frontier) {
                for (const e of this.outgoing(n)) {
                    out.push(e);
                    const key = nodeKey(e.to);
                    if (!seen.has(key)) {
                        seen.add(key);
                        next.push(e.to);
                    }
                }
            }
            frontier = next;
        }
        return out;
    }
}
function rowToEdge(r) {
    return {
        id: r['id'],
        ts: r['ts'],
        from: { kind: r['from_kind'], id: r['from_id'] },
        to: { kind: r['to_kind'], id: r['to_id'] },
        edgeType: r['edge_type'],
        confidence: r['confidence'],
        source: r['source'],
        meta: r['meta_json'] ? JSON.parse(r['meta_json']) : null,
    };
}
function nodeKey(n) {
    return `${n.kind}:${n.id}`;
}
export async function ingestFromCdg(prov, opts) {
    const headers = {};
    if (opts.token)
        headers['authorization'] = `Bearer ${opts.token}`;
    /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
    const fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
    const url = opts.baseUrl.replace(/\/+$/, '') + (opts.endpoint ?? '/v1/dependencies');
    let edges = 0;
    let references = 0;
    try {
        const res = await fetchImpl(url, { method: 'GET', headers });
        if (!res.ok)
            return { edges, references };
        const body = await res.json();
        if (Array.isArray(body.edges)) {
            for (const raw of body.edges) {
                if (!raw || typeof raw !== 'object')
                    continue;
                const r = raw;
                if (typeof r.from_path !== 'string' || typeof r.to_path !== 'string')
                    continue;
                const edgeType = mapEdgeType(typeof r.edge_type === 'string' ? r.edge_type : 'imports');
                prov.addEdge({
                    from: { kind: 'file', id: r.from_path },
                    to: { kind: 'file', id: r.to_path },
                    edgeType,
                    confidence: clamp01(Number(r.confidence)),
                    source: 'cdg',
                });
                edges++;
            }
        }
        if (Array.isArray(body.references)) {
            for (const raw of body.references) {
                if (!raw || typeof raw !== 'object')
                    continue;
                const r = raw;
                if (typeof r.from_symbol !== 'string' || typeof r.to_symbol !== 'string')
                    continue;
                const edgeType = mapEdgeType(typeof r.ref_type === 'string' ? r.ref_type : 'references');
                prov.addEdge({
                    from: { kind: 'symbol', id: r.from_symbol },
                    to: { kind: 'symbol', id: r.to_symbol },
                    edgeType,
                    confidence: clamp01(Number(r.confidence)),
                    source: 'cdg',
                });
                references++;
            }
        }
    }
    catch {
        /* swallow */
    }
    return { edges, references };
}
function mapEdgeType(raw) {
    const t = raw.toLowerCase();
    const valid = [
        'causes', 'caused_by', 'derives_from', 'contradicts', 'edits',
        'references', 'calls', 'imports', 'extends', 'implements', 'instantiates', 'similar_to',
    ];
    return valid.includes(t) ? t : 'references';
}
function clamp01(n) {
    if (!Number.isFinite(n))
        return 1.0;
    if (n < 0)
        return 0;
    if (n > 1)
        return 1;
    return n;
}
//# sourceMappingURL=provenance.js.map