#!/usr/bin/env node
/**
 * generate-source-md.mjs
 *
 * Consolidates a project's source tree into a small set of readable, AI-friendly
 * Markdown bundles under `.source/`, one bundle per meaningful folder.
 *
 * Why this exists: some AI ingestion systems only accept Markdown. This script
 * walks the project, skips junk / binaries / secrets, groups files by folder
 * (descending into very large folders, splitting very large bundles into parts),
 * and emits `<folder>.source.md` files plus an `index.source.md` map.
 *
 * The output is deterministic and the script is safe to rerun: it wipes and
 * regenerates `.source/` on every run and (idempotently) ensures `.source/` is
 * git-ignored. Generated file introductions are extracted from the source files
 * themselves (frontmatter / leading comments), so no model call is needed.
 *
 * Portable: it bundles the project it is run *in* (current working directory),
 * not the directory it lives in — so it works unchanged when shipped inside a
 * plugin and invoked against any other repo.
 *
 * Usage:
 *   node generate-source-md.mjs            # bundle the current working directory
 *   node generate-source-md.mjs <dir>      # bundle a specific project directory
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
// Target project = first CLI arg if given, else the current working directory.
const ROOT = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const OUT_DIR = path.join(ROOT, '.source');
const OUT_DIRNAME = '.source';

/* ----------------------------------------------------------------------------
 * Tunables
 * ------------------------------------------------------------------------- */

// Descend into a folder's subdirectories (instead of bundling the whole subtree
// into one file) only when its recursive file count exceeds this threshold.
const GROUP_DESCEND_THRESHOLD = 40;
// Safety cap on how deep grouping may descend.
const MAX_GROUP_DEPTH = 4;
// Source-byte budget per output part. A single bundle is split into
// `.part-NN.source.md` files once the included source exceeds this.
const MAX_PART_BYTES = 350_000;
// Hard cap on how big an individual file we will embed (skip larger as "huge").
const MAX_FILE_BYTES = 1_500_000;

/* ----------------------------------------------------------------------------
 * Exclusions
 * ------------------------------------------------------------------------- */

// Directory names skipped ANYWHERE in the tree (unambiguous VCS / tool / dep dirs).
const ALWAYS_EXCLUDED_DIRS = new Set([
  '.git', OUT_DIRNAME, 'node_modules', 'coverage', '.nyc_output',
  '.sfdx', '.sf', '.vscode', '.idea', '.cache', '.next', '.nuxt', '.turbo',
  '.parcel-cache', '.svelte-kit', '__pycache__', '.pytest_cache', '.mypy_cache',
  '.gradle', '.ideas', '.siftcoder', 'venv', '.venv',
]);
// Generic build-output names — excluded ONLY at the repo root. Deeper in the
// tree these can be legitimate feature/skill folder names (e.g. the `/build`
// skill lives at `skills/coding/build/`), so we must not drop them blindly.
const ROOT_ONLY_EXCLUDED_DIRS = new Set(['dist', 'build', 'out', 'lib-cov', 'env']);

// Exact filenames skipped (lock files, OS cruft, personal scratch).
const EXCLUDED_FILES = new Set([
  'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml',
  'bun.lockb', 'composer.lock', 'Gemfile.lock', 'poetry.lock', 'Cargo.lock',
  'Pipfile.lock',
  '.DS_Store', 'Thumbs.db', 'desktop.ini',
  // Personal / local scratch (git-ignored "in-flight ideas" + session scratch).
  'IDEAS.md', 'sess.txt',
]);

// Binary / image / archive / media extensions — never embed.
const BINARY_EXT = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'tiff', 'tif', 'svg',
  'pdf', 'psd', 'ai', 'sketch',
  'zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', '7z', 'rar', 'jar', 'war',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'mp3', 'wav', 'flac', 'ogg', 'm4a',
  'exe', 'dll', 'so', 'dylib', 'bin', 'wasm', 'class', 'node', 'o', 'a',
  'pyc', 'pyo', 'lockb',
  'db', 'sqlite', 'sqlite3', 'ipynb',
]);

