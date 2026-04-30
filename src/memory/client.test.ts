import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, Server } from 'node:net';
import { mkdtempSync, rmSync, existsSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MemoryClient } from './client.js';
import { encodeFrame, FrameDecoder } from './protocol.js';

let dir: string;
let socketPath: string;
let server: Server | null;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'mc-'));
  socketPath = join(dir, 's.sock');
  server = null;
});

afterEach(() => {
  if (server) try { server.close(); } catch { /* ignore */ }
  if (existsSync(socketPath)) try { unlinkSync(socketPath); } catch { /* ignore */ }
  rmSync(dir, { recursive: true, force: true });
});

function startEcho(reply: (req: unknown) => unknown): Promise<void> {
  return new Promise(resolve => {
    server = createServer(socket => {
      const dec = new FrameDecoder();
      socket.on('data', chunk => {
        for (const frame of dec.push(chunk)) {
          socket.write(encodeFrame(reply(frame)));
        }
      });
    });
    server.listen(socketPath, () => resolve());
  });
}

describe('MemoryClient.send', () => {
  it('round-trips an ok response', async () => {
    await startEcho(() => ({ ok: true, data: { pong: true } }));
    const c = new MemoryClient({ socketPath });
    const r = await c.send({ kind: 'ping' });
    expect(r).toEqual({ ok: true, data: { pong: true } });
  });

  it('rejects when the socket does not exist', async () => {
    const c = new MemoryClient({ socketPath: join(dir, 'missing.sock'), timeoutMs: 200 });
    await expect(c.send({ kind: 'ping' })).rejects.toBeTruthy();
  });

  it('times out when the server never responds', async () => {
    server = createServer(() => { /* accept and stall */ });
    server.listen(socketPath);
    const c = new MemoryClient({ socketPath, timeoutMs: 50 });
    await expect(c.send({ kind: 'ping' })).rejects.toThrow(/timeout/);
  });

  it('rejects when the server closes without responding', async () => {
    server = createServer(socket => { socket.end(); });
    server.listen(socketPath);
    const c = new MemoryClient({ socketPath, timeoutMs: 1000 });
    await expect(c.send({ kind: 'ping' })).rejects.toThrow(/closed without response/);
  });

  it('rejects when the server sends a malformed frame header', async () => {
    server = createServer(socket => {
      const bad = Buffer.alloc(4);
      bad.writeUInt32BE(0xffffffff, 0);
      socket.write(bad);
    });
    server.listen(socketPath);
    const c = new MemoryClient({ socketPath, timeoutMs: 500 });
    await expect(c.send({ kind: 'ping' })).rejects.toBeTruthy();
  });

  it('capture() resolves on ok responses and throws on err responses', async () => {
    await startEcho(req => {
      const r = req as { kind: string };
      if (r.kind === 'capture') return { ok: true, data: { id: 7 } };
      return { ok: false, error: 'no' };
    });
    const c = new MemoryClient({ socketPath });
    await expect(c.capture('s', 'Read', { x: 1 })).resolves.toBeUndefined();
  });

  it('capture() throws when the daemon returns ok:false', async () => {
    await startEcho(() => ({ ok: false, error: 'denied' }));
    const c = new MemoryClient({ socketPath });
    await expect(c.capture('s', 'Read', {})).rejects.toThrow('denied');
  });

  it('reassembles a response that arrives across multiple chunks', async () => {
    server = createServer(socket => {
      const dec = new FrameDecoder();
      socket.on('data', chunk => {
        for (const _ of dec.push(chunk)) {
          const reply = encodeFrame({ ok: true, data: { ok: 1 } });
          socket.write(reply.subarray(0, 3));
          setTimeout(() => socket.write(reply.subarray(3)), 10);
        }
      });
    });
    server.listen(socketPath);
    const c = new MemoryClient({ socketPath, timeoutMs: 2000 });
    const r = await c.send({ kind: 'ping' });
    expect(r).toEqual({ ok: true, data: { ok: 1 } });
  });
});
