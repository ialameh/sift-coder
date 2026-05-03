import { describe, it, expect, beforeEach } from 'vitest';
import { ClaudeReranker, StorageRerankCache, type RerankCache } from './claude-reranker.js';
import type { ModelClient, ModelRequest, ModelResult } from './daemon/summarizer.js';
import type { HybridHit } from './retrieval.js';
import { Storage, type DBHandle } from './storage/storage.js';

class FakeClient implements ModelClient {
  scripted: string[] = [];
  calls: ModelRequest[] = [];
  async generate(req: ModelRequest): Promise<ModelResult> {
    this.calls.push(req);
    const t = this.scripted.shift() ?? '0';
    return { text: t, tokensIn: null, tokensOut: null };
  }
}

class FailingClient implements ModelClient {
  async generate(): Promise<ModelResult> { throw new Error('boom'); }
}

class MapCache implements RerankCache {
  store = new Map<string, number>();
  get(key: string): number | undefined { return this.store.get(key); }
  set(key: string, value: number): void { this.store.set(key, value); }
}

function hit(id: number, text: string, score = 0.05): HybridHit {
  return { id, eventId: id, text, ts: 0, score };
}

describe('ClaudeReranker.rerank', () => {
  it('reorders candidates by model-emitted scores', async () => {
    const c = new FakeClient();
    c.scripted.push('1', '8', '3');
    const r = new ClaudeReranker(c, { concurrency: 1 });
    const out = await r.rerank('query', [hit(1, 'a'), hit(2, 'b'), hit(3, 'c')]);
    expect(out.map(h => h.id)).toEqual([2, 3, 1]);
    expect(out[0]!.score).toBe(8);
  });

  it('parses scores from prose responses by extracting the first digit', async () => {
    const c = new FakeClient();
    c.scripted.push('Score: 7', '  4 ', 'I would say 9');
    const r = new ClaudeReranker(c, { concurrency: 1 });
    const out = await r.rerank('q', [hit(1, 'a'), hit(2, 'b'), hit(3, 'c')]);
    expect(out.map(h => h.id)).toEqual([3, 1, 2]);
  });

  it('clamps non-digit and out-of-range responses to 0', async () => {
    const c = new FakeClient();
    c.scripted.push('idk', '');
    const r = new ClaudeReranker(c, { concurrency: 1 });
    const out = await r.rerank('q', [hit(1, 'a'), hit(2, 'b')]);
    expect(out.every(h => h.score === 0)).toBe(true);
  });

  it('returns 0 for any candidate when the model call throws', async () => {
    const r = new ClaudeReranker(new FailingClient(), { concurrency: 1 });
    const out = await r.rerank('q', [hit(1, 'a')]);
    expect(out[0]!.score).toBe(0);
  });

  it('honors the k limit', async () => {
    const c = new FakeClient();
    for (let i = 0; i < 10; i++) c.scripted.push(String(i % 10));
    const r = new ClaudeReranker(c, { k: 3, concurrency: 4 });
    const hits = Array.from({ length: 10 }, (_, i) => hit(i + 1, `text-${i}`));
    expect(await r.rerank('q', hits)).toHaveLength(3);
  });

  it('returns an empty array when no candidates are passed', async () => {
    const r = new ClaudeReranker(new FakeClient());
    expect(await r.rerank('q', [])).toEqual([]);
  });

  it('respects concurrency=1 by issuing model calls sequentially', async () => {
    const c = new FakeClient();
    c.scripted.push('5', '5', '5');
    const r = new ClaudeReranker(c, { concurrency: 1 });
    await r.rerank('q', [hit(1, 'a'), hit(2, 'b'), hit(3, 'c')]);
    expect(c.calls).toHaveLength(3);
  });

  it('uses the configured model name in every call', async () => {
    const c = new FakeClient();
    c.scripted.push('5');
    const r = new ClaudeReranker(c, { model: 'claude-haiku-4-5-test' });
    await r.rerank('q', [hit(1, 'a')]);
    expect(c.calls[0]!.model).toBe('claude-haiku-4-5-test');
  });

  it('reads cached scores without invoking the model', async () => {
    const cache = new MapCache();
    const key = ClaudeReranker.cacheKey('q', 1, 'claude-haiku-4-5-20251001');
    cache.store.set(key, 9);
    const c = new FakeClient();
    const r = new ClaudeReranker(c, { cache });
    const out = await r.rerank('q', [hit(1, 'cached')]);
    expect(out[0]!.score).toBe(9);
    expect(c.calls).toHaveLength(0);
  });

  it('writes computed scores back into the cache', async () => {
    const cache = new MapCache();
    const c = new FakeClient();
    c.scripted.push('7');
    const r = new ClaudeReranker(c, { cache });
    await r.rerank('q', [hit(1, 'a')]);
    expect([...cache.store.values()]).toEqual([7]);
  });

  it('truncates very long candidate text before sending to the model', async () => {
    const c = new FakeClient();
    c.scripted.push('5');
    const r = new ClaudeReranker(c);
    const long = 'x'.repeat(5000);
    await r.rerank('q', [hit(1, long)]);
    expect(c.calls[0]!.user.length).toBeLessThan(2000);
    expect(c.calls[0]!.user).toContain('…');
  });

  it('cacheKey is deterministic and varies with inputs', () => {
    const a = ClaudeReranker.cacheKey('q', 1, 'm');
    const b = ClaudeReranker.cacheKey('q', 1, 'm');
    const c = ClaudeReranker.cacheKey('q', 2, 'm');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('StorageRerankCache', () => {
  class FakeDB implements DBHandle {
    cache = new Map<string, { text: string; tokens_in: number | null; tokens_out: number | null }>();
    exec(): Promise<void> { return Promise.resolve(); }
    loadExtension(): void { throw new Error('no'); }
    prepare(sql: string) {
      const stmt = sql.trim();
      if (stmt.startsWith('SELECT text, tokens_in, tokens_out FROM summary_cache')) {
        return Promise.resolve({
          run: () => ({ lastInsertRowid: 0 }),
          get: (k: unknown) => Promise.resolve(this.cache.get(k as string)),
          all: () => Promise.resolve([]),
        });
      }
      if (stmt.startsWith('INSERT OR REPLACE INTO summary_cache')) {
        return Promise.resolve({
          run: (k: unknown, t: unknown) => {
            this.cache.set(k as string, { text: t as string, tokens_in: null, tokens_out: null });
            return { lastInsertRowid: 0 };
          },
          get: () => Promise.resolve(undefined),
          all: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ run: () => ({ lastInsertRowid: 0 }), get: () => Promise.resolve(undefined), all: () => Promise.resolve([]) });
    }
    close(): Promise<void> { return Promise.resolve(); }
  }

  let storage: Storage;
  beforeEach(() => { storage = new Storage(new FakeDB()); });

  it('returns undefined on cache miss', async () => {
    expect(await new StorageRerankCache(storage).get('missing')).toBeUndefined();
  });

  it('round-trips an integer score through the storage cache', async () => {
    const cache = new StorageRerankCache(storage);
    await cache.set('k1', 7);
    expect(await cache.get('k1')).toBe(7);
  });

  it('returns undefined when the cached text is not a number', async () => {
    const cache = new StorageRerankCache(storage);
    await storage.putCachedSummary('k2', 'not-a-number', null, null, 0);
    expect(await cache.get('k2')).toBeUndefined();
  });
});