// Filename patterns that look like secrets / keys / credentials.
const SECRET_PATTERNS = [
  /(^|\.)env($|\.)/i,                                  // .env, .env.local, env.prod
  /\.(pem|key|crt|cert|cer|der|p12|pfx|jks|keystore|asc|gpg|ppk)$/i,
  /(^|[._-])(secret|secrets|credential|credentials|password|passwords)s?(\.|$)/i,
  /^id_(rsa|dsa|ecdsa|ed25519)(\.|$)/i,
  /^\.npmrc$/i,
  /^\.netrc$/i,
  /\.htpasswd$/i,
];

/* ----------------------------------------------------------------------------
 * Language tags
 * ------------------------------------------------------------------------- */

const EXT_LANG = {
  ts: 'ts', tsx: 'tsx', mts: 'ts', cts: 'ts',
  js: 'js', jsx: 'jsx', mjs: 'js', cjs: 'js',
  json: 'json', jsonc: 'json', json5: 'json',
  css: 'css', scss: 'scss', sass: 'sass', less: 'less',
  html: 'html', htm: 'html', xml: 'xml', svg: 'xml',
  yml: 'yaml', yaml: 'yaml', toml: 'toml', ini: 'ini', cfg: 'ini',
  md: 'md', markdown: 'md', mdx: 'md',
  sh: 'sh', bash: 'sh', zsh: 'sh', fish: 'sh',
  py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
  cls: 'apex', trigger: 'apex', apex: 'apex', soql: 'sql', sql: 'sql',
  php: 'php', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp',
  swift: 'swift', kt: 'kotlin', dart: 'dart',
  txt: 'text', text: 'text', csv: 'csv', tsv: 'text', env: 'bash',
  gitignore: 'gitignore', npmignore: 'text', dockerignore: 'text',
  prettierignore: 'text', eslintignore: 'text',
};

// Special filenames (no useful extension) → language.
const NAME_LANG = {
  Dockerfile: 'dockerfile', Makefile: 'makefile', LICENSE: 'text',
  '.gitignore': 'gitignore', '.npmignore': 'text', '.dockerignore': 'text',
  '.prettierignore': 'text', '.eslintignore': 'text', '.gitattributes': 'text',
  '.editorconfig': 'ini', '.nvmrc': 'text',
};

/* ----------------------------------------------------------------------------
 * Folder descriptions (Claude Code plugin layout). Used to seed folder intros;
 * a generic fallback covers anything not listed.
 * ------------------------------------------------------------------------- */

const FOLDER_DESCRIPTIONS = {
  '.': 'Project root — top-level configuration, manifests, and primary documentation for the plugin.',
  '.claude': 'Local Claude Code workspace settings for this project.',
  '.claude-plugin': 'Claude Code plugin manifest and marketplace metadata that describe how the plugin is published and discovered.',
  '.github': 'GitHub repository automation — issue templates and CI/CD workflow definitions.',
  agents: 'Subagent definitions — specialized agent personas the plugin can dispatch for focused tasks.',
  bin: 'Executable entrypoints exposed by the package (CLI binaries).',
  commands: 'Slash-command definitions — each Markdown file declares a user-invocable `/command` and its behavior.',
  docs: 'User- and developer-facing documentation for the plugin.',
  'docs-legacy': 'Archived / superseded documentation kept for reference.',
  hooks: 'Claude Code lifecycle hooks — scripts that run on session, tool-use, compaction, and stop events.',
  monitors: 'Background health monitors for plugin services (e.g. the memory daemon).',
  scripts: 'Build, setup, and maintenance scripts (including this source-bundle generator).',
  skills: 'Skill definitions — reusable capability modules grouped by domain, each with a SKILL.md.',
  src: 'TypeScript source for the plugin core, memory subsystem, services, and utilities.',
  'src/core': 'Core runtime primitives shared across the plugin.',
  'src/memory': 'Persistent project-memory subsystem — daemon, storage, MCP server, and web surface.',
  'src/memory/daemon': 'Long-running memory daemon process and its control logic.',
  'src/memory/mcp': 'MCP server exposing memory tools to Claude Code.',
  'src/memory/storage': 'Memory persistence backends and storage adapters.',
  'src/memory/web': 'Web dashboard surface for inspecting memory.',
  'src/services': 'Cross-cutting services consumed by the plugin runtime.',
  'src/utils': 'Shared utility helpers.',
  tests: 'Automated test suites for hooks and skills.',
};

/* ----------------------------------------------------------------------------
 * Skip log
 * ------------------------------------------------------------------------- */

const skipped = {
  dirs: new Map(),  // relDir -> reason
  files: [],        // { rel, reason }
};

