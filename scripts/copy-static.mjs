#!/usr/bin/env node
/**
 * Post-build: copy non-TypeScript assets from src/ into dist/.
 *
 * `tsc` only emits .ts → .js. The web UI ships static index.html / app.js / style.css that
 * the daemon's HTTP bridge reads at runtime via `__dirname/../web/static/<file>`. Without
 * this step, dist/memory/web/static/ doesn't exist and the SPA shell returns 404 — even
 * though the source files sit happily in src/.
 *
 * Add new copy targets to STATIC_TARGETS as needed.
 */
import { readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const STATIC_TARGETS = [
  { from: 'src/memory/web/static', to: 'dist/memory/web/static' },
];

function copyDir(srcAbs, dstAbs) {
  if (!existsSync(srcAbs)) {
    console.warn(`[copy-static] source missing: ${srcAbs} — skipping`);
    return 0;
  }
  mkdirSync(dstAbs, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(srcAbs)) {
    const s = join(srcAbs, entry);
    const d = join(dstAbs, entry);
    if (statSync(s).isDirectory()) {
      count += copyDir(s, d);
    } else {
      copyFileSync(s, d);
      count++;
    }
  }
  return count;
}

let total = 0;
for (const t of STATIC_TARGETS) {
  const n = copyDir(join(ROOT, t.from), join(ROOT, t.to));
  total += n;
  console.log(`[copy-static] ${t.from} → ${t.to}  (${n} files)`);
}
console.log(`[copy-static] copied ${total} file(s)`);
