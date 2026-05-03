import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from './storage/storage.js';
import { ProvenanceStore, ingestFromCdg } from './provenance.js';
import type { FetchLike } from './cdg-adapter.js';

let dir: string;
let db: Database.Database;
let storage: Storage;
let prov: ProvenanceStore;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'prov-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = new Storage(db);
  prov = new ProvenanceStore(storage);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('ProvenanceStore.addEdge', () => {
  it('persists an edge and returns its id', async () => {
    const id = await prov.addEdge({
      from: { kind: 'event', id: '1' },
      to: { kind: 'summary', id: '7' },
      edgeType: 'derives_from',
      confidence: 0.9,
      source: 'siftcoder',
    });
    expect(id).toBeGreaterThan(0);
  });

  it('uses defaults for confidence, source, and ts when not provided', async () => {
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' }, edgeType: 'causes' });
    const out = await prov.outgoing({ kind: 'a', id: '1' });
    expect(out[0]!.confidence).toBe(1.0);
    expect(out[0]!.source).toBe('siftcoder');
    expect(out[0]!.ts).toBeGreaterThan(0);
  });

  it('serializes meta to JSON', async () => {
    await prov.addEdge({
      from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' },
      edgeType: 'causes', meta: { reason: 'flake' },
    });
    const e = (await prov.outgoing({ kind: 'a', id: '1' }))[0]!;
    expect(e.meta).toEqual({ reason: 'flake' });
  });

  it('round-trips a null meta correctly', async () => {
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' }, edgeType: 'causes' });
    expect((await prov.outgoing({ kind: 'a', id: '1' }))[0]!.meta).toBeNull();
  });
});

describe('ProvenanceStore.outgoing / incoming', () => {
  it('lists all outgoing edges from a node', async () => {
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'c', id: '3' }, edgeType: 'derives_from' });
    await prov.addEdge({ from: { kind: 'd', id: '4' }, to: { kind: 'a', id: '1' }, edgeType: 'edits' });
    expect(await prov.outgoing({ kind: 'a', id: '1' })).toHaveLength(2);
  });

  it('filters outgoing by edge type', async () => {
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'c', id: '3' }, edgeType: 'derives_from' });
    await prov.addEdge({ from: { kind: 'd', id: '4' }, to: { kind: 'a', id: '1' }, edgeType: 'edits' });
    expect(await prov.outgoing({ kind: 'a', id: '1' }, 'causes')).toHaveLength(1);
  });

  it('lists incoming edges into a node', async () => {
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'c', id: '3' }, edgeType: 'derives_from' });
    await prov.addEdge({ from: { kind: 'd', id: '4' }, to: { kind: 'a', id: '1' }, edgeType: 'edits' });
    expect(await prov.incoming({ kind: 'a', id: '1' })).toHaveLength(1);
  });

  it('filters incoming by edge type', async () => {
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'b', id: '2' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'a', id: '1' }, to: { kind: 'c', id: '3' }, edgeType: 'derives_from' });
    await prov.addEdge({ from: { kind: 'd', id: '4' }, to: { kind: 'a', id: '1' }, edgeType: 'edits' });
    expect(await prov.incoming({ kind: 'a', id: '1' }, 'edits')).toHaveLength(1);
    expect(await prov.incoming({ kind: 'a', id: '1' }, 'causes')).toHaveLength(0);
  });
});

describe('ProvenanceStore.trace', () => {
  it('walks outgoing edges up to maxDepth', async () => {
    await prov.addEdge({ from: { kind: 'n', id: 'A' }, to: { kind: 'n', id: 'B' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'B' }, to: { kind: 'n', id: 'C' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'C' }, to: { kind: 'n', id: 'D' }, edgeType: 'causes' });
    const depth2 = await prov.trace({ kind: 'n', id: 'A' }, 2);
    expect(depth2.map(e => e.to.id)).toEqual(['B', 'C']);
  });

  it('returns empty when no edges from the start node', async () => {
    expect(await prov.trace({ kind: 'n', id: 'orphan' })).toEqual([]);
  });

  it('does not revisit nodes in a cycle', async () => {
    await prov.addEdge({ from: { kind: 'n', id: 'A' }, to: { kind: 'n', id: 'B' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'B' }, to: { kind: 'n', id: 'A' }, edgeType: 'causes' });
    const trace = await prov.trace({ kind: 'n', id: 'A' }, 5);
    expect(trace.length).toBeLessThanOrEqual(2);
  });
});

