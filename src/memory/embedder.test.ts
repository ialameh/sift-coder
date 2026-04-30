import { describe, it, expect } from 'vitest';
import { DeterministicEmbedder, l2Normalize, cosine } from './embedder.js';

describe('l2Normalize', () => {
  it('produces a unit-norm vector', async () => {
    const v = Float32Array.from([3, 4]);
    const n = l2Normalize(v);
    expect(Math.hypot(n[0]!, n[1]!)).toBeCloseTo(1, 6);
  });

  it('returns the same vector when norm is zero', () => {
    const v = Float32Array.from([0, 0]);
    expect(Array.from(l2Normalize(v))).toEqual([0, 0]);
  });
});

describe('cosine', () => {
  it('returns 1 for identical unit vectors', () => {
    const a = l2Normalize(Float32Array.from([1, 0, 0]));
    expect(cosine(a, a)).toBeCloseTo(1, 6);
  });

  it('returns 0 for orthogonal vectors', () => {
    const a = Float32Array.from([1, 0]);
    const b = Float32Array.from([0, 1]);
    expect(cosine(a, b)).toBe(0);
  });

  it('truncates to the shorter input', () => {
    const a = Float32Array.from([1, 0, 0, 0]);
    const b = Float32Array.from([1, 0]);
    expect(cosine(a, b)).toBe(1);
  });
});

describe('DeterministicEmbedder', () => {
  it('embeds equal strings to equal vectors', async () => {
    const e = new DeterministicEmbedder(64);
    const a = await e.embed('hello world');
    const b = await e.embed('hello world');
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it('embeds different strings to different vectors', async () => {
    const e = new DeterministicEmbedder(64);
    const a = await e.embed('alpha');
    const b = await e.embed('beta');
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });

  it('returns a zero vector for empty / whitespace input', async () => {
    const e = new DeterministicEmbedder(32);
    const v = await e.embed('   ');
    expect(Array.from(v).every(x => x === 0)).toBe(true);
  });

  it('produces unit-norm vectors for non-empty input', async () => {
    const e = new DeterministicEmbedder(32);
    const v = await e.embed('alpha beta gamma');
    let s = 0;
    for (const x of v) s += x * x;
    expect(Math.sqrt(s)).toBeCloseTo(1, 6);
  });

  it('exposes the configured dim', () => {
    expect(new DeterministicEmbedder(128).dim).toBe(128);
  });

  it('defaults to 384 dimensions', () => {
    expect(new DeterministicEmbedder().dim).toBe(384);
  });

  it('related strings have higher cosine than unrelated ones', async () => {
    const e = new DeterministicEmbedder(512);
    const auth = await e.embed('user authentication login session token');
    const authClose = await e.embed('user authentication session');
    const unrelated = await e.embed('database migration schema column');
    expect(cosine(auth, authClose)).toBeGreaterThan(cosine(auth, unrelated));
  });
});
