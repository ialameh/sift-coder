import { describe, it, expect, beforeEach } from 'vitest';
import { hybridSearch, DEFAULT_DECAY_TAU_MS_BY_TOOL, resetRerankCorpusCache } from './retrieval.js';
import { Storage, type DBHandle, type SearchHit, type SummaryRow } from './storage/storage.js';
import { DeterministicEmbedder } from './embedder.js';

interface VecRow { sid: number; dim: number; vec: Buffer; ts: number }

class FakeDB implements DBHandle {
  summaries: SummaryRow[] = [];
  ftsRanked: SearchHit[] = [];
  embeddings: VecRow[] = [];
  superseded: Array<{ older_id: number }> = [];

  exec(): void { /* noop */ }
  loadExtension(): void { throw new Error('no'); }

  prepare(sql: string) {
    const stmt = sql.trim();
    if (stmt.includes('summaries_fts MATCH')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: (q: unknown, k: unknown) => this.ftsRanked
          .filter(h => h.text.toLowerCase().includes(String(q).toLowerCase()))
          .slice(0, k as number),
      };
    }
    if (stmt.includes('FROM summaries WHERE id IN')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: (...ids: unknown[]) => this.summaries
          .filter(s => ids.includes(s.id))
          .map(s => ({
            id: s.id, event_id: s.eventId, ts: s.ts, model: s.model,
            prompt_hash: s.promptHash, text: s.text,
            tokens_in: s.tokensIn, tokens_out: s.tokensOut, confidence: s.confidence,
          })),
      };
    }
    if (stmt.includes('FROM summary_embeddings e')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: () => this.embeddings.map(r => ({ ...r, tool: null })),
      };
    }
    if (stmt.startsWith('SELECT older_id FROM summary_supersedes')) {
      return {
        run: () => ({ lastInsertRowid: 0 }),
        get: () => undefined,
        all: () => this.superseded,
      };
    }
    return { run: () => ({ lastInsertRowid: 0 }), get: () => undefined, all: () => [] };
  }
}

let db: FakeDB;
let storage: Storage;
const e = new DeterministicEmbedder(256);

function addSummary(s: SummaryRow, ftsRank?: number): void {
  db.summaries.push(s);
  if (ftsRank !== undefined) {
    db.ftsRanked.splice(ftsRank, 0, {
      id: s.id, eventId: s.eventId, text: s.text, ts: s.ts, score: -ftsRank,
    });
  }
}

async function addEmbedding(s: SummaryRow): Promise<void> {
  const v = await e.embed(s.text);
  const buf = Buffer.from(v.buffer, v.byteOffset, v.byteLength);
  db.embeddings.push({ sid: s.id, dim: v.length, vec: buf, ts: s.ts });
}

beforeEach(async () => {
  db = new FakeDB();
  storage = await Storage.init(db);
});