describe('ingestFromCdg', () => {
  function fetchOk(body: unknown): FetchLike {
    return async () => ({ ok: true, status: 200, json: async () => body, text: async () => '' });
  }

  it('persists CDG dependency edges as file→file imports', async () => {
    const r = await ingestFromCdg(prov, {
      baseUrl: 'http://x',
      fetchImpl: fetchOk({
        edges: [{ from_path: '/a.ts', to_path: '/b.ts', edge_type: 'imports', confidence: 0.9 }],
      }),
    });
    expect(r.edges).toBe(1);
    expect(await prov.outgoing({ kind: 'file', id: '/a.ts' })).toHaveLength(1);
  });

  it('persists CDG references as symbol→symbol calls', async () => {
    const r = await ingestFromCdg(prov, {
      baseUrl: 'http://x',
      fetchImpl: fetchOk({
        references: [{ from_symbol: 'fn:a', to_symbol: 'fn:b', ref_type: 'calls', confidence: 0.8 }],
      }),
    });
    expect(r.references).toBe(1);
    expect(await prov.outgoing({ kind: 'symbol', id: 'fn:a' })).toHaveLength(1);
  });

  it('skips invalid edge entries', async () => {
    const r = await ingestFromCdg(prov, {
      baseUrl: 'http://x',
      fetchImpl: fetchOk({
        edges: [
          null,
          { from_path: 'a' },
          { to_path: 'b' },
          'string',
          { from_path: '/a', to_path: '/b' },
        ],
      }),
    });
    expect(r.edges).toBe(1);
  });

  it('skips invalid reference entries', async () => {
    const r = await ingestFromCdg(prov, {
      baseUrl: 'http://x',
      fetchImpl: fetchOk({
        references: [null, { from_symbol: 'a' }, { to_symbol: 'b' }, 42, { from_symbol: 'a', to_symbol: 'b' }],
      }),
    });
    expect(r.references).toBe(1);
  });

  it('coerces unknown edge_type values to references', async () => {
    await ingestFromCdg(prov, {
      baseUrl: 'http://x',
      fetchImpl: fetchOk({ edges: [{ from_path: '/a', to_path: '/b', edge_type: 'made_up' }] }),
    });
    const e = (await prov.outgoing({ kind: 'file', id: '/a' }))[0]!;
    expect(e.edgeType).toBe('references');
  });

  it('returns zero counts on non-2xx', async () => {
    const r = await ingestFromCdg(prov, {
      baseUrl: 'http://x',
      fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}), text: async () => '' }),
    });
    expect(r).toEqual({ edges: 0, references: 0 });
  });

  it('returns zero counts on fetch error', async () => {
    const r = await ingestFromCdg(prov, {
      baseUrl: 'http://x',
      fetchImpl: async () => { throw new Error('boom'); },
    });
    expect(r).toEqual({ edges: 0, references: 0 });
  });

  it('handles a body with neither edges nor references', async () => {
    const r = await ingestFromCdg(prov, { baseUrl: 'http://x', fetchImpl: fetchOk({}) });
    expect(r).toEqual({ edges: 0, references: 0 });
  });

  it('sends Bearer header when token is set and uses configured endpoint', async () => {
    let calledUrl = '';
    let captured: Record<string, string> = {};
    const fetchImpl: FetchLike = async (url, init) => {
      calledUrl = url;
      captured = init?.headers ?? {};
      return { ok: true, status: 200, json: async () => ({ edges: [] }), text: async () => '' };
    };
    await ingestFromCdg(prov, { baseUrl: 'http://x///', endpoint: '/v2/dep', token: 't', fetchImpl });
    expect(calledUrl).toBe('http://x/v2/dep');
    expect(captured['authorization']).toBe('Bearer t');
  });

  it('clamps invalid confidence values', async () => {
    await ingestFromCdg(prov, {
      baseUrl: 'http://x',
      fetchImpl: fetchOk({ edges: [
        { from_path: '/a', to_path: '/b', edge_type: 'imports', confidence: 'NaN' },
        { from_path: '/c', to_path: '/d', edge_type: 'imports', confidence: -0.5 },
        { from_path: '/e', to_path: '/f', edge_type: 'imports', confidence: 5 },
      ] }),
    });
    const a = (await prov.outgoing({ kind: 'file', id: '/a' }))[0]!;
    const c = (await prov.outgoing({ kind: 'file', id: '/c' }))[0]!;
    const e = (await prov.outgoing({ kind: 'file', id: '/e' }))[0]!;
    expect(a.confidence).toBe(1);
    expect(c.confidence).toBe(0);
    expect(e.confidence).toBe(1);
  });
});
