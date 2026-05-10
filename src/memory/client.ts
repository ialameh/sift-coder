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

  /**
   * Streaming RPC: yields each response frame as it arrives. Terminates when:
   *   - The server sends a frame whose data has `done: true`.
   *   - The server-side connection ends.
   *   - The hard timeout fires (no progress for `timeoutMs`).
   * The timeout is a *progress* timeout, not a total-deadline; each received frame resets it.
   */
  async *sendStream<T = unknown>(req: Request): AsyncGenerator<Response<T>, void, unknown> {
    const timeoutMs = this.opts.timeoutMs ?? 5000;
    type Item =
      | { kind: 'frame'; value: Response<T> }
      | { kind: 'end' }
      | { kind: 'error'; error: Error };
    const queue: Item[] = [];
    let waker: ((v: Item) => void) | null = null;
    const push = (item: Item): void => {
      if (waker) { const w = waker; waker = null; w(item); }
      else queue.push(item);
    };
    const next = (): Promise<Item> => new Promise<Item>(resolve => {
      const item = queue.shift();
      if (item !== undefined) resolve(item);
      else waker = resolve;
    });
    let timer: ReturnType<typeof setTimeout> | null = null;
    const armTimer = (socket: Socket): void => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        push({ kind: 'error', error: new Error('memory client: stream timeout') });
        try { socket.destroy(); } catch { /* ignore */ }
      }, timeoutMs);
    };
    const socket: Socket = connect(this.opts.socketPath);
    const decoder = new FrameDecoder();
    socket.on('connect', () => {
      armTimer(socket);
      socket.write(encodeFrame(req));
    });
    socket.on('data', chunk => {
      let frames: unknown[];
      try { frames = decoder.push(chunk); }
      catch (err) { push({ kind: 'error', error: err as Error }); return; }
      for (const f of frames) {
        push({ kind: 'frame', value: f as Response<T> });
        armTimer(socket);
      }
    });
    socket.on('end', () => { push({ kind: 'end' }); });
    socket.on('error', err => push({ kind: 'error', error: err }));

    try {
      while (true) {
        const item = await next();
        if (item.kind === 'error') throw item.error;
        if (item.kind === 'end') return;
        const res = item.value;
        yield res;
        // Terminator: server signaled done. Stop iterating; finally-block tears down.
        if (res.ok && typeof res.data === 'object' && res.data !== null && (res.data as { done?: boolean }).done === true) {
          return;
        }
      }
    } finally {
      if (timer) clearTimeout(timer);
      try { socket.end(); } catch { /* ignore */ }
    }
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
