/**
 * Reverse-Prompt Service
 *
 * Local-only orchestration for /siftcoder:reverse-prompt.
 * Responsibilities:
 *   - Gather context for Quick / Deep / Focus modes
 *   - Cache generated prompts under .claude/siftcoder-state/reverse-prompts/
 *   - In-flight dedup via Map<fingerprint, Promise>
 *
 * Generation itself is performed by the calling Claude session — this service
 * exposes context-gathering + cache CRUD as building blocks. The command spec
 * (commands/reverse-prompt.md) ties them together.
 *
 * Inspired by gitreverse (app/api/reverse-prompt/route.ts).
 */
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { focusFingerprint, shortFingerprint, QUICK_REVERSE_FOCUS, DEEP_REVERSE_FOCUS } from '../utils/focus-fingerprint.js';
import { formatLocalTree } from '../utils/tree-formatter.js';

const STATE_DIR = process.env.SIFTCODER_STATE_DIR || '.claude/siftcoder-state';
const CACHE_DIR_NAME = 'reverse-prompts';

const inflight = new Map();

export const SYSTEM_PROMPT = `You are an expert at inferring how people actually prompt modern coding agents.

## Task

You are given repository context (metadata, file tree, README, optional deep summary). Output ONE synthetic user message: the kind of prompt a non-technical or lightly technical person might paste into Cursor, Claude Code, Codex, ChatGPT code mode, or v0 to get this project built in one "vibe coding" pass.

## Output rules

- Plain language. Sounds like a real request ("Build me…", "I want…"), not an architecture doc.
- Outcome focused. Describe what the app or library should DO for a user using normal-person words.
- Honest scope. Only claim features or stacks the context supports. If README is thin, keep claims vague or limited to metadata signals.
- Length: about 120 to 200 words. One short paragraph or a few tight sentences. Not a bullet list of file paths or dependencies.
- Tone: natural and conversational. Contractions are fine. No preamble ("Sure, here is…"), no meta ("As an AI…"), no filler.
- NEVER use hyphens or em-dashes — split into shorter sentences or use commas.

## Avoid

- Framework jargon, exact package names, folder structure (unless README clearly shows the user cared).
- Agent system instructions, markdown specs, pseudo-code blocks.
- Inventing features unsupported by the evidence.

## Context about agent capabilities

Modern agents can search the web, read docs, iterate in the IDE. ONE short line like "look up current docs online if you need to" is fine when it matches real workflow. Do not turn the prompt into a tutorial.

## Output format

Reply with ONLY the synthetic user message. No title, no quotes around it, no explanation before or after.`;

function getCacheDir(projectRoot) {
    return path.join(projectRoot || process.cwd(), STATE_DIR, CACHE_DIR_NAME);
}

function getIndexPath(projectRoot) {
    return path.join(getCacheDir(projectRoot), 'index.json');
}

async function ensureDir(dir) {
    await fsp.mkdir(dir, { recursive: true });
}

