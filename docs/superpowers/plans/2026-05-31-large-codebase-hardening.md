# Large-Codebase Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring SiftCoder up to the Claude Code large-codebase best-practices playbook: stop polluting memory at scale, and close the read-side feedback loop (CLAUDE.md hints, path-scoping, sub-workspace scoping, LSP guidance, model-drift cadence).

**Architecture:** Hook-side dep-free matchers (`hooks/lib/*.mjs`) shared across all hooks for speed within the 250 ms budget; TS daemon-side ports (`src/utils/*.ts`) for authoritative filtering. Skill/command/doc items are markdown-only and auto-discovered. No new npm deps (reuse `minimatch@10`).

**Tech Stack:** Node ≥20 ESM, TypeScript strict, Vitest (coverage 90/85/90/90), minimatch, SQLite (better-sqlite3 + wasm parity).

---

## File Structure

**Create:**
- `hooks/lib/workspace.mjs` — single source of truth for hook-side workspace key (with subspace).
- `hooks/lib/ignore.mjs` — dep-free path-exclusion matcher (gitignore/claudeignore/defaults), disk-cached.
- `src/utils/ignore.ts` — TS port for daemon-side authoritative filtering.
- `src/utils/ignore.test.ts` — matcher unit tests.
- `tests/hooks/workspace.test.ts` — `.mjs` ↔ `.ts` key-agreement + subspace tests.
- `tests/hooks/ignore.test.ts` — `.mjs` matcher tests.
- `skills/docs/codemap-claudemd/SKILL.md` — CLAUDE.md hierarchy generator.
- `commands/codemap-claudemd.md` — thin command wrapper.
- `docs/large-codebases.md` — LSP guidance + how SiftCoder maps to the playbook.

**Modify:**
- `src/memory/workspace.ts` — fold subspace into `workspaceKey`.
- `src/memory/workspace.test.ts` — subspace cases.
- 6 hooks (`spawn-daemon`, `capture-observation`, `pin-incident`, `inject-memories`, `should-continue`, `auto-checkpoint`) — import shared `hooks/lib/workspace.mjs`.
- `hooks/post-tool-use/capture-observation.mjs` — exclusion guard.
- `src/memory/daemon/server.ts` — daemon-side capture exclusion guard (case `capture`).
- `hooks/stop/should-continue.mjs` — CLAUDE.md learning hint.
- `skills/knowledge/*` — fold-in proposal flow.
- `skills/salesforce/*/SKILL.md` (12) — `paths:` frontmatter.
- `skills/meta/siftcoder/SKILL.md` — model-drift audit section.
- `settings.json` — `captureIgnore` + `subspace` config.
- `ARCHITECTURE.md`, `CHANGELOG.md`, plugin version.

---

## Task 1: Shared hook workspace module + subspace (⑤)

**Files:**
- Create: `hooks/lib/workspace.mjs`
- Create: `tests/hooks/workspace.test.ts`
- Modify: `src/memory/workspace.ts:33-42`, `src/memory/workspace.test.ts`

- [ ] **Step 1: Write failing test** `tests/hooks/workspace.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { workspaceKey } from '../../hooks/lib/workspace.mjs';
import { workspaceKey as tsKey } from '../../src/memory/workspace.ts';

const root = realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim());

describe('hook workspace key', () => {
  it('matches the TS canonical key with no subspace', () => {
    delete process.env.SIFTCODER_SUBSPACE;
    expect(workspaceKey(root)).toBe(tsKey(root));
  });

  it('folds subspace into the key and stays stable', () => {
    process.env.SIFTCODER_SUBSPACE = 'svc-a';
    const expected = createHash('sha256').update(`${root}:svc-a`).digest('hex').slice(0, 12);
    expect(workspaceKey(root)).toBe(expected);
    expect(workspaceKey(root)).toBe(tsKey(root)); // .mjs and .ts agree
    delete process.env.SIFTCODER_SUBSPACE;
  });
});
```

- [ ] **Step 2: Run, verify fail** — `npx vitest run tests/hooks/workspace.test.ts` → FAIL (`Cannot find module hooks/lib/workspace.mjs`).

- [ ] **Step 3: Create** `hooks/lib/workspace.mjs`

