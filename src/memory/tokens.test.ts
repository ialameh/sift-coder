import { describe, it, expect } from 'vitest';
import { approximate, countTokens, countPayloadTokens } from './tokens.js';

describe('approximate', () => {
  it('returns 0 for empty input', () => {
    expect(approximate('')).toBe(0);
  });

  it('returns ceil(length / 4) for non-empty input', () => {
    expect(approximate('hello world')).toBe(3);
    expect(approximate('a'.repeat(40))).toBe(10);
  });
});

describe('countTokens', () => {
  it('returns 0 for empty input', async () => {
    expect(await countTokens('')).toBe(0);
  });

  it('returns a positive count for non-empty input', async () => {
    expect(await countTokens('hello world')).toBeGreaterThan(0);
  });
});

describe('countPayloadTokens', () => {
  it('returns 0 for null and undefined', async () => {
    expect(await countPayloadTokens(null)).toBe(0);
    expect(await countPayloadTokens(undefined)).toBe(0);
  });

  it('counts tokens for a string', async () => {
    expect(await countPayloadTokens('hello')).toBeGreaterThan(0);
  });

  it('counts tokens for an object via JSON serialization', async () => {
    expect(await countPayloadTokens({ a: 1, b: 'two' })).toBeGreaterThan(0);
  });
});