/* ----------------------------------------------------------------------------
 * Eligibility helpers
 * ------------------------------------------------------------------------- */

function ext(name) {
  const i = name.lastIndexOf('.');
  if (i <= 0) return ''; // no ext, or dotfile like ".gitignore"
  return name.slice(i + 1).toLowerCase();
}

function isExcludedDir(name, isTopLevel) {
  return ALWAYS_EXCLUDED_DIRS.has(name) || (isTopLevel && ROOT_ONLY_EXCLUDED_DIRS.has(name));
}

/** Returns a skip reason string if the file should be skipped, else null. */
function fileSkipReason(name) {
  if (EXCLUDED_FILES.has(name)) return 'lock/scratch/OS file';
  for (const re of SECRET_PATTERNS) {
    if (re.test(name)) return 'looks like a secret/key/credential file';
  }
  const e = ext(name);
  if (e && BINARY_EXT.has(e)) return `binary/media (.${e})`;
  return null;
}

function rel(abs) {
  const r = path.relative(ROOT, abs);
  return r === '' ? '.' : r.split(path.sep).join('/');
}

/** Direct, eligible children of a directory. */
function listEligible(absDir) {
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  const isTopLevel = absDir === ROOT;
  const files = [];
  const dirs = [];
  for (const ent of entries) {
    const abs = path.join(absDir, ent.name);
    if (ent.isSymbolicLink()) {
      skipped.files.push({ rel: rel(abs), reason: 'symlink' });
      continue;
    }
    if (ent.isDirectory()) {
      if (isExcludedDir(ent.name, isTopLevel)) {
        skipped.dirs.set(rel(abs), `excluded directory (${ent.name})`);
        continue;
      }
      dirs.push(abs);
    } else if (ent.isFile()) {
      const reason = fileSkipReason(ent.name);
      if (reason) {
        skipped.files.push({ rel: rel(abs), reason });
        continue;
      }
      files.push(abs);
    }
  }
  files.sort((a, b) => a.localeCompare(b));
  dirs.sort((a, b) => a.localeCompare(b));
  return { files, dirs };
}

/** Recursive eligible file count for a directory subtree. */
function countSubtree(absDir) {
  const { files, dirs } = listEligible(absDir);
  let n = files.length;
  for (const d of dirs) n += countSubtree(d);
  return n;
}

