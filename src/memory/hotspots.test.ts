import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { HotspotService, hotspotBoostFn } from './hotspots.js';
import { Storage } from './storage/storage.js';
import type { FetchLike } from './cdg-adapter.js';
import type { HybridHit } from './retrieval.js';

function fetchOk(body: unknown): FetchLike {
  return async () => ({ ok: true, status: 200, json: async () => body, text: async () => '' });
}

let dir: string;
let db: Database.Database;
let storage: Storage;
beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'hot-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = await Storage.init(db);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('HotspotService', () => {
  it('caches hotspot entries on first refresh', async () => {
    const s = new HotspotService({
      baseUrl: 'http://x',
      fetchImpl: fetchOk({ hotspots: [
        { path: '/a.ts', temperature: 80 },
        { path: '/b.ts', temperature: 20 },
      ] }),
    });
    await s.refresh();
    expect(s.boostForPath('/a.ts')).toBeGreaterThan(s.boostForPath('/b.ts'));
    expect(s.boostForPath('/c.ts')).toBe(1);
  });

  it('returns 1 for null or undefined paths', async () => {
    const s = new HotspotService({ baseUrl: 'http://x', fetchImpl: fetchOk({ hotspots: [] }) });
    expect(s.boostForPath(null)).toBe(1);
    expect(s.boostForPath(undefined)).toBe(1);
  });

  it('returns 1 when max temperature is 0 or no entries cached', async () => {
    const s = new HotspotService({ baseUrl: 'http://x', fetchImpl: fetchOk({ hotspots: [] }) });
    await s.refresh();
    expect(s.boostForPath('/a.ts')).toBe(1);
  });

  it('boost peaks at 1 + alpha for the hottest file', async () => {
    const s = new HotspotService({
      baseUrl: 'http://x',
      alpha: 0.4,
      fetchImpl: fetchOk({ hotspots: [{ path: '/hot.ts', temperature: 100 }] }),
    });
    await s.refresh();
    expect(s.boostForPath('/hot.ts')).toBeCloseTo(1.4, 5);
  });

  it('skips entries without a string path or finite temperature', async () => {
    const s = new HotspotService({
      baseUrl: 'http://x',
      fetchImpl: fetchOk({ hotspots: [
        { path: 1, temperature: 10 },
        { path: '/x', temperature: 'NaN' },
        { path: '/y', temperature: -5 },
        { path: '/z', temperature: 50 },
        null,
        'string',
      ] }),
    });
    await s.refresh();
    expect(s.boostForPath('/x')).toBe(1);
    expect(s.boostForPath('/y')).toBe(1);
    expect(s.boostForPath('/z')).toBeGreaterThan(1);
  });

  it('does not refresh again within the refresh interval', async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      calls++;
      return { ok: true, status: 200, json: async () => ({ hotspots: [] }), text: async () => '' };
    };
    const s = new HotspotService({ baseUrl: 'http://x', fetchImpl, refreshIntervalMs: 60_000 });
    await s.refresh(1_000);
    await s.refresh(1_500);
    expect(calls).toBe(1);
  });

  it('allows refresh again after the interval elapses', async () => {
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      calls++;
      return { ok: true, status: 200, json: async () => ({ hotspots: [] }), text: async () => '' };
    };
    const s = new HotspotService({ baseUrl: 'http://x', fetchImpl, refreshIntervalMs: 100 });
    await s.refresh(1_000);
    await s.refresh(2_000);
    expect(calls).toBe(2);
  });

  it('keeps stale cache on a non-2xx response', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => '' });
    const s = new HotspotService({ baseUrl: 'http://x', fetchImpl });
    await s.refresh();
    expect(s.boostForPath('/anything')).toBe(1);
  });

  it('keeps stale cache on a fetch error', async () => {
    const s = new HotspotService({
      baseUrl: 'http://x',
      fetchImpl: async () => { throw new Error('network'); },
    });
    await s.refresh();
    expect(s.boostForPath('/anything')).toBe(1);
  });

  it('falls back when response body is not an object', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: true, status: 200, json: async () => null, text: async () => '' });
    const s = new HotspotService({ baseUrl: 'http://x', fetchImpl });
    await s.refresh();
    expect(s.boostForPath('/x')).toBe(1);
  });

  it('falls back when hotspots field is not an array', async () => {
    const s = new HotspotService({ baseUrl: 'http://x', fetchImpl: fetchOk({ hotspots: 'oops' }) });
    await s.refresh();
    expect(s.boostForPath('/x')).toBe(1);
  });

  it('sends Bearer token when configured', async () => {
    let captured: Record<string, string> = {};
    const fetchImpl: FetchLike = async (_url, init) => {
      captured = init?.headers ?? {};
      return { ok: true, status: 200, json: async () => ({ hotspots: [] }), text: async () => '' };
    };
    const s = new HotspotService({ baseUrl: 'http://x', token: 't', fetchImpl });
    await s.refresh();
    expect(captured['authorization']).toBe('Bearer t');
  });

  it('omits Authorization when no token is set', async () => {
    let captured: Record<string, string> = {};
    const fetchImpl: FetchLike = async (_url, init) => {
      captured = init?.headers ?? {};
      return { ok: true, status: 200, json: async () => ({ hotspots: [] }), text: async () => '' };
    };
    const s = new HotspotService({ baseUrl: 'http://x', fetchImpl });
    await s.refresh();
    expect(captured['authorization']).toBeUndefined();
  });

  it('fromEnv returns null when SIFTCODER_CDG_URL is not set', () => {
    expect(HotspotService.fromEnv({})).toBeNull();
  });

  it('fromEnv constructs a service when URL is set', () => {
    expect(HotspotService.fromEnv({ SIFTCODER_CDG_URL: 'http://cdg' })).toBeInstanceOf(HotspotService);
  });

  it('fromEnv defaults to process.env when no env arg is passed', () => {
    const orig = process.env['SIFTCODER_CDG_URL'];
    process.env['SIFTCODER_CDG_URL'] = 'http://from-process';
    try {
      expect(HotspotService.fromEnv()).toBeInstanceOf(HotspotService);
    } finally {
      if (orig === undefined) delete process.env['SIFTCODER_CDG_URL'];
      else process.env['SIFTCODER_CDG_URL'] = orig;
    }
  });
});

