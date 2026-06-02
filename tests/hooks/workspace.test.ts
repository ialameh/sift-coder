import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
// .mjs hook module is the single source of truth for hook-side workspace identity.
import { workspaceKey } from '../../hooks/lib/workspace.mjs';
// .ts canonical implementation must agree with the .mjs one.
import { workspaceKey as tsKey } from '../../src/memory/workspace.js';

const root = realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim());

describe('hook workspace key', () => {
  afterEach(() => {
    delete process.env['SIFTCODER_SUBSPACE'];
  });

  it('matches the TS canonical key with no subspace', () => {
    delete process.env['SIFTCODER_SUBSPACE'];
    expect(workspaceKey(root)).toBe(tsKey(root));
  });

  it('folds subspace into the key and the .mjs and .ts impls agree', () => {
    process.env['SIFTCODER_SUBSPACE'] = 'svc-a';
    const expected = createHash('sha256').update(`${root}:svc-a`).digest('hex').slice(0, 12);
    expect(workspaceKey(root)).toBe(expected);
    expect(workspaceKey(root)).toBe(tsKey(root));
  });

  it('subspace changes the key relative to baseline', () => {
    delete process.env['SIFTCODER_SUBSPACE'];
    const base = workspaceKey(root);
    process.env['SIFTCODER_SUBSPACE'] = 'svc-b';
    expect(workspaceKey(root)).not.toBe(base);
  });
});
