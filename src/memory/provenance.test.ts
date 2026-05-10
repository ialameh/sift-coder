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

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'prov-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = await Storage.init(db);
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

describe('ProvenanceStore.subgraph', () => {
  it('returns a deduped node + edge set within maxDepth in both directions', async () => {
    // a → b → c, and d → b. Seed at b with depth 1, direction both → nodes b, a, c, d.
    await prov.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'b' }, to: { kind: 'n', id: 'c' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'd' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    const sg = await prov.subgraph({ kind: 'n', id: 'b' }, { maxDepth: 1, direction: 'both' });
    const ids = sg.nodes.map(n => n.id).sort();
    expect(ids).toEqual(['a', 'b', 'c', 'd']);
    expect(sg.edges).toHaveLength(3);
  });

  it('respects direction=out (no upstream incoming edges)', async () => {
    await prov.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'b' }, to: { kind: 'n', id: 'c' }, edgeType: 'causes' });
    const sg = await prov.subgraph({ kind: 'n', id: 'b' }, { maxDepth: 1, direction: 'out' });
    expect(sg.nodes.map(n => n.id).sort()).toEqual(['b', 'c']);
  });

  it('respects direction=in', async () => {
    await prov.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'b' }, to: { kind: 'n', id: 'c' }, edgeType: 'causes' });
    const sg = await prov.subgraph({ kind: 'n', id: 'b' }, { maxDepth: 1, direction: 'in' });
    expect(sg.nodes.map(n => n.id).sort()).toEqual(['a', 'b']);
  });

  it('caps edges via maxEdges to protect hubs', async () => {
    for (let i = 0; i < 20; i++) {
      await prov.addEdge({ from: { kind: 'n', id: 'hub' }, to: { kind: 'n', id: 'leaf-' + i }, edgeType: 'references' });
    }
    const sg = await prov.subgraph({ kind: 'n', id: 'hub' }, { maxDepth: 1, maxEdges: 5 });
    expect(sg.edges).toHaveLength(5);
  });

  it('honours edgeType filter', async () => {
    await prov.addEdge({ from: { kind: 'n', id: 'x' }, to: { kind: 'n', id: 'y' }, edgeType: 'edits' });
    await prov.addEdge({ from: { kind: 'n', id: 'x' }, to: { kind: 'n', id: 'z' }, edgeType: 'references' });
    const sg = await prov.subgraph({ kind: 'n', id: 'x' }, { maxDepth: 1, direction: 'out', edgeType: 'edits' });
    expect(sg.edges).toHaveLength(1);
    expect(sg.edges[0]!.to.id).toBe('y');
  });

  it('returns the seed even when isolated', async () => {
    const sg = await prov.subgraph({ kind: 'n', id: 'lonely' }, { maxDepth: 3 });
    expect(sg.nodes).toEqual([{ kind: 'n', id: 'lonely' }]);
    expect(sg.edges).toEqual([]);
  });
});

describe('ProvenanceStore.shortestPath', () => {
  it('returns an empty path when source equals target', async () => {
    const p = await prov.shortestPath({ kind: 'n', id: 'x' }, { kind: 'n', id: 'x' });
    expect(p).toEqual([]);
  });

  it('returns null when no path exists', async () => {
    await prov.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'c' }, to: { kind: 'n', id: 'd' }, edgeType: 'causes' });
    expect(await prov.shortestPath({ kind: 'n', id: 'a' }, { kind: 'n', id: 'c' })).toBeNull();
  });

  it('finds a 1-hop path along a single outgoing edge', async () => {
    await prov.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    const p = await prov.shortestPath({ kind: 'n', id: 'a' }, { kind: 'n', id: 'b' });
    expect(p).toHaveLength(1);
    expect(p![0]!.from.id).toBe('a');
    expect(p![0]!.to.id).toBe('b');
  });

  it('treats the graph as undirected for connectivity', async () => {
    // a → b → c. Asking for c → a should still return a path.
    await prov.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'b' }, to: { kind: 'n', id: 'c' }, edgeType: 'causes' });
    const p = await prov.shortestPath({ kind: 'n', id: 'c' }, { kind: 'n', id: 'a' });
    expect(p).toHaveLength(2);
  });

  it('finds the shortest of two competing routes', async () => {
    // Long path: a → b → c → d → e. Short path: a → e.
    await prov.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'b' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'b' }, to: { kind: 'n', id: 'c' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'c' }, to: { kind: 'n', id: 'd' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'd' }, to: { kind: 'n', id: 'e' }, edgeType: 'causes' });
    await prov.addEdge({ from: { kind: 'n', id: 'a' }, to: { kind: 'n', id: 'e' }, edgeType: 'causes' });
    const p = await prov.shortestPath({ kind: 'n', id: 'a' }, { kind: 'n', id: 'e' });
    expect(p).toHaveLength(1);
  });

  it('respects maxDepth — deep targets return null when capped', async () => {
    let prev = 'n0';
    for (let i = 1; i <= 8; i++) {
      const cur = 'n' + i;
      await prov.addEdge({ from: { kind: 'n', id: prev }, to: { kind: 'n', id: cur }, edgeType: 'causes' });
      prev = cur;
    }
    const within = await prov.shortestPath({ kind: 'n', id: 'n0' }, { kind: 'n', id: 'n8' }, 3);
    expect(within).toBeNull();
    const beyond = await prov.shortestPath({ kind: 'n', id: 'n0' }, { kind: 'n', id: 'n8' }, 10);
    expect(beyond).toHaveLength(8);
  });
});

describe('ProvenanceStore.topHubs', () => {
  it('ranks nodes by total degree (in + out)', async () => {
    // hub gets 3 outgoing; quiet gets 1 incoming.
    await prov.addEdge({ from: { kind: 'file', id: 'hub.ts' }, to: { kind: 'file', id: 'a' }, edgeType: 'imports' });
    await prov.addEdge({ from: { kind: 'file', id: 'hub.ts' }, to: { kind: 'file', id: 'b' }, edgeType: 'imports' });
    await prov.addEdge({ from: { kind: 'file', id: 'hub.ts' }, to: { kind: 'file', id: 'c' }, edgeType: 'imports' });
    await prov.addEdge({ from: { kind: 'file', id: 'q' }, to: { kind: 'file', id: 'quiet' }, edgeType: 'imports' });
    const hubs = await prov.topHubs(5);
    expect(hubs[0]!.node.id).toBe('hub.ts');
    expect(hubs[0]!.degree).toBe(3);
    expect(hubs[0]!.outDegree).toBe(3);
    expect(hubs[0]!.inDegree).toBe(0);
  });

  it('filters by node kind', async () => {
    await prov.addEdge({ from: { kind: 'file', id: 'a.ts' }, to: { kind: 'file', id: 'b.ts' }, edgeType: 'imports' });
    await prov.addEdge({ from: { kind: 'symbol', id: 'fn:x' }, to: { kind: 'symbol', id: 'fn:y' }, edgeType: 'calls' });
    const fileHubs = await prov.topHubs(10, 'file');
    expect(fileHubs.every(h => h.node.kind === 'file')).toBe(true);
    expect(fileHubs).toHaveLength(2);
  });
});