```js
// Single source of truth for hook-side workspace identity. Mirrors src/memory/workspace.ts.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { realpathSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function gitToplevel(cwd) {
  try {
    const out = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return out.toString('utf8').trim() || null;
  } catch {
    return null;
  }
}

// Optional sub-workspace partition: SIFTCODER_SUBSPACE env, else first line of <top>/.siftcoder/subspace.
function subspaceFor(top) {
  const env = process.env.SIFTCODER_SUBSPACE;
  if (env && env.trim()) return env.trim();
  try {
    const v = readFileSync(join(top, '.siftcoder', 'subspace'), 'utf8').split('\n')[0].trim();
    return v || null;
  } catch {
    return null;
  }
}

export function workspaceKey(cwd) {
  const top = gitToplevel(cwd) ?? cwd;
  let real;
  try { real = realpathSync(top); } catch { real = resolve(top); }
  const sub = subspaceFor(real);
  const seed = sub ? `${real}:${sub}` : real;
  return createHash('sha256').update(seed).digest('hex').slice(0, 12);
}
```

- [ ] **Step 4: Modify** `src/memory/workspace.ts` — mirror subspace (keep `gitToplevel` as-is, replace `workspaceKey`):

```ts
import { realpathSync, mkdirSync, readFileSync } from 'node:fs';

function subspaceFor(top: string): string | null {
  const env = process.env['SIFTCODER_SUBSPACE'];
  if (env && env.trim()) return env.trim();
  try {
    const v = readFileSync(join(top, '.siftcoder', 'subspace'), 'utf8').split('\n')[0]!.trim();
    return v || null;
  } catch {
    return null;
  }
}

export function workspaceKey(cwd: string): string {
  const top = gitToplevel(cwd) ?? cwd;
  let real: string;
  try {
    real = realpathSync(top);
  } catch {
    real = resolve(top);
  }
  const sub = subspaceFor(real);
  const seed = sub ? `${real}:${sub}` : real;
  return createHash('sha256').update(seed).digest('hex').slice(0, 12);
}
```

- [ ] **Step 5: Add subspace cases to** `src/memory/workspace.test.ts` (append):

```ts
it('subspace partitions the key and is reversible to baseline', () => {
  const root = realpathSync(execFileSync('git', ['rev-parse', '--show-toplevel']).toString().trim());
  const base = workspaceKey(root);
  process.env['SIFTCODER_SUBSPACE'] = 'svc-a';
  const a = workspaceKey(root);
  expect(a).not.toBe(base);
  delete process.env['SIFTCODER_SUBSPACE'];
  expect(workspaceKey(root)).toBe(base);
});
```

- [ ] **Step 6: Run** — `npx vitest run tests/hooks/workspace.test.ts src/memory/workspace.test.ts` → PASS.

- [ ] **Step 7: Refactor 6 hooks to import the shared module.** In each of `hooks/session-start/spawn-daemon.mjs`, `hooks/post-tool-use/capture-observation.mjs`, `hooks/notification/pin-incident.mjs`, `hooks/pre-compact/inject-memories.mjs`, `hooks/stop/should-continue.mjs`, `hooks/post-tool-use/auto-checkpoint.mjs`: delete the inline `gitToplevel`/`workspaceKey` defs and add at top:

```js
import { workspaceKey } from '../lib/workspace.mjs';
```

(adjust relative depth: `../lib/...` for hooks one dir deep). Keep each hook's existing `socketPath()` but have it call the imported `workspaceKey`. Remove now-unused imports (`createHash`, `execFileSync`, `realpathSync` where no longer referenced) to satisfy ESLint.

- [ ] **Step 8: Smoke-test hooks load** — `for h in spawn-daemon capture-observation pin-incident inject-memories should-continue auto-checkpoint; do node -e "import('./hooks/'+process.argv[1]).catch(e=>{console.error(process.argv[1],e.message);process.exit(1)})" $(find hooks -name "$h.mjs" | sed 's|hooks/||'); done` → each imports without error. (Simpler: `node --check` each file.)

  Run: `for f in $(grep -rl "lib/workspace.mjs" hooks); do node --check "$f" && echo "ok $f"; done` → all ok.

- [ ] **Step 9: Lint + commit** — `npx eslint hooks src/memory/workspace.ts && npx prettier -w hooks/lib src/memory/workspace.ts`