/** All eligible files under a subtree, sorted, as absolute paths. */
function collectSubtree(absDir) {
  const out = [];
  (function walk(d) {
    const { files, dirs } = listEligible(d);
    out.push(...files);
    for (const sd of dirs) walk(sd);
  })(absDir);
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

/* ----------------------------------------------------------------------------
 * Grouping: produce { dirRel, files[] } bundles.
 * ------------------------------------------------------------------------- */

function buildGroups() {
  const groups = [];

  function recurse(absDir, depth) {
    const isRoot = absDir === ROOT;
    const { files, dirs } = listEligible(absDir);

    if (isRoot) {
      if (files.length) groups.push({ dirRel: '.', files: [...files] });
      for (const d of dirs) recurse(d, 1);
      return;
    }

    const subtree = countSubtree(absDir);
    if (subtree === 0) return;

    const childDirsWithFiles = dirs.filter((d) => countSubtree(d) > 0);
    const shouldDescend =
      subtree > GROUP_DESCEND_THRESHOLD &&
      childDirsWithFiles.length > 0 &&
      depth < MAX_GROUP_DEPTH;

    if (!shouldDescend) {
      groups.push({ dirRel: rel(absDir), files: collectSubtree(absDir) });
      return;
    }

    // Descend: this folder's *direct* files become their own bundle, and each
    // child directory is grouped on its own.
    if (files.length) groups.push({ dirRel: rel(absDir), files: [...files] });
    for (const d of childDirsWithFiles) recurse(d, depth + 1);
  }

  recurse(ROOT, 0);
  return groups;
}

/* ----------------------------------------------------------------------------
 * Naming
 * ------------------------------------------------------------------------- */

function safeName(dirRel) {
  if (dirRel === '.' || dirRel === '') return 'root';
  const cleaned = dirRel
    .split('/')
    .map((seg) => seg.replace(/^\.+/, '')) // drop leading dots (.github -> github)
    .join('-')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'root';
}

/* ----------------------------------------------------------------------------
 * Intros (deterministic, extracted from the source)
 * ------------------------------------------------------------------------- */

function clip(s, n = 220) {
  s = String(s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

function languageFor(name) {
  if (NAME_LANG[name]) return NAME_LANG[name];
  const e = ext(name);
  return EXT_LANG[e] ?? '';
}

function jsonFileIntro(name) {
  const known = {
    'package.json': 'npm package manifest — dependencies, scripts, and metadata.',
    'package-lock.json': 'npm dependency lockfile.',
    'tsconfig.json': 'TypeScript compiler configuration.',
    '.eslintrc.json': 'ESLint configuration.',
    '.prettierrc.json': 'Prettier formatting configuration.',
    '.mcp.json': 'MCP server configuration for the plugin.',
    'plugin.json': 'Claude Code plugin manifest.',
    'marketplace.json': 'Claude Code marketplace listing metadata.',
    'settings.json': 'Claude Code settings (permissions, hooks, env).',
    'settings.local.json': 'Local Claude Code settings overrides.',
  };
  return known[name] ?? 'JSON configuration / data file.';
}

/** Best-effort one-line description of a single file from its content. */
function fileIntro(name, content) {
  const e = ext(name);
  const lang = languageFor(name);

  // Markdown: frontmatter description, else first H1, else first prose line.
  if (e === 'md' || e === 'markdown' || e === 'mdx') {
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fm) {
      const desc = fm[1].match(/^description:\s*(.+)$/m);
      if (desc) return clip(desc[1].replace(/^["']|["']$/g, ''));
      const nm = fm[1].match(/^name:\s*(.+)$/m);
      if (nm) return clip(`Definition for "${nm[1].replace(/^["']|["']$/g, '')}".`);
    }
    const h1 = content.match(/^#\s+(.+)$/m);
    if (h1) return clip(`Documents: ${h1[1]}`);
    const firstLine = content.split(/\r?\n/).find((l) => l.trim() && !l.startsWith('---'));
    if (firstLine) return clip(firstLine);
    return 'Markdown document.';
  }

  // JS/TS family: leading comment block, else first export/declaration.
  if (['ts', 'tsx', 'mts', 'cts', 'js', 'jsx', 'mjs', 'cjs'].includes(e)) {
    const block = content.match(/\/\*\*?\s*([\s\S]*?)\*\//);
    if (block) {
      const text = block[1]
        .split(/\r?\n/)
        .map((l) => l.replace(/^\s*\*\s?/, '').trim())
        .filter((l) => l && !l.startsWith('@'))
        .join(' ');
      if (text) return clip(text);
    }
    const lineComments = [];
    for (const l of content.split(/\r?\n/)) {
      const t = l.trim();
      if (t.startsWith('//')) lineComments.push(t.replace(/^\/\/+\s?/, ''));
      else if (t) break;
    }
    if (lineComments.length) return clip(lineComments.join(' '));
    const exp = content.match(/export\s+(?:default\s+)?(?:async\s+)?(class|function|const|interface|type|enum)\s+([A-Za-z0-9_$]+)/);
    if (exp) return clip(`Exports ${exp[1]} \`${exp[2]}\`.`);
    return 'TypeScript/JavaScript module.';
  }

  if (e === 'json' || e === 'jsonc' || e === 'json5') return jsonFileIntro(name);

  if (e === 'yml' || e === 'yaml') {
    const comment = content.split(/\r?\n/).find((l) => l.trim().startsWith('#'));
    if (comment) return clip(comment.replace(/^#\s?/, ''));
    const nameField = content.match(/^name:\s*(.+)$/m);
    if (nameField) return clip(`YAML config: ${nameField[1]}`);
    return 'YAML configuration file.';
  }

  if (lang === 'sh') {
    const comment = content
      .split(/\r?\n/)
      .filter((l) => l.trim().startsWith('#') && !l.startsWith('#!'))
      .map((l) => l.replace(/^#\s?/, '').trim())
      .find(Boolean);
    if (comment) return clip(comment);
    return 'Shell script.';
  }

  if (lang === 'apex') return clip(`Apex source (${name}).`);
  if (lang === 'css' || lang === 'scss' || lang === 'sass' || lang === 'less')
    return 'Stylesheet.';
  if (lang === 'html') return 'HTML document.';

  return lang ? `${lang} file.` : 'Source file.';
}

function folderIntro(dirRel, files) {
  const base = FOLDER_DESCRIPTIONS[dirRel];
  // Count extensions for a quick composition note.
  const extCounts = {};
  for (const f of files) {
    const e = ext(path.basename(f)) || '(no ext)';
    extCounts[e] = (extCounts[e] || 0) + 1;
  }
  const comp = Object.entries(extCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([e, n]) => `${n}×.${e === '(no ext)' ? '' : e}`)
    .join(', ');

  if (base) {
    return `${base}\n\nThis bundle consolidates **${files.length}** file(s) (${comp}) from \`${dirRel}/\`.`;
  }
  const label = dirRel === '.' ? 'the project root' : `\`${dirRel}/\``;
  return `Files from ${label}. This folder appears to contain ${files.length} related source file(s) (${comp}).`;
}

/* ----------------------------------------------------------------------------
 * Code-fence helper — pick a fence longer than any backtick run in the content.
 * ------------------------------------------------------------------------- */

function fenceFor(content) {
  let longest = 0;
  const m = content.match(/`+/g);
  if (m) for (const run of m) longest = Math.max(longest, run.length);
  return '`'.repeat(Math.max(3, longest + 1));
}

/* ----------------------------------------------------------------------------
 * Render one file section.
 * ------------------------------------------------------------------------- */

function renderFileSection(absFile) {
  const relFile = rel(absFile);
  const name = path.basename(absFile);
  let content;
  try {
    const stat = fs.statSync(absFile);
    if (stat.size > MAX_FILE_BYTES) {
      skipped.files.push({ rel: relFile, reason: `too large (${stat.size} bytes)` });
      return null;
    }
    content = fs.readFileSync(absFile, 'utf8');
  } catch (err) {
    skipped.files.push({ rel: relFile, reason: `unreadable (${err.code || err.message})` });
    return null;
  }
  // Heuristic binary guard: NUL byte → not text.
  if (content.includes(String.fromCharCode(0))) {
    skipped.files.push({ rel: relFile, reason: 'binary content (NUL byte)' });
    return null;
  }

  const lang = languageFor(name);
  const intro = fileIntro(name, content);
  const fence = fenceFor(content);
  const body = content.endsWith('\n') ? content.slice(0, -1) : content;

  const md =
    `### \`${relFile}\`\n\n` +
    `_Generated note: ${intro}_\n\n` +
    `${fence}${lang}\n${body}\n${fence}\n`;

  return { relFile, md, bytes: Buffer.byteLength(content, 'utf8') };
}

/* ----------------------------------------------------------------------------
 * Render a group into one or more output files (parts).
 * ------------------------------------------------------------------------- */

function renderGroup(group) {
  const sections = [];
  for (const f of group.files) {
    const s = renderFileSection(f);
    if (s) sections.push(s);
  }
  if (sections.length === 0) return null; // nothing embeddable

  // Greedy pack sections into parts by source bytes.
  const parts = [];
  let cur = [];
  let curBytes = 0;
  for (const s of sections) {
    if (cur.length > 0 && curBytes + s.bytes > MAX_PART_BYTES) {
      parts.push(cur);
      cur = [];
      curBytes = 0;
    }
    cur.push(s);
    curBytes += s.bytes;
  }
  if (cur.length) parts.push(cur);

  const base = safeName(group.dirRel);
  const total = parts.length;
  const dispPath = group.dirRel === '.' ? '(project root)' : `${group.dirRel}/`;
  const outputs = [];

  parts.forEach((partSections, idx) => {
    const fileName =
      total === 1
        ? `${base}.source.md`
        : `${base}.part-${String(idx + 1).padStart(2, '0')}.source.md`;

    const partLabel = total === 1 ? '' : ` (part ${idx + 1} of ${total})`;
    const header =
      `# Source Bundle: \`${dispPath}\`${partLabel}\n\n` +
      `${folderIntro(group.dirRel, group.files)}\n\n` +
      `## Folder summary\n\n` +
      `Files included in this part (${partSections.length}):\n\n` +
      partSections.map((s) => `- \`${s.relFile}\``).join('\n') +
      `\n\n---\n\n## Files\n\n`;

    const content = header + partSections.map((s) => s.md).join('\n---\n\n');
    outputs.push({
      fileName,
      dirRel: group.dirRel,
      content,
      fileCount: partSections.length,
      part: idx + 1,
      totalParts: total,
      relFiles: partSections.map((s) => s.relFile),
    });
  });

  return outputs;
}

/* ----------------------------------------------------------------------------
 * Project tree (included files only)
 * ------------------------------------------------------------------------- */

function buildTree(relFiles) {
  const rootNode = { dirs: new Map(), files: [] };
  for (const rf of relFiles) {
    const parts = rf.split('/');
    let node = rootNode;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      if (!node.dirs.has(seg)) node.dirs.set(seg, { dirs: new Map(), files: [] });
      node = node.dirs.get(seg);
    }
    node.files.push(parts[parts.length - 1]);
  }

  const lines = ['.'];
  function render(node, prefix) {
    const dirNames = [...node.dirs.keys()].sort((a, b) => a.localeCompare(b));
    const files = node.files.slice().sort((a, b) => a.localeCompare(b));
    const entries = [
      ...dirNames.map((d) => ({ type: 'dir', name: d })),
      ...files.map((f) => ({ type: 'file', name: f })),
    ];
    entries.forEach((ent, i) => {
      const last = i === entries.length - 1;
      const branch = last ? '└── ' : '├── ';
      if (ent.type === 'dir') {
        lines.push(`${prefix}${branch}${ent.name}/`);
        render(node.dirs.get(ent.name), prefix + (last ? '    ' : '│   '));
      } else {
        lines.push(`${prefix}${branch}${ent.name}`);
      }
    });
  }
  render(rootNode, '');
  return lines.join('\n');
}

/* ----------------------------------------------------------------------------
 * .gitignore — ensure `.source/` is ignored (idempotent).
 * ------------------------------------------------------------------------- */

function ensureGitignore() {
  const giPath = path.join(ROOT, '.gitignore');
  let text = '';
  let existed = false;
  try {
    text = fs.readFileSync(giPath, 'utf8');
    existed = true;
  } catch {
    /* no .gitignore yet */
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const already = lines.some((l) => l === '.source' || l === '.source/' || l === '/.source' || l === '/.source/');
  if (already) return { changed: false, existed };

  const addition = `${existed && text.length && !text.endsWith('\n') ? '\n' : ''}` +
    `\n# AI-ingestion source bundles (generated by scripts/generate-source-md.mjs)\n.source/\n`;
  fs.writeFileSync(giPath, (existed ? text : '') + addition, 'utf8');
  return { changed: true, existed };
}

/* ----------------------------------------------------------------------------
 * Main
 * ------------------------------------------------------------------------- */

function main() {
  // 1. Clean + recreate .source (only ever touches ROOT/.source).
  if (path.resolve(OUT_DIR) !== path.join(ROOT, OUT_DIRNAME)) {
    throw new Error('Refusing to operate: OUT_DIR is not <root>/.source');
  }
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1b. Ensure `.source/` is git-ignored BEFORE embedding, so the copy of
  // .gitignore captured in the bundles reflects its final state.
  const gi = ensureGitignore();

  // 2. Build groups + render.
  const groups = buildGroups();
  const written = []; // output file descriptors
  const allIncludedFiles = new Set();

  for (const group of groups) {
    const outputs = renderGroup(group);
    if (!outputs) continue;
    for (const out of outputs) {
      fs.writeFileSync(path.join(OUT_DIR, out.fileName), out.content, 'utf8');
      written.push(out);
      for (const rf of out.relFiles) allIncludedFiles.add(rf);
    }
  }

  // 3. Index file.
  const tree = buildTree([...allIncludedFiles]);
  const byFolder = new Map();
  for (const w of written) {
    if (!byFolder.has(w.dirRel)) byFolder.set(w.dirRel, []);
    byFolder.get(w.dirRel).push(w);
  }

  const indexLines = [];
  indexLines.push('# Source Bundle Index');
  indexLines.push('');
  indexLines.push(
    `This \`.source/\` folder contains an **AI-ingestion-friendly** Markdown copy of the ` +
    `plugin source tree. Each \`*.source.md\` file consolidates one meaningful source ` +
    `folder: a generated introduction, a file listing, and every file's exact contents ` +
    `inside fenced code blocks. The contents are verbatim — nothing is rewritten or summarized.`
  );
  indexLines.push('');
  // Show a regenerate command appropriate to how this run was invoked: a local
  // relative path when the script lives inside the project, else the plugin
  // slash-command (the script is shipped elsewhere, e.g. the plugin cache).
  const selfRel = path.relative(ROOT, SCRIPT_PATH).split(path.sep).join('/');
  const regenCmd =
    selfRel.startsWith('..') || path.isAbsolute(selfRel)
      ? '/siftcoder:source-bundle'
      : `node ${selfRel}`;
  indexLines.push(`Regenerate with:\n\n\`\`\`sh\n${regenCmd}\n\`\`\``);
  indexLines.push('');
  indexLines.push(`Generated: ${new Date().toISOString()}`);
  indexLines.push('');
  indexLines.push('## Summary');
  indexLines.push('');
  indexLines.push(`- Source folders converted: **${byFolder.size}**`);
  indexLines.push(`- Markdown bundles generated (excluding this index): **${written.length}**`);
  indexLines.push(`- Source files embedded: **${allIncludedFiles.size}**`);
  indexLines.push(`- Files skipped: **${skipped.files.length}**, directories skipped: **${skipped.dirs.size}**`);
  indexLines.push('');
  indexLines.push('## Included project tree');
  indexLines.push('');
  indexLines.push('```text');
  indexLines.push(tree);
  indexLines.push('```');
  indexLines.push('');
  indexLines.push('## Generated bundles');
  indexLines.push('');
  indexLines.push('| Bundle | Source folder | Files | Part |');
  indexLines.push('| --- | --- | --- | --- |');
  for (const w of written.slice().sort((a, b) => a.fileName.localeCompare(b.fileName))) {
    const partTxt = w.totalParts === 1 ? '—' : `${w.part}/${w.totalParts}`;
    const folder = w.dirRel === '.' ? '(root)' : `\`${w.dirRel}/\``;
    indexLines.push(`| [\`${w.fileName}\`](./${w.fileName}) | ${folder} | ${w.fileCount} | ${partTxt} |`);
  }
  indexLines.push('');
  indexLines.push('## What each bundle covers');
  indexLines.push('');
  for (const [dirRel, ws] of [...byFolder.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const desc = FOLDER_DESCRIPTIONS[dirRel] || (dirRel === '.' ? 'Project root files.' : `Files from \`${dirRel}/\`.`);
    const fileNames = ws.map((w) => `\`${w.fileName}\``).join(', ');
    const folderLabel = dirRel === '.' ? '(root)' : `\`${dirRel}/\``;
    indexLines.push(`- **${folderLabel}** → ${fileNames}\n  ${desc}`);
  }
  if (skipped.dirs.size || skipped.files.length) {
    indexLines.push('');
    indexLines.push('## Skipped');
    indexLines.push('');
    if (skipped.dirs.size) {
      indexLines.push('Directories:');
      indexLines.push('');
      for (const [d, reason] of [...skipped.dirs.entries()].sort()) {
        indexLines.push(`- \`${d}/\` — ${reason}`);
      }
      indexLines.push('');
    }
    if (skipped.files.length) {
      // Group file skips by reason for compactness.
      const byReason = new Map();
      for (const s of skipped.files) {
        if (!byReason.has(s.reason)) byReason.set(s.reason, []);
        byReason.get(s.reason).push(s.rel);
      }
      indexLines.push('Files (by reason):');
      indexLines.push('');
      for (const [reason, list] of [...byReason.entries()].sort()) {
        const sample = list.slice(0, 8).map((x) => `\`${x}\``).join(', ');
        const more = list.length > 8 ? ` … (+${list.length - 8} more)` : '';
        indexLines.push(`- **${reason}** (${list.length}): ${sample}${more}`);
      }
    }
  }
  indexLines.push('');

  fs.writeFileSync(path.join(OUT_DIR, 'index.source.md'), indexLines.join('\n'), 'utf8');

  // 5. Console report.
  console.log(`✔ Source bundles generated under ${path.join(ROOT, OUT_DIRNAME)}`);
  console.log(`  • Source folders converted : ${byFolder.size}`);
  console.log(`  • Markdown files generated  : ${written.length + 1} (incl. index.source.md)`);
  console.log(`  • Source files embedded     : ${allIncludedFiles.size}`);
  console.log(`  • Files skipped             : ${skipped.files.length}`);
  console.log(`  • Directories skipped       : ${skipped.dirs.size}`);
  console.log(`  • .gitignore                : ${gi.changed ? 'added .source/' : 'already ignored'}`);
}

main();
