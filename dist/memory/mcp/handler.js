export const TOOLS = [
    {
        name: 'mem_search',
        description: 'Hybrid (BM25 + vector) search over SiftCoder memory summaries. Returns top-k hits with ids. Drains a small backlog through host sampling.',
        inputSchema: {
            type: 'object',
            properties: { query: { type: 'string' }, k: { type: 'number', default: 5 } },
            required: ['query'],
        },
    },
    {
        name: 'mem_timeline',
        description: 'Chronological neighbors around a memory id.',
        inputSchema: {
            type: 'object',
            properties: { near_id: { type: 'number' }, window: { type: 'number', default: 10 } },
            required: ['near_id'],
        },
    },
    {
        name: 'mem_get',
        description: 'Fetch full summary rows by ids.',
        inputSchema: {
            type: 'object',
            properties: { ids: { type: 'array', items: { type: 'number' } } },
            required: ['ids'],
        },
    },
    {
        name: 'mem_drain',
        description: 'Force-drain pending captured events into summaries via host sampling. Returns counts.',
        inputSchema: {
            type: 'object',
            properties: { batch: { type: 'number', default: 16 } },
            required: [],
        },
    },
];
export async function drain(deps, batch) {
    const { storage, summarizer, embedder } = deps;
    if (!storage || !summarizer)
        return { processed: 0, errors: 0, pending: 0 };
    const events = storage.pendingEvents(batch);
    let processed = 0;
    let errors = 0;
    for (const ev of events) {
        try {
            const r = await summarizer.summarize(ev.id, ev.inputHash, ev.payloadJson, Date.now());
            if (embedder) {
                const v = await embedder.embed(r.text);
                storage.putEmbedding(r.id, v);
            }
            storage.markEventStatus(ev.id, 'summarized');
            processed++;
        }
        catch {
            storage.markEventStatus(ev.id, 'skipped');
            errors++;
        }
    }
    const remaining = storage.pendingEvents(1).length;
    return { processed, errors, pending: remaining };
}
export async function dispatch(req, deps) {
    if (req.method === 'initialize') {
        return {
            jsonrpc: '2.0',
            id: req.id,
            result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {}, sampling: {} },
                serverInfo: { name: 'siftcoder-memory', version: '2.0.0' },
            },
        };
    }
    if (req.method === 'tools/list') {
        return { jsonrpc: '2.0', id: req.id, result: { tools: TOOLS } };
    }
    if (req.method === 'tools/call') {
        const params = req.params;
        const name = params?.name ?? '';
        const args = params?.arguments ?? {};
        try {
            switch (name) {
                case 'mem_search': {
                    await drain(deps, deps.drainBatch ?? 4);
                    const res = await deps.client.send({
                        kind: 'search',
                        query: String(args['query'] ?? ''),
                        k: Number(args['k'] ?? 5),
                    });
                    return ok(req.id, res);
                }
                case 'mem_timeline': {
                    const res = await deps.client.send({
                        kind: 'timeline',
                        nearId: Number(args['near_id']),
                        window: Number(args['window'] ?? 10),
                    });
                    return ok(req.id, res);
                }
                case 'mem_get': {
                    const res = await deps.client.send({
                        kind: 'get',
                        ids: args['ids'] ?? [],
                    });
                    return ok(req.id, res);
                }
                case 'mem_drain': {
                    const r = await drain(deps, Number(args['batch'] ?? 16));
                    return ok(req.id, { ok: true, data: r });
                }
                default:
                    return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `unknown tool: ${name}` } };
            }
        }
        catch (err) {
            return { jsonrpc: '2.0', id: req.id, error: { code: -32000, message: err.message } };
        }
    }
    return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `method not found: ${req.method}` } };
}
function ok(id, body) {
    return {
        jsonrpc: '2.0',
        ...(id !== undefined ? { id } : {}),
        result: { content: [{ type: 'text', text: JSON.stringify(body) }] },
    };
}
//# sourceMappingURL=handler.js.map