/**
 * Focus Fingerprint Utility
 *
 * Produces deterministic short hashes for focus strings.
 * Used as cache keys for reverse-prompt and any future intent-keyed state.
 *
 * Ported from gitreverse (lib/focus-fingerprint.ts).
 */
import { createHash } from 'node:crypto';

export const QUICK_REVERSE_FOCUS = '[quick] root scan';
export const DEEP_REVERSE_FOCUS = '[deep] whole codebase';

/**
 * Full MD5 hex of UTF-8 focus string.
 */
export function focusFingerprint(focus) {
    return createHash('md5').update(focus || '', 'utf8').digest('hex');
}

/**
 * Short 8-char prefix — sufficient for local cache keys, collision-safe at this scale.
 */
export function shortFingerprint(focus) {
    return focusFingerprint(focus).slice(0, 8);
}
