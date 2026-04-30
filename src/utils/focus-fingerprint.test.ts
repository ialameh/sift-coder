import { describe, it, expect } from 'vitest';
import {
  focusFingerprint,
  shortFingerprint,
  QUICK_REVERSE_FOCUS,
  DEEP_REVERSE_FOCUS,
} from './focus-fingerprint.js';

describe('focus-fingerprint', () => {
  it('focusFingerprint is deterministic', () => {
    expect(focusFingerprint('hello')).toBe(focusFingerprint('hello'));
    expect(focusFingerprint('hello')).not.toBe(focusFingerprint('world'));
  });

  it('shortFingerprint is 8 chars', () => {
    expect(shortFingerprint('x')).toHaveLength(8);
  });

  it('handles empty input without throwing', () => {
    expect(focusFingerprint('')).toMatch(/^[a-f0-9]{32}$/);
  });

  it('exports stable focus constants', () => {
    expect(QUICK_REVERSE_FOCUS).toBe('[quick] root scan');
    expect(DEEP_REVERSE_FOCUS).toBe('[deep] whole codebase');
  });
});
