#!/usr/bin/env node
/**
 * SessionStart hook — surface install error banner.
 *
 * If `ensure-built.mjs` left a flag at ~/.siftcoder/<NS>/install-error.flag,
 * print one clear instruction to stdout (which Claude Code surfaces to the user).
 * Auto-clears once the user has seen it (rotates to .seen).
 *
 * Always exits 0. Never blocks.
 */

import { existsSync, readFileSync, renameSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

const NS = process.env.SIFTCODER_NS || 'v3';

try {
  const flag = join(homedir(), '.siftcoder', NS, 'install-error.flag');
  if (!existsSync(flag)) process.exit(0);

  const data = JSON.parse(readFileSync(flag, 'utf8'));
  const cmd = `! cd ${data.pluginRoot} && npm install && npm run build`;
  process.stdout.write([
    '',
    '╭─ SiftCoder install incomplete ────────────────────────',
    '│',
    `│  ${data.message.split('\n')[0]}`,
    '│',
    '│  Run this in your prompt to fix:',
    '│',
    `│    ${cmd}`,
    '│',
    '│  After it succeeds, restart your Claude Code session.',
    '│',
    '╰───────────────────────────────────────────────────────',
    '',
  ].join('\n'));

  // Mark as seen so we don't nag every session — rotate to .seen
  try {
    mkdirSync(dirname(flag), { recursive: true });
    renameSync(flag, flag + '.seen');
  } catch { /* tolerate */ }
} catch {
  // Never crash from this banner
}

process.exit(0);