describe('hybridSearch', () => {
  it('fuses BM25 and vector rankings via RRF', async () => {
    const a: SummaryRow = { id: 1, eventId: 1, ts: 0, model: 'm', promptHash: 'p', text: 'auth login session', tokensIn: null, tokensOut: null, confidence: null };
    const b: SummaryRow = { id: 2, eventId: 2, ts: 0, model: 'm', promptHash: 'p', text: 'database migration', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(a, 0); addSummary(b, 1);
    await addEmbedding(a); await addEmbedding(b);
    const hits = await hybridSearch(storage, e, 'auth', 0, { decayTauMs: 1e15 });
    expect(hits[0]!.id).toBe(1);
  });

  it('returns BM25-only results when no embedder is provided', async () => {
    const a: SummaryRow = { id: 1, eventId: 1, ts: 0, model: 'm', promptHash: 'p', text: 'auth', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(a, 0);
    const hits = await hybridSearch(storage, null, 'auth', 0, { decayTauMs: 1e15 });
    expect(hits[0]!.id).toBe(1);
    expect(hits[0]!.vecRank).toBeUndefined();
  });

  it('applies recency decay to score older summaries lower', async () => {
    const now = 1_000_000;
    const fresh: SummaryRow = { id: 1, eventId: 1, ts: now, model: 'm', promptHash: 'p', text: 'auth', tokensIn: null, tokensOut: null, confidence: null };
    const old: SummaryRow = { id: 2, eventId: 2, ts: 0, model: 'm', promptHash: 'p', text: 'auth', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(fresh, 1); addSummary(old, 0);
    const hits = await hybridSearch(storage, null, 'auth', now, { decayTauMs: 1000 });
    expect(hits[0]!.id).toBe(1);
    expect(hits[0]!.recency!).toBeGreaterThan(hits[1]!.recency!);
  });

  it('drops superseded summaries from results', async () => {
    const a: SummaryRow = { id: 1, eventId: 1, ts: 0, model: 'm', promptHash: 'p', text: 'auth', tokensIn: null, tokensOut: null, confidence: null };
    const b: SummaryRow = { id: 2, eventId: 2, ts: 0, model: 'm', promptHash: 'p', text: 'auth login', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(a, 0); addSummary(b, 1);
    db.superseded.push({ older_id: 1 });
    const hits = await hybridSearch(storage, null, 'auth', 0, { decayTauMs: 1e15 });
    expect(hits.map(h => h.id)).toEqual([2]);
  });

  it('honors the k limit', async () => {
    for (let i = 1; i <= 10; i++) {
      const s: SummaryRow = { id: i, eventId: i, ts: 0, model: 'm', promptHash: 'p', text: `auth ${i}`, tokensIn: null, tokensOut: null, confidence: null };
      addSummary(s, i - 1);
    }
    const hits = await hybridSearch(storage, null, 'auth', 0, { k: 3, decayTauMs: 1e15 });
    expect(hits).toHaveLength(3);
  });

  it('weights BM25 vs vector via configurable scalars', async () => {
    const a: SummaryRow = { id: 1, eventId: 1, ts: 0, model: 'm', promptHash: 'p', text: 'auth login', tokensIn: null, tokensOut: null, confidence: null };
    const b: SummaryRow = { id: 2, eventId: 2, ts: 0, model: 'm', promptHash: 'p', text: 'token bearer auth', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(a, 0); addSummary(b, 1);
    await addEmbedding(a); await addEmbedding(b);
    const bm25Heavy = await hybridSearch(storage, e, 'auth login', 0, { bm25Weight: 10, vectorWeight: 0.01, decayTauMs: 1e15 });
    expect(bm25Heavy[0]!.id).toBe(1);
  });

  it('handles vector-only candidates when BM25 misses entirely', async () => {
    const a: SummaryRow = { id: 1, eventId: 1, ts: 0, model: 'm', promptHash: 'p', text: 'session bearer cookie', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(a);
    await addEmbedding(a);
    const hits = await hybridSearch(storage, e, 'session bearer cookie', 0, { decayTauMs: 1e15 });
    expect(hits[0]!.id).toBe(1);
    expect(hits[0]!.bm25Rank).toBeUndefined();
    expect(hits[0]!.vecRank).toBe(1);
  });

  it('applies a custom boostFn before sorting', async () => {
    const a: SummaryRow = { id: 1, eventId: 1, ts: 0, model: 'm', promptHash: 'p', text: 'auth login', tokensIn: null, tokensOut: null, confidence: null };
    const b: SummaryRow = { id: 2, eventId: 2, ts: 0, model: 'm', promptHash: 'p', text: 'auth', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(a, 0); addSummary(b, 1);
    const hits = await hybridSearch(storage, null, 'auth', 0, {
      decayTauMs: 1e15,
      boostFn: hit => (hit.id === 2 ? 100 : 1),
    });
    expect(hits[0]!.id).toBe(2);
  });

  it('routes through an async reranker when one is provided', async () => {
    const a: SummaryRow = { id: 1, eventId: 1, ts: 0, model: 'm', promptHash: 'p', text: 'auth', tokensIn: null, tokensOut: null, confidence: null };
    const b: SummaryRow = { id: 2, eventId: 2, ts: 0, model: 'm', promptHash: 'p', text: 'auth login', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(a, 0); addSummary(b, 1);
    const reranker = {
      rerank: async (_q: string, hits: typeof a extends infer _ ? Array<{ id: number; eventId: number; text: string; ts: number; score: number }> : never) =>
        hits.slice().reverse(),
    };
    const hits = await hybridSearch(storage, null, 'auth', 0, { decayTauMs: 1e15, asyncReranker: reranker });
    expect(hits[0]!.id).toBe(2);
  });

  it('applies the reranker when requested', async () => {
    const a: SummaryRow = { id: 1, eventId: 1, ts: 0, model: 'm', promptHash: 'p', text: 'auth and session separate', tokensIn: null, tokensOut: null, confidence: null };
    const b: SummaryRow = { id: 2, eventId: 2, ts: 0, model: 'm', promptHash: 'p', text: 'auth session together', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(a, 0); addSummary(b, 1);
    const hits = await hybridSearch(storage, null, 'auth session', 0, { rerank: true, decayTauMs: 1e15 });
    expect(hits[0]!.id).toBe(2);
  });

  it('skips candidate ids whose summary row is missing entirely', async () => {
    db.embeddings.push({ sid: 999, dim: 0, vec: Buffer.alloc(0), ts: 0 });
    const hits = await hybridSearch(storage, e, 'anything', 0);
    expect(hits.find(h => h.id === 999)).toBeUndefined();
  });

  it('exposes a default per-tool decay map favouring code edits', () => {
    expect(DEFAULT_DECAY_TAU_MS_BY_TOOL['Edit']).toBeGreaterThan(DEFAULT_DECAY_TAU_MS_BY_TOOL['Bash']!);
    expect(DEFAULT_DECAY_TAU_MS_BY_TOOL['Write']).toBeGreaterThan(DEFAULT_DECAY_TAU_MS_BY_TOOL['Read']!);
  });

  it('per-tool decay favors code-edit summaries over old bash output of equal RRF rank', async () => {
    const oldEditTs = -10 * 24 * 60 * 60 * 1000; // 10 days old
    const oldBashTs = -10 * 24 * 60 * 60 * 1000; // same age
    const editRow: SummaryRow = { id: 1, eventId: 1, ts: oldEditTs, model: 'm', promptHash: 'p', text: 'refactored auth.ts to use jwt', tokensIn: null, tokensOut: null, confidence: null };
    const bashRow: SummaryRow = { id: 2, eventId: 2, ts: oldBashTs, model: 'm', promptHash: 'p', text: 'ran ls in src directory', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(editRow);
    addSummary(bashRow);
    // Push tool-bearing FTS hits so the per-tool decay path is exercised. Both match the query
    // identically, but `Edit` has a 30-day tau vs `Bash`'s 3-day tau, so the edit ranks higher.
    db.ftsRanked.push({ id: 1, eventId: 1, text: editRow.text, ts: oldEditTs, score: -1, tool: 'Edit' });
    db.ftsRanked.push({ id: 2, eventId: 2, text: bashRow.text, ts: oldBashTs, score: -1, tool: 'Bash' });
    const hits = await hybridSearch(storage, null, 'auth', 0);
    expect(hits[0]!.id).toBe(1);
    expect(hits[0]!.tool).toBe('Edit');
  });

  it('per-tool decay falls back to global tau when tool is unknown', async () => {
    resetRerankCorpusCache();
    const ts = -1 * 24 * 60 * 60 * 1000;
    const row: SummaryRow = { id: 1, eventId: 1, ts, model: 'm', promptHash: 'p', text: 'auth fact', tokensIn: null, tokensOut: null, confidence: null };
    addSummary(row);
    db.ftsRanked.push({ id: 1, eventId: 1, text: row.text, ts, score: -1, tool: 'BrandNewTool' });
    const hits = await hybridSearch(storage, null, 'auth', 0, { decayTauMs: 7 * 24 * 60 * 60 * 1000 });
    expect(hits).toHaveLength(1);
    expect(hits[0]!.recency).toBeCloseTo(Math.exp(-1 / 7), 2);
  });
});
