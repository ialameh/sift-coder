#!/usr/bin/env node
/**
 * Single source of truth for the SiftCoder version: package.json#version.
 * This script propagates that value into the Claude Code plugin manifests
 * (.claude-plugin/plugin.json, .claude-plugin/marketplace.json) so they
 * never drift out of sync.
 *
 * Run automatically via `prebuild` and `version` lifecycle hooks. Manual
 * invocation: `node scripts/sync-version.mjs` (or `npm run sync-version`).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version;
if (!version) {
  console.error('[sync-version] package.json has no "version" field');
  process.exit(1);
}

const targets = [
  {
    path: path.join(ROOT, '.claude-plugin', 'plugin.json'),
    update: (json) => {
      json.version = version;
      return json;
    },
  },
  {
    path: path.join(ROOT, '.claude-plugin', 'marketplace.json'),
    update: (json) => {
      if (Array.isArray(json.plugins)) {
        for (const p of json.plugins) {
          if (p && p.name === 'siftcoder') p.version = version;
        }
      }
      return json;
    },
  },
];

let changed = 0;
for (const t of targets) {
  const original = readFileSync(t.path, 'utf8');
  const json = JSON.parse(original);
  const next = t.update(json);
  const out = JSON.stringify(next, null, 2) + (original.endsWith('\n') ? '\n' : '');
  if (out !== original) {
    writeFileSync(t.path, out);
    changed++;
    console.log(`[sync-version] ${path.relative(ROOT, t.path)} -> ${version}`);
  }
}

if (changed === 0) console.log(`[sync-version] all manifests already at ${version}`);
