/**
 * Deterministic short hashes for focus strings — cache keys for reverse-prompt.
 * Ported from V1 dist/utils/focus-fingerprint.js (which itself was ported from gitreverse).
 */

import { createHash } from 'node:crypto';

export const QUICK_REVERSE_FOCUS = '[quick] root scan';
export const DEEP_REVERSE_FOCUS = '[deep] whole codebase';

export function focusFingerprint(focus: string): string {
  return createHash('md5').update(focus || '', 'utf8').digest('hex');
}

export function shortFingerprint(focus: string): string {
  return focusFingerprint(focus).slice(0, 8);
}
