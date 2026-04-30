/**
 * Thin RPC client for the SiftCoder memory daemon.
 * Used by hooks. Must be lightweight — no native deps, no AI calls.
 */
import { connect } from 'node:net';
import { encodeFrame, FrameDecoder } from './protocol.js';
export class MemoryClient {
    opts;
    constructor(opts) {
        this.opts = opts;
    }
    async send(req) {
        const timeoutMs = this.opts.timeoutMs ?? 1500;
        return new Promise((resolve, reject) => {
            const socket = connect(this.opts.socketPath);
            const decoder = new FrameDecoder();
            let settled = false;
            const finish = (fn) => {
                /* c8 ignore next -- defensive idempotency guard for racing close/timeout/data paths */
                if (settled)
                    return;
                settled = true;
                /* c8 ignore next -- socket.end() rarely throws; guard is defensive */
                try {
                    socket.end();
                }
                catch { /* ignore */ }
                fn();
            };
            const timer = setTimeout(() => {
                finish(() => reject(new Error('memory client: timeout')));
            }, timeoutMs);
            socket.on('error', err => {
                clearTimeout(timer);
                finish(() => reject(err));
            });
            socket.on('connect', () => {
                socket.write(encodeFrame(req));
            });
            socket.on('data', chunk => {
                let frames;
                try {
                    frames = decoder.push(chunk);
                }
                catch (err) {
                    clearTimeout(timer);
                    finish(() => reject(err));
                    return;
                }
                if (frames.length > 0) {
                    clearTimeout(timer);
                    finish(() => resolve(frames[0]));
                }
            });
            socket.on('end', () => {
                clearTimeout(timer);
                if (!settled) {
                    settled = true;
                    reject(new Error('memory client: connection closed without response'));
                }
            });
        });
    }
    /** Fire-and-forget capture; returns once the daemon has acknowledged the WAL append. */
    async capture(sessionId, tool, payload) {
        const res = await this.send({
            kind: 'capture',
            sessionId,
            tool,
            payload,
            ts: Date.now(),
        });
        if (!res.ok)
            throw new Error(res.error);
    }
}
//# sourceMappingURL=client.js.map