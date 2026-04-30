import { describe, it, expect } from 'vitest';
import { rerank, tokenize } from './reranker.js';
import type { HybridHit } from './retrieval.js';

function hit(id: number, text: string, score = 0.05): HybridHit {
  return { id, eventId: id, text, ts: 0, score };
}

describe('tokenize', () => {
  it('lowercases and drops stopwords', () => {
    expect(tokenize('The QUICK fox')).toEqual(['quick', 'fox']);
  });

  it('keeps tokens with hyphens, underscores, digits', () => {
    expect(tokenize('foo_bar test-case v2')).toEqual(['foo_bar', 'test-case', 'v2']);
  });

  it('returns empty array for whitespace input', () => {
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('rerank', () => {
  it('returns empty array for empty input', () => {
    expect(rerank('q', [])).toEqual([]);
  });

  it('returns the input slice when query has no informative tokens', () => {
    const hs = [hit(1, 'auth login'), hit(2, 'database migration')];
    const out = rerank('the a of', hs, { k: 1 });
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe(1);
  });

  it('boosts documents that contain query terms', () => {
    const hs = [
      hit(1, 'unrelated content here'),
      hit(2, 'auth login session token'),
    ];
    const out = rerank('auth login', hs);
    expect(out[0]!.id).toBe(2);
  });

  it('applies an exact-phrase bonus when the full query appears verbatim', () => {
    const hs = [
      hit(1, 'session and token, separately'),
      hit(2, 'session token in one phrase'),
    ];
    const out = rerank('session token', hs);
    expect(out[0]!.id).toBe(2);
  });

  it('applies a length penalty against very long documents', () => {
    const short = hit(1, 'auth login');
    const padding = ' '.repeat(0) + Array.from({ length: 200 }, (_, i) => `word${i}`).join(' ');
    const long = hit(2, `auth login ${padding}`);
    const out = rerank('auth login', [short, long]);
    expect(out[0]!.id).toBe(1);
  });

  it('honors the k limit', () => {
    const hs = Array.from({ length: 8 }, (_, i) => hit(i + 1, `auth ${i}`));
    expect(rerank('auth', hs, { k: 3 })).toHaveLength(3);
  });

  it('falls back gracefully when no document contains a query term', () => {
    const hs = [hit(1, 'one'), hit(2, 'two')];
    const out = rerank('zzz', hs);
    expect(out).toHaveLength(2);
  });

  it('respects custom phrase and exact-term bonuses', () => {
    const hs = [
      hit(1, 'auth and session separate'),
      hit(2, 'auth session together'),
    ];
    const aggressive = rerank('auth session', hs, { phraseBonus: 5, exactTermBonus: 0 });
    expect(aggressive[0]!.id).toBe(2);
  });

  it('does not double-count the exact-term bonus when a query token repeats', () => {
    const hs = [hit(1, 'auth login'), hit(2, 'auth')];
    const out = rerank('auth auth login', hs, { exactTermBonus: 100 });
    expect(out[0]).toBeDefined();
  });

  it('skips query tokens that do not appear in any document term frequencies', () => {
    const hs = [hit(1, 'alpha beta gamma')];
    const out = rerank('zzz', hs);
    expect(out[0]!.score).toBeLessThanOrEqual(hs[0]!.score);
  });
});
