import { describe, it, expect } from 'vitest';
import {
  chooseStablePort, nextCandidate, initialPort,
  PORT_RANGE_LOW, PORT_RANGE_HIGH, PORT_RANGE_SIZE,
} from './port.js';

describe('chooseStablePort', () => {
  it('returns the same port for the same workspace key', () => {
    const a = chooseStablePort('c1aff311af3f');
    const b = chooseStablePort('c1aff311af3f');
    expect(a).toBe(b);
  });

  it('returns different ports for different keys', () => {
    const a = chooseStablePort('aaa');
    const b = chooseStablePort('bbb');
    expect(a).not.toBe(b);
  });

  it('always falls inside the IANA dynamic / private range', () => {
    for (const k of ['', 'short', 'c1aff311af3f', 'a'.repeat(64), '0xff', '🍕']) {
      const p = chooseStablePort(k);
      expect(p).toBeGreaterThanOrEqual(PORT_RANGE_LOW);
      expect(p).toBeLessThanOrEqual(PORT_RANGE_HIGH);
    }
  });

  it('range size is 16,384', () => {
    expect(PORT_RANGE_SIZE).toBe(16_384);
  });
});

describe('nextCandidate', () => {
  it('increments within the range', () => {
    expect(nextCandidate(50000)).toBe(50001);
  });

  it('wraps from PORT_RANGE_HIGH to PORT_RANGE_LOW', () => {
    expect(nextCandidate(PORT_RANGE_HIGH)).toBe(PORT_RANGE_LOW);
  });

  it('resets to PORT_RANGE_LOW when given a port outside the range', () => {
    expect(nextCandidate(80)).toBe(PORT_RANGE_LOW);
    expect(nextCandidate(70_000)).toBe(PORT_RANGE_LOW);
  });

  it('resets to PORT_RANGE_LOW when given a non-finite input', () => {
    expect(nextCandidate(NaN)).toBe(PORT_RANGE_LOW);
  });
});

describe('initialPort', () => {
  it('honors a numeric override', () => {
    expect(initialPort({ workspaceKey: 'k', override: 8080 })).toEqual({ port: 8080, source: 'override' });
  });

  it('honors a numeric-string override', () => {
    expect(initialPort({ workspaceKey: 'k', override: '8181' })).toEqual({ port: 8181, source: 'override' });
  });

  it('accepts 0 as a valid override (OS-assigned)', () => {
    expect(initialPort({ workspaceKey: 'k', override: 0 })).toEqual({ port: 0, source: 'override' });
  });

  it('falls back to derived when override is empty string, null, or undefined', () => {
    expect(initialPort({ workspaceKey: 'k' }).source).toBe('derived');
    expect(initialPort({ workspaceKey: 'k', override: '' }).source).toBe('derived');
    expect(initialPort({ workspaceKey: 'k', override: null }).source).toBe('derived');
    expect(initialPort({ workspaceKey: 'k', override: undefined }).source).toBe('derived');
  });

  it('falls back to derived when override is non-numeric', () => {
    expect(initialPort({ workspaceKey: 'k', override: 'not-a-number' }).source).toBe('derived');
  });

  it('falls back to derived when override is out of range', () => {
    expect(initialPort({ workspaceKey: 'k', override: -1 }).source).toBe('derived');
    expect(initialPort({ workspaceKey: 'k', override: 100_000 }).source).toBe('derived');
  });
});