```bash
git add hooks/lib/workspace.mjs tests/hooks/workspace.test.ts src/memory/workspace.ts src/memory/workspace.test.ts hooks/
git commit -m "refactor(hooks): shared workspace module + optional SIFTCODER_SUBSPACE partition"
```

---

## Task 2: Capture-hook exclusion filtering (①)

**Files:**
- Create: `hooks/lib/ignore.mjs`, `src/utils/ignore.ts`, `src/utils/ignore.test.ts`, `tests/hooks/ignore.test.ts`
- Modify: `hooks/post-tool-use/capture-observation.mjs`, `src/memory/daemon/server.ts` (case `capture`)

- [ ] **Step 1: Write failing TS test** `src/utils/ignore.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { isIgnored, DEFAULT_IGNORES } from './ignore.js';

describe('isIgnored', () => {
  const root = '/repo';
  const matcher = { defaults: DEFAULT_IGNORES, gitignore: ['/secret/**', 'tmp/'], claudeignore: ['*.snap'] };
  it('excludes default junk dirs', () => {
    expect(isIgnored('/repo/node_modules/x/index.js', root, matcher)).toBe(true);
    expect(isIgnored('/repo/dist/bundle.js', root, matcher)).toBe(true);
  });
  it('keeps real source', () => {
    expect(isIgnored('/repo/src/core/config.ts', root, matcher)).toBe(false);
  });
  it('honors gitignore + claudeignore', () => {
    expect(isIgnored('/repo/secret/key.pem', root, matcher)).toBe(true);
    expect(isIgnored('/repo/a/b.snap', root, matcher)).toBe(true);
  });
  it('supports leading-! negation in claudeignore', () => {
    const m = { defaults: [], gitignore: ['build/**'], claudeignore: ['!build/keep.txt'] };
    expect(isIgnored('/repo/build/x.o', root, m)).toBe(true);
    expect(isIgnored('/repo/build/keep.txt', root, m)).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify fail** — `npx vitest run src/utils/ignore.test.ts` → FAIL (module missing).

- [ ] **Step 3: Create** `src/utils/ignore.ts` (uses `minimatch`)

```ts
import { minimatch } from 'minimatch';
import { relative, sep } from 'node:path';

export const DEFAULT_IGNORES = [
  'node_modules', 'dist', 'build', 'out', '.git', 'coverage', 'target', '.next',
  'vendor', '.venv', '__pycache__',
  '*.lock', '*-lock.json', '*.min.*', '*.map',
];

export interface IgnoreSet {
  defaults: string[];
  gitignore: string[];
  claudeignore: string[];
}

