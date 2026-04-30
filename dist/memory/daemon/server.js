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
export function buildHandler(deps) {
    return async (req) => {
        try {
            switch (req.kind) {
                case 'ping':
                    return { ok: true, data: { pong: true } };
                case 'capture': {
                    const ts = req.ts ?? Date.now();
                    const { value: redactedPayload } = redact(req.payload);
                    deps.storage.ensureSession(req.sessionId, deps.cwd, ts);
                    const inputHash = hashInput(redactedPayload);
                    deps.wal.append({
                        ts,
                        sessionId: req.sessionId,
                        tool: req.tool,
                        inputHash,
                        payload: redactedPayload,
                    });
                    const id = deps.storage.recordEvent({
                        ts,
                        sessionId: req.sessionId,
                        tool: req.tool,
                        payload: redactedPayload,
                    });
                    return { ok: true, data: { id } };
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