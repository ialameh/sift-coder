/**
 * UDS-based RPC server for SiftCoder memory.
 * Each connection: framed Request -> framed Response. Stateless per-connection.
 */
import { createServer } from 'node:net';
import { unlinkSync, existsSync } from 'node:fs';
import { encodeFrame, FrameDecoder } from '../protocol.js';
import { hashInput } from '../storage/storage.js';
import { redact } from '../privacy.js';
import { hybridSearch } from '../retrieval.js';
import { RegexSymbolExtractor, looksLikeCodePath } from '../symbols.js';
import { approximate } from '../tokens.js';
const defaultExtractor = new RegexSymbolExtractor();
function extractCodePayload(payload) {
    if (!payload || typeof payload !== 'object')
        return null;
    const p = payload;
    const input = p['tool_input'];
    if (!input)
        return null;
    const path = (input['file_path'] ?? input['path'] ?? input['notebook_path']);
    if (!looksLikeCodePath(path))
        return null;
    const code = (input['content'] ?? input['new_string'] ?? input['file_text']);
    if (typeof code !== 'string' || code.length === 0)
        return null;
    return { payload: p, path: path, code };
}
function annotateSymbols(payload, extractor) {
    const code = extractCodePayload(payload);
    if (!code)
        return payload;
    const hits = extractor.extract(code.code);
    if (hits.length === 0)
        return payload;
    return { ...code.payload, symbols: hits.map(h => `${h.kind}:${h.name}`) };
}
async function annotateSymbolsAsync(payload, extractor) {
    const code = extractCodePayload(payload);
    if (!code)
        return payload;
    const hits = await extractor.extract(code.code, { path: code.path });
    if (hits.length === 0)
        return payload;
    return { ...code.payload, symbols: hits.map(h => `${h.kind}:${h.name}`) };
}
export function buildHandler(deps) {
    return async (req) => {
        try {
            switch (req.kind) {
                case 'ping':
                    return { ok: true, data: { pong: true } };
                case 'capture': {
                    const ts = req.ts ?? Date.now();
                    let annotated;
                    if (deps.asyncSymbols) {
                        annotated = await annotateSymbolsAsync(req.payload, deps.asyncSymbols);
                    }
                    else {
                        const extractor = deps.symbols === null ? null : (deps.symbols ?? defaultExtractor);
                        annotated = extractor ? annotateSymbols(req.payload, extractor) : req.payload;
                    }
                    const { value: redactedPayload } = redact(annotated);
                    const source = req.source ?? 'claude-code';
                    const stamped = redactedPayload && typeof redactedPayload === 'object' && !Array.isArray(redactedPayload)
                        ? { ...redactedPayload, _source: source }
                        : { value: redactedPayload, _source: source };
                    deps.storage.ensureSession(req.sessionId, deps.cwd, ts);
                    const inputHash = hashInput(stamped);
                    deps.wal.append({
                        ts,
                        sessionId: req.sessionId,
                        tool: req.tool,
                        inputHash,
                        payload: stamped,
                    });
                    const tokensEst = approximate(JSON.stringify(stamped));
                    const id = deps.storage.recordEvent({
                        ts,
                        sessionId: req.sessionId,
                        tool: req.tool,
                        payload: stamped,
                        tokensEst,
                    });
                    return { ok: true, data: { id, tokensEst } };
                }
                case 'search': {
                    const k = req.k ?? 5;
                    const embedder = deps.embedder ?? null;
                    const hits = await hybridSearch(deps.storage, embedder, req.query, Date.now(), { k });
                    return { ok: true, data: { hits } };
                }
                case 'timeline': {
                    const rows = deps.storage.timeline(req.nearId, req.window ?? 10);
                    return { ok: true, data: { rows } };
                }
                case 'get': {
                    const rows = deps.storage.getSummariesByIds(req.ids);
                    return { ok: true, data: { rows } };
                }
                case 'shutdown': {
                    if (deps.onShutdown)
                        deps.onShutdown();
                    return { ok: true, data: { stopping: true } };
                }
            }
        }
        catch (err) {
            return { ok: false, error: err instanceof Error ? err.message : String(err) };
        }
    };
}
/* c8 ignore start */
export function startServer(deps) {
    const handler = buildHandler(deps);
    if (existsSync(deps.socketPath)) {
        try {
            unlinkSync(deps.socketPath);
        }
        catch { /* ignore */ }
    }
    const server = createServer((socket) => {
        const decoder = new FrameDecoder();
        socket.on('data', async (chunk) => {
            let frames;
            try {
                frames = decoder.push(chunk);
            }
            catch (err) {
                socket.write(encodeFrame({ ok: false, error: err.message }));
                socket.end();
                return;
            }
            for (const frame of frames) {
                const res = await handler(frame);
                socket.write(encodeFrame(res));
            }
        });
        socket.on('error', () => { });
    });
    server.listen(deps.socketPath);
    return server;
}
/* c8 ignore stop */
//# sourceMappingURL=server.js.map