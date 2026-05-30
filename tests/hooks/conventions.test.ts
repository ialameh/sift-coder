import { describe, it, expect } from 'vitest';
import { pickConventionLearnings } from '../../hooks/lib/conventions.mjs';

describe('pickConventionLearnings', () => {
  it('picks high-confidence convention/decision lines, skips low-conf and unmarked', () => {
    const text = [
      '[Edit] (90%) Convention: always use the shared workspace module',
      '[Read] (95%) Decision: prefer minimatch on the daemon side',
      '[Bash] (40%) must rebuild the native binding', // low conf → excluded
      '[Read] (99%) ran the test suite and it passed', // no marker → excluded
    ].join('\n');
    expect(pickConventionLearnings(text)).toHaveLength(2);
  });

  it('treats lines without a (NN%) tag as 100% confidence', () => {
    expect(pickConventionLearnings('always bulkify SOQL in triggers')).toHaveLength(1);
  });

  it('respects a custom confidence floor', () => {
    const text = '[Edit] (50%) gotcha: WAL must be closed before rmdir';
    expect(pickConventionLearnings(text, 60)).toHaveLength(0);
    expect(pickConventionLearnings(text, 50)).toHaveLength(1);
  });

  it('returns [] for empty input', () => {
    expect(pickConventionLearnings('')).toHaveLength(0);
  });
});