async function readJson(filePath, fallback) {
    try {
        const raw = await fsp.readFile(filePath, 'utf8');
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

async function writeJson(filePath, data) {
    await ensureDir(path.dirname(filePath));
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function safeRead(absPath, maxBytes = 64 * 1024) {
    try {
        const stat = fs.statSync(absPath);
        if (!stat.isFile()) return null;
        const buf = fs.readFileSync(absPath, 'utf8');
        return buf.length > maxBytes ? buf.slice(0, maxBytes) + '\n…[truncated]' : buf;
    } catch {
        return null;
    }
}

function detectRepoId(projectRoot) {
    try {
        const remote = execSync('git config --get remote.origin.url', {
            cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        const m = remote.match(/[:/]([^/:]+)\/([^/]+?)(?:\.git)?$/);
        if (m) return `${m[1]}/${m[2]}`;
    } catch { /* not a git repo or no remote */ }
    return `local:${path.basename(path.resolve(projectRoot))}`;
}

function findManifest(projectRoot) {
    const candidates = [
        'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod',
        'pom.xml', 'build.gradle', 'composer.json', 'Gemfile',
        'sfdx-project.json',
    ];
    for (const name of candidates) {
        const p = path.join(projectRoot, name);
        if (fs.existsSync(p)) return { name, content: safeRead(p) };
    }
    return null;
}

function findReadme(projectRoot) {
    const candidates = ['README.md', 'README.MD', 'readme.md', 'README', 'README.rst', 'README.txt'];
    for (const name of candidates) {
        const p = path.join(projectRoot, name);
        if (fs.existsSync(p)) return safeRead(p, 32 * 1024);
    }
    return null;
}

/**
 * Gather Quick-mode context: manifest, root tree (depth 2), README.
 */
export function gatherQuickContext(projectRoot) {
    const root = projectRoot || process.cwd();
    return {
        repoId: detectRepoId(root),
        manifest: findManifest(root),
        tree: formatLocalTree(root, { depth: 2, maxEntries: 200 }),
        readme: findReadme(root),
    };
}

/**
 * Build the user-message context block fed to the LLM (i.e. the Claude session).
 */
export function buildContextBlock(ctx, opts = {}) {
    const lines = [];
    lines.push(`## Repository`);
    lines.push(ctx.repoId);
    if (ctx.manifest) {
        lines.push(`\n## Manifest (${ctx.manifest.name})`);
        lines.push('```');
        lines.push(ctx.manifest.content || '(empty)');
        lines.push('```');
    }
    lines.push(`\n## File tree`);
    lines.push('```');
    lines.push(ctx.tree);
    lines.push('```');
    if (ctx.readme) {
        lines.push(`\n## README`);
        lines.push(ctx.readme);
    } else {
        lines.push(`\n## README`);
        lines.push('(no README found — keep claims minimal)');
    }
    if (opts.deepSummary) {
        lines.push(`\n## Deep codebase summary`);
        lines.push(opts.deepSummary);
    }
    if (opts.focus && opts.focus !== QUICK_REVERSE_FOCUS && opts.focus !== DEEP_REVERSE_FOCUS) {
        lines.push(`\n## Caller focus`);
        lines.push(`The user wants the synthetic prompt centered on: ${opts.focus}`);
    }
    return lines.join('\n');
}

function cacheKey(repoId, mode, focus) {
    return shortFingerprint(`${repoId}::${mode}::${focus}`);
}

/**
 * Look up cached prompt. Returns null on miss.
 */
export async function getCached({ repoId, mode, focus, projectRoot }) {
    const key = cacheKey(repoId, mode, focus);
    const filePath = path.join(getCacheDir(projectRoot), `${key}.json`);
    return readJson(filePath, null);
}

/**
 * Persist generated prompt + update index.
 */
export async function putCached({ repoId, mode, focus, prompt, projectRoot }) {
    const key = cacheKey(repoId, mode, focus);
    const dir = getCacheDir(projectRoot);
    await ensureDir(dir);
    const entry = {
        id: key,
        repoId,
        mode,
        focus,
        prompt,
        generatedAt: new Date().toISOString(),
    };
    await writeJson(path.join(dir, `${key}.json`), entry);

    const indexPath = getIndexPath(projectRoot);
    const index = (await readJson(indexPath, null)) || { entries: [] };
    index.entries = index.entries.filter((e) => e.id !== key);
    index.entries.unshift({
        id: key,
        repoId,
        mode,
        focus,
        generatedAt: entry.generatedAt,
        preview: (prompt || '').slice(0, 80).replace(/\s+/g, ' '),
    });
    if (index.entries.length > 200) index.entries = index.entries.slice(0, 200);
    await writeJson(indexPath, index);
    return entry;
}

/**
 * List cache index entries (most recent first).
 */
export async function listCached({ projectRoot } = {}) {
    const index = await readJson(getIndexPath(projectRoot), { entries: [] });
    return index.entries || [];
}

/**
 * Run an async generator with in-flight dedup keyed by fingerprint.
 * Prevents two parallel invocations with identical params from doing duplicate work.
 */
export async function withDedup(key, fn) {
    if (inflight.has(key)) return inflight.get(key);
    const p = (async () => {
        try {
            return await fn();
        } finally {
            inflight.delete(key);
        }
    })();
    inflight.set(key, p);
    return p;
}

export const constants = {
    QUICK_REVERSE_FOCUS,
    DEEP_REVERSE_FOCUS,
    cacheKey,
    focusFingerprint,
};
