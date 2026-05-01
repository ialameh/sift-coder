import { describe, it, expect } from 'vitest';
import { countTokens, approximate, countPayload, Budget } from './tokens.js';

describe('tokens', () => {
  it('countTokens returns 0 for empty', () => {
    expect(countTokens('')).toBe(0);
  });

  it('countTokens returns positive for text', () => {
    expect(countTokens('hello world')).toBeGreaterThan(0);
  });

  it('approximate returns ceil(length/4)', () => {
    expect(approximate('')).toBe(0);
    expect(approximate('1234')).toBe(1);
    expect(approximate('12345')).toBe(2);
  });

  it('countPayload handles null/undefined/string/object', () => {
    expect(countPayload(null)).toBe(0);
    expect(countPayload(undefined)).toBe(0);
    expect(countPayload('hi')).toBeGreaterThan(0);
    expect(countPayload({ a: 1 })).toBeGreaterThan(0);
  });

  describe('Budget', () => {
    it('tracks consumption', () => {
      const b = new Budget(100);
      const s = b.consume('hello world');
      expect(s.used).toBeGreaterThan(0);
      expect(s.remaining).toBe(100 - s.used);
      expect(s.pctUsed).toBeCloseTo(s.used / 100, 5);
    });

    it('resets', () => {
      const b = new Budget(100);
      b.consume('hello');
      b.reset();
      expect(b.state().used).toBe(0);
    });

    it('withinBudget detects overflow', () => {
      const b = new Budget(2);
      expect(b.withinBudget('hello world this is many tokens')).toBe(false);
      expect(b.withinBudget('a')).toBe(true);
    });

    it('handles zero limit', () => {
      const b = new Budget(0);
      expect(b.state().pctUsed).toBe(0);
      expect(b.withinBudget('')).toBe(true);
    });
  });
});
