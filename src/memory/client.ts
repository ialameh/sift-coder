/**
 * Thin RPC client for the SiftCoder memory daemon.
 * Used by hooks. Must be lightweight — no native deps, no AI calls.
 */
import { connect, Socket } from 'node:net';
import { encodeFrame, FrameDecoder, Request, Response } from './protocol.js';

export interface ClientOptions {
  socketPath: string;
  timeoutMs?: number;
}

export class MemoryClient {
  constructor(private readonly opts: ClientOptions) {}

  async send<T = unknown>(req: Request): Promise<Response<T>> {
    const timeoutMs = this.opts.timeoutMs ?? 1500;
    return new Promise((resolve, reject) => {
      const socket: Socket = connect(this.opts.socketPath);
      const decoder = new FrameDecoder();
      let settled = false;
      const finish = (fn: () => void) => {
        /* c8 ignore next -- defensive idempotency guard for racing close/timeout/data paths */
        if (settled) return;
        settled = true;
        /* c8 ignore next -- socket.end() rarely throws; guard is defensive */
        try { socket.end(); } catch { /* ignore */ }
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
        let frames: unknown[];
        try {
          frames = decoder.push(chunk);
        } catch (err) {
          clearTimeout(timer);
          finish(() => reject(err as Error));
          return;
        }
        if (frames.length > 0) {
          clearTimeout(timer);
          finish(() => resolve(frames[0] as Response<T>));
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
  async capture(sessionId: string, tool: string, payload: unknown): Promise<void> {
    const res = await this.send<{ id: number }>({
      kind: 'capture',
      sessionId,
      tool,
      payload,
      ts: Date.now(),
    });
    if (!res.ok) throw new Error(res.error);
  }
}