describe('hotspotBoostFn', () => {
  function hit(eventId: number): HybridHit {
    return { id: 1, eventId, text: 't', ts: 0, score: 1 };
  }

  it('returns boost based on the source event file_path', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Edit', payload: { tool_input: { file_path: '/hot.ts' } } });
    const svc = new HotspotService({
      baseUrl: 'http://x',
      fetchImpl: fetchOk({ hotspots: [{ path: '/hot.ts', temperature: 100 }] }),
    });
    await svc.refresh();
    const fn = hotspotBoostFn(storage, svc);
    expect(await fn(hit(eid))).toBeGreaterThan(1);
  });

  it('returns 1 when the event is missing', async () => {
    const svc = new HotspotService({ baseUrl: 'http://x', fetchImpl: fetchOk({ hotspots: [] }) });
    expect(await hotspotBoostFn(storage, svc)(hit(999))).toBe(1);
  });

  it('returns 1 when the event payload is invalid JSON', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { tool_input: { file_path: '/x' } } });
    db.prepare('UPDATE events SET payload_json = ? WHERE id = ?').run('not-json', eid);
    const svc = new HotspotService({ baseUrl: 'http://x', fetchImpl: fetchOk({ hotspots: [] }) });
    expect(await hotspotBoostFn(storage, svc)(hit(eid))).toBe(1);
  });

  it('returns 1 when payload is not an object', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: 'plain' });
    const svc = new HotspotService({ baseUrl: 'http://x', fetchImpl: fetchOk({ hotspots: [] }) });
    expect(await hotspotBoostFn(storage, svc)(hit(eid))).toBe(1);
  });

  it('returns 1 when tool_input is missing or not an object', async () => {
    const eid1 = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: { foo: 'bar' } });
    const eid2 = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: { tool_input: 'string' } });
    const svc = new HotspotService({ baseUrl: 'http://x', fetchImpl: fetchOk({ hotspots: [] }) });
    expect(await hotspotBoostFn(storage, svc)(hit(eid1))).toBe(1);
    expect(await hotspotBoostFn(storage, svc)(hit(eid2))).toBe(1);
  });

  it('reads file_path from path or notebook_path fallbacks', async () => {
    const eid1 = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { tool_input: { path: '/hot.ts' } } });
    const eid2 = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { tool_input: { notebook_path: '/hot.ts' } } });
    const svc = new HotspotService({
      baseUrl: 'http://x',
      fetchImpl: fetchOk({ hotspots: [{ path: '/hot.ts', temperature: 100 }] }),
    });
    await svc.refresh();
    const fn = hotspotBoostFn(storage, svc);
    expect(await fn(hit(eid1))).toBeGreaterThan(1);
    expect(await fn(hit(eid2))).toBeGreaterThan(1);
  });

  it('returns 1 when no path field is present in tool_input', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { tool_input: { command: 'ls' } } });
    const svc = new HotspotService({ baseUrl: 'http://x', fetchImpl: fetchOk({ hotspots: [] }) });
    expect(await hotspotBoostFn(storage, svc)(hit(eid))).toBe(1);
  });
});