// Normalize a gitignore-style line to a minimatch glob relative to repo root.
function toGlobs(line: string): { glob: string; negate: boolean } | null {
  let s = line.trim();
  if (!s || s.startsWith('#')) return null;
  const negate = s.startsWith('!');
  if (negate) s = s.slice(1);
  s = s.replace(/^\//, '');                  // anchored → relative
  if (s.endsWith('/')) s = `${s}**`;          // dir → everything under it
  return { glob: s, negate };
}

function matchList(rel: string, segs: string[], patterns: string[]): boolean {
  for (const p of patterns) {
    // bare dir/file name (no slash, no star) → match any path segment
    if (!p.includes('/') && !p.includes('*')) {
      if (segs.includes(p)) return true;
      continue;
    }
    if (minimatch(rel, p, { dot: true })) return true;
    if (minimatch(rel, `**/${p}`, { dot: true })) return true;
  }
  return false;
}

export function isIgnored(absPath: string, root: string, set: IgnoreSet): boolean {
  const rel = relative(root, absPath).split(sep).join('/');
  if (rel.startsWith('..')) return false;     // outside root → not our concern
  const segs = rel.split('/');

  // negations (from claudeignore) win
  const negations = set.claudeignore
    .map(toGlobs).filter((g): g is { glob: string; negate: boolean } => !!g && g.negate)
    .map(g => g.glob);
  if (matchList(rel, segs, negations)) return false;

  const positive = [
    ...set.defaults,
    ...set.gitignore.map(toGlobs).filter(g => g && !g.negate).map(g => g!.glob),
    ...set.claudeignore.map(toGlobs).filter(g => g && !g.negate).map(g => g!.glob),
  ];
  return matchList(rel, segs, positive);
}
```

- [ ] **Step 4: Run TS test** — `npx vitest run src/utils/ignore.test.ts` → PASS.

- [ ] **Step 5: Write failing hook-matcher test** `tests/hooks/ignore.test.ts`

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadIgnore, shouldCapturePath } from '../../hooks/lib/ignore.mjs';

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'sc-ign-'));
  writeFileSync(join(root, '.gitignore'), 'secret/\n*.tmp\n');
  writeFileSync(join(root, '.claudeignore'), 'snapshots/\n');
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('hook ignore matcher', () => {
  it('drops defaults + gitignore + claudeignore, keeps source', () => {
    const m = loadIgnore(root);
    expect(shouldCapturePath(join(root, 'src/x.ts'), root, m)).toBe(true);
    expect(shouldCapturePath(join(root, 'node_modules/a.js'), root, m)).toBe(false);
    expect(shouldCapturePath(join(root, 'secret/k.pem'), root, m)).toBe(false);
    expect(shouldCapturePath(join(root, 'a/b.tmp'), root, m)).toBe(false);
    expect(shouldCapturePath(join(root, 'snapshots/s.json'), root, m)).toBe(false);
  });
  it('caches by mtime (second load is same object shape)', () => {
    const a = loadIgnore(root);
    const b = loadIgnore(root);
    expect(b.gitignore).toEqual(a.gitignore);
  });
});
```

- [ ] **Step 6: Run, verify fail** — `npx vitest run tests/hooks/ignore.test.ts` → FAIL.

- [ ] **Step 7: Create** `hooks/lib/ignore.mjs` (dep-free; mirrors the TS matcher; disk-cached by mtime)

```js
// Dep-free path-exclusion matcher for the capture hook. Sources: hardcoded defaults
// ∪ .gitignore ∪ .claudeignore at repo root. Cached on disk by ignore-file mtime so the
// 250ms hook budget holds. Mirrors src/utils/ignore.ts semantics (kept simple, no minimatch).
import { readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { relative, sep, join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';

const DEFAULTS = [
  'node_modules', 'dist', 'build', 'out', '.git', 'coverage', 'target', '.next',
  'vendor', '.venv', '__pycache__', '*.lock', '*-lock.json', '*.min.*', '*.map',
];

function mtime(p) { try { return statSync(p).mtimeMs; } catch { return 0; } }
function readLines(p) {
  try { return readFileSync(p, 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')); }
  catch { return []; }
}

export function loadIgnore(root) {
  const ns = process.env.SIFTCODER_NS || 'default';
  const gi = join(root, '.gitignore'), ci = join(root, '.claudeignore');
  const stamp = `${mtime(gi)}:${mtime(ci)}`;
  const key = createHash('sha256').update(root).digest('hex').slice(0, 12);
  const cacheFile = join(homedir(), '.siftcoder', ns, `${key}.ignore.json`);
  try {
    const c = JSON.parse(readFileSync(cacheFile, 'utf8'));
    if (c.stamp === stamp) return c.set;
  } catch { /* rebuild */ }
  const set = { defaults: DEFAULTS, gitignore: readLines(gi), claudeignore: readLines(ci) };
  try { mkdirSync(join(cacheFile, '..'), { recursive: true }); writeFileSync(cacheFile, JSON.stringify({ stamp, set })); }
  catch { /* cache best-effort */ }
  return set;
}

function norm(line) {
  let s = line, negate = false;
  if (s.startsWith('!')) { negate = true; s = s.slice(1); }
  s = s.replace(/^\//, '');
  return { s, negate };
}

function hit(rel, segs, patterns) {
  for (const raw of patterns) {
    const { s } = norm(raw);
    if (!s) continue;
    const base = s.endsWith('/') ? s.slice(0, -1) : s;
    if (!base.includes('/') && !base.includes('*')) { if (segs.includes(base)) return true; continue; }
    if (base.startsWith('*.') && rel.endsWith(base.slice(1))) return true;
    if (base.includes('*') && base.includes('.')) {
      // crude *.x.* style: match by suffix/contains
      const parts = base.split('*').filter(Boolean);
      if (parts.every(p => rel.includes(p))) return true;
    }
    if (rel === base || rel.startsWith(`${base}/`) || segs.includes(base)) return true;
  }
  return false;
}

export function shouldCapturePath(absPath, root, set) {
  const rel = relative(root, absPath).split(sep).join('/');
  if (rel.startsWith('..')) return true; // outside root → capture (don't lose it)
  const segs = rel.split('/');
  const negations = set.claudeignore.filter(l => l.startsWith('!')).map(l => l.slice(1));
  if (hit(rel, segs, negations)) return true;
  const positive = [...set.defaults, ...set.gitignore, ...set.claudeignore.filter(l => !l.startsWith('!'))];
  return !hit(rel, segs, positive);
}
```

- [ ] **Step 8: Run hook test** — `npx vitest run tests/hooks/ignore.test.ts` → PASS.

- [ ] **Step 9: Wire the capture hook.** In `hooks/post-tool-use/capture-observation.mjs`, after `if (!RELEVANT.has(toolName)) process.exit(0);` (line ~87) add:

```js
// Drop captures for ignored paths (memory hygiene at scale). Opt out: SIFTCODER_CAPTURE_IGNORE=0.
if (process.env.SIFTCODER_CAPTURE_IGNORE !== '0') {
  const ti = envelope.tool_input || {};
  const cand = ti.file_path || ti.path || (toolName === 'Glob' ? null : ti.notebook_path);
  if (cand) {
    try {
      const { loadIgnore, shouldCapturePath } = await import('../lib/ignore.mjs');
      const top = (await import('../lib/workspace.mjs')); // reuse gitToplevel
      const root = top.gitToplevel(cwd) ?? cwd;
      const abs = cand.startsWith('/') ? cand : `${root}/${cand}`;
      if (!shouldCapturePath(abs, root, loadIgnore(root))) process.exit(0);
    } catch { /* fail open: capture */ }
  }
}
```

(`gitToplevel` is already exported from `hooks/lib/workspace.mjs` per Task 1.)

- [ ] **Step 10: Daemon-side authoritative filter.** Read `src/memory/daemon/server.ts` case `'capture'` (~line 132). After extracting the event/payload and before the storage insert, add a guard that drops events whose extractable path is ignored:

```ts
import { isIgnored, DEFAULT_IGNORES } from '../../utils/ignore.js';
// ... inside case 'capture', after parsing req.payload:
const root = deps.workspaceRoot ?? process.cwd();
const p = req.payload?.tool_input?.file_path ?? req.payload?.tool_input?.path;
if (p && process.env['SIFTCODER_CAPTURE_IGNORE'] !== '0') {
  const set = { defaults: DEFAULT_IGNORES, gitignore: [], claudeignore: [] }; // defaults-only on daemon side
  const abs = p.startsWith('/') ? p : `${root}/${p}`;
  if (isIgnored(abs, root, set)) return { ok: true, data: { dropped: true } };
}
```

(If `deps.workspaceRoot` does not exist, derive root once at daemon boot from `gitToplevel(process.cwd())` and thread it through `deps`; keep daemon-side to defaults-only — the hook already applied gitignore/claudeignore.)

- [ ] **Step 11: Run full suite + lint** — `npx vitest run && npx eslint src hooks` → PASS, 0 errors.

- [ ] **Step 12: Commit**

```bash
git add hooks/lib/ignore.mjs src/utils/ignore.ts src/utils/ignore.test.ts tests/hooks/ignore.test.ts hooks/post-tool-use/capture-observation.mjs src/memory/daemon/server.ts
git commit -m "feat(memory): exclude ignored paths from capture (gitignore/claudeignore/defaults)"
```

---

## Task 3: Stop-hook CLAUDE.md learning hint (②)

**Files:**
- Modify: `hooks/stop/should-continue.mjs`
- Modify: a `skills/knowledge/*` SKILL.md (fold-in flow)

- [ ] **Step 1: Add the hint to** `hooks/stop/should-continue.mjs`. The hook already opens a UDS connection and sends `{kind:'status'}`. Generalize `ask(payload)` to take a request, then after the pending-drain line add a second cheap call:

```js
// after: const r = await ask({ kind: 'status' });  (rename existing ask to take a payload)
const pending = r?.ok ? r.data?.counts?.raw : null;
if (pending && pending > 0) {
  process.stdout.write(`[siftcoder] ${pending} memory events pending drain. Run /siftcoder:mem drain.\n`);
}

// CLAUDE.md learning hint (advisory, never writes).
const sessionId = envelope.session_id; // from stdin envelope (parse stdin like capture hook)
const MIN = Number(process.env.SIFTCODER_CLAUDEMD_HINT_MIN || '2');
if (sessionId) {
  const d = await ask({ kind: 'session_digest', sessionId, limit: 50 });
  const text = d?.ok ? (d.data?.text || '') : '';
  const MARK = /\b(convention|always|never|must|prefer|use .+ not |pattern:|decision:|gotcha|invariant)\b/i;
  const lines = text.split('\n').filter(l => {
    const m = l.match(/\((\d+)%\)/);
    const conf = m ? Number(m[1]) : 100;
    return conf >= 60 && MARK.test(l);
  });
  if (lines.length >= MIN) {
    process.stdout.write(`[siftcoder] ${lines.length} convention learnings this session — run /siftcoder:knowledge to fold into CLAUDE.md.\n`);
  }
}
```

Read stdin first (the current hook does not). Add at top of the async flow:

```js
async function readStdin() {
  return new Promise(res => { let d = ''; process.stdin.on('data', c => d += c); process.stdin.on('end', () => res(d)); setTimeout(() => res(d), 80); });
}
let envelope = {};
try { envelope = JSON.parse((await readStdin()) || '{}'); } catch { envelope = {}; }
```

Keep total within the 1.5 s budget (both calls reuse the same short timeout).

- [ ] **Step 2: Manual smoke** — `echo '{"session_id":"none"}' | node hooks/stop/should-continue.mjs` → exits 0, no crash (no daemon socket → silent). Confirm: `echo $?` = 0.

- [ ] **Step 3: Add fold-in flow to knowledge skill.** Append a section to the knowledge skill (`skills/knowledge/knowledge/SKILL.md` or the memory-usage skill — pick the one whose `name` matches `/siftcoder:knowledge`):

```markdown
## Fold session conventions into CLAUDE.md

When the Stop hook hints "N convention learnings", do this on demand:

1. `mem_session_digest { sessionId }` (or `mem_patterns`) → pull this session's high-confidence convention/decision summaries.
2. Read the existing root `CLAUDE.md` (and the nearest subdir `CLAUDE.md` if the work was scoped).
3. Draft a minimal delta — only conventions not already documented, phrased as durable rules.
4. Show the user the proposed diff. Apply only on approval. Never auto-write.
```

- [ ] **Step 4: Lint + commit**

```bash
git add hooks/stop/should-continue.mjs skills/knowledge
git commit -m "feat(hooks): Stop-hook hint to fold session conventions into CLAUDE.md"
```

---

## Task 4: Path-scoped Salesforce skills (④)

**Files:**
- Modify: `skills/salesforce/*/SKILL.md` (12)
- Create: `tests/skills/salesforce-paths.test.ts`

- [ ] **Step 1: Write failing guard test** `tests/skills/salesforce-paths.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(__dirname, '../../skills/salesforce');

describe('salesforce skills are path-scoped', () => {
  for (const name of readdirSync(dir)) {
    it(`${name} has a non-empty paths: frontmatter`, () => {
      const fm = readFileSync(join(dir, name, 'SKILL.md'), 'utf8').split('---')[1] ?? '';
      const m = fm.match(/^paths:\s*(.+)$/m);
      expect(m, `${name} missing paths:`).toBeTruthy();
      expect(m![1].trim().length).toBeGreaterThan(0);
    });
  }
});
```

- [ ] **Step 2: Run, verify fail** — `npx vitest run tests/skills/salesforce-paths.test.ts` → FAIL (no `paths:`).

- [ ] **Step 3: Add `paths:` to each SF skill frontmatter.** For every `skills/salesforce/*/SKILL.md`, insert after the `description:` line:

```yaml
paths: '**/*.cls,**/*.trigger,**/*.apex,**/lwc/**,**/aura/**,**/objects/**,**/*.object-meta.xml,sfdx-project.json,**/flows/**,**/flexipages/**,**/permissionsets/**,**/profiles/**'
```

- [ ] **Step 4: Run, verify pass** — `npx vitest run tests/skills/salesforce-paths.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/salesforce tests/skills/salesforce-paths.test.ts
git commit -m "feat(skills): path-scope Salesforce skills to SF file trees"
```

---

## Task 5: CLAUDE.md hierarchy generator (③)

**Files:**
- Create: `skills/docs/codemap-claudemd/SKILL.md`, `commands/codemap-claudemd.md`

- [ ] **Step 1: Create** `skills/docs/codemap-claudemd/SKILL.md`

```markdown
---
name: codemap-claudemd
description: Use to generate or refresh a layered CLAUDE.md hierarchy (lean root + per-subdir) for a large codebase. "Set up CLAUDE.md files", "scaffold context files", "make this repo legible to Claude Code".
---

# codemap-claudemd

Emit the layered CLAUDE.md hierarchy the Claude Code large-codebase playbook recommends. Reuses the `/codemap` walk; output is CLAUDE.md files, not standalone docs.

## Method
1. Run the `codemap` walk (or `codemap-fast` for a quick pass) to get modules + responsibilities + per-dir build/test commands.
2. **Root CLAUDE.md** — lean: one-paragraph repo purpose, highest-level structure, critical gotchas, and pointers to subdir files. No exhaustive detail (keep it the thing loaded every session).
3. **Per-significant-subdir CLAUDE.md** — local conventions + the scoped test/build/lint command for that dir (so Claude runs the dir suite, not the whole monorepo).
4. **Idempotent merge** — if a CLAUDE.md exists, diff against the generated content and propose additions only. Never clobber hand-written guidance.
5. Show the user every proposed file/diff. Write only on approval.

## Output discipline
- Root stays short (pointers + gotchas). Detail lives in subdir files (article: "root contains pointers and critical gotchas only").
- One subdir file per service/module boundary, not per technical layer.
```

- [ ] **Step 2: Create** `commands/codemap-claudemd.md`

```markdown
---
description: Generate/refresh a layered CLAUDE.md hierarchy (lean root + per-subdir).
---

Invoke the `codemap-claudemd` skill for $ARGUMENTS.
```

- [ ] **Step 3: Verify discovery** — `node --check` not applicable (markdown). Confirm frontmatter parses: `head -5 skills/docs/codemap-claudemd/SKILL.md`.

- [ ] **Step 4: Commit**

```bash
git add skills/docs/codemap-claudemd commands/codemap-claudemd.md
git commit -m "feat(skills): codemap-claudemd — layered CLAUDE.md hierarchy generator"
```

---

## Task 6: LSP guidance docs (⑥)

**Files:**
- Create: `docs/large-codebases.md`
- Modify: `mkdocs.yml` (nav), symbol-search skill note

- [ ] **Step 1: Create** `docs/large-codebases.md`

```markdown
# SiftCoder in large codebases

How SiftCoder maps to the Claude Code large-codebase playbook, and where to reach for native CC features instead.

## Symbol navigation: use LSP for live precision
`mem_symbol_search` is a **memory-derived recall index** — the symbols you have touched, with provenance (`mem_why`). It answers "where did I work on `FooService`, and what depended on it." It is **not** a language server.

For live "go to definition" / "find all references" across a multi-language codebase, install Claude Code's **code-intelligence (LSP) plugin** + the language-server binary for each language. LSP gives symbol-level precision and prevents text-pattern-matching errors. The two are complementary: LSP for *where a symbol is now*, `mem_symbol_search` for *where you've been and why*.

## Memory hygiene
SiftCoder excludes `node_modules`, `dist`, build output, and anything in `.gitignore`/`.claudeignore` from capture (`SIFTCODER_CAPTURE_IGNORE=0` to disable). In a monorepo, set `SIFTCODER_SUBSPACE` (or a `.siftcoder/subspace` file) to partition memory per service.

## Context files
Use `/siftcoder:codemap-claudemd` to scaffold a lean root + per-subdir CLAUDE.md hierarchy.
```

- [ ] **Step 2: Add nav entry to** `mkdocs.yml` under the appropriate section (e.g. `- Large codebases: large-codebases.md`).

- [ ] **Step 3: Add a one-line note** to the symbol-search skill output guidance (find the skill referencing `mem_symbol_search`; append): "For live go-to-def/find-refs, prefer the CC code-intelligence (LSP) plugin — this index is for recall, not live precision."

- [ ] **Step 4: Commit**

```bash
git add docs/large-codebases.md mkdocs.yml skills
git commit -m "docs: large-codebase guidance + LSP vs mem_symbol_search clarification"
```

---

## Task 7: Model-drift cadence (⑦)

**Files:**
- Modify: `skills/meta/siftcoder/SKILL.md`

- [ ] **Step 1: Append a section to** `skills/meta/siftcoder/SKILL.md`

```markdown
## Model-drift audit (review every 3–6 months)

Instructions tuned for today's model can work against a future one. Re-check on every major model release:

- `settings.json` → `summarizer.modelHaiku` / `modelSonnet` — still the right tier? Still extant model IDs?
- `summarizer.confidenceThreshold` (0.6) — recalibrate against current Haiku quality.
- Any skill text that hard-codes model behavior or worded around an old limitation — retire it.
- Run `siftcoder mem doctor` — surfaces pinned model IDs and their age.
```

- [ ] **Step 2: Commit**

```bash
git add skills/meta/siftcoder/SKILL.md
git commit -m "docs(skills): model-drift review cadence in /siftcoder:siftcoder"
```

---

## Task 8: Cross-cutting — architecture, changelog, settings, version

**Files:**
- Modify: `ARCHITECTURE.md`, `CHANGELOG.md`, `settings.json`, `.claude-plugin/plugin.json`, `package.json`

- [ ] **Step 1: `settings.json`** — add under `siftcoder.memory`: `"subspace": null`; under `siftcoder.hooks`: `"captureIgnore": { "enabled": true, "extra": [] }`.

- [ ] **Step 2: `ARCHITECTURE.md`** — update: hook table rows (capture-observation → "+ path-exclusion filtering"; should-continue → "+ CLAUDE.md learning hint"); skills count 96→97; add §9 **D12** (model-drift cadence) + **D13** (capture exclusion: hook applies gitignore/claudeignore/defaults, daemon re-applies defaults; fail-open); §8 extension points (`hooks/lib/ignore.mjs`, `SIFTCODER_SUBSPACE`); §10 open-risks (mem_symbol_search is recall not LSP — recommend code-intelligence plugin).

- [ ] **Step 3: `CHANGELOG.md`** — new `## [1.3.0]` entry listing all 7 items (Added/Changed).

- [ ] **Step 4: Version bump** — `.claude-plugin/plugin.json` and `package.json` `1.2.7 → 1.3.0`.

- [ ] **Step 5: Full gate** — `npm run build && npx vitest run && npx eslint src hooks && npx prettier -c "src/**/*.ts" "hooks/**/*.mjs"` → all green, coverage thresholds hold.

- [ ] **Step 6: Commit**

```bash
git add ARCHITECTURE.md CHANGELOG.md settings.json .claude-plugin/plugin.json package.json
git commit -m "chore: v1.3.0 — architecture, changelog, settings for large-codebase hardening"
```

---

## Self-Review

**Spec coverage:** ① Task 2 ✓ · ② Task 3 ✓ · ③ Task 5 ✓ · ④ Task 4 ✓ · ⑤ Task 1 ✓ · ⑥ Task 6 ✓ · ⑦ Task 7 ✓ · cross-cutting Task 8 ✓.

**Placeholder scan:** Daemon-side wiring (Task 2 Step 10) is the one spot that depends on reading `server.ts` capture-case + confirming `deps.workspaceRoot` — flagged inline with the fallback (derive root at boot, defaults-only). All other steps carry full code. The knowledge-skill target (Task 3 Step 3) names the selection rule (skill whose `name` resolves `/siftcoder:knowledge`) rather than a fixed path — resolve at execution.

**Type consistency:** `loadIgnore`/`shouldCapturePath` (hook `.mjs`) and `isIgnored`/`DEFAULT_IGNORES`/`IgnoreSet` (TS) are distinct by design (hook stays dep-free; TS uses minimatch). `workspaceKey(cwd)` signature identical across `.mjs` and `.ts`. `IgnoreSet` shape `{defaults,gitignore,claudeignore}` consistent across Tasks 2 steps.

**Risk note:** Task 1 (workspace refactor) touches 6 hooks — highest blast radius; its Step 8 `node --check` gate catches import breakage before commit. Run Task 1 first.
