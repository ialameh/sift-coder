/**
 * Replay Claude Code transcript .jsonl files into SiftCoder Memory.
 *
 * Parses ~/.claude/projects/<encoded-cwd>/<session-id>.jsonl, pairs each assistant `tool_use`
 * content block with its matching `tool_result`, and emits capture-shaped frames suitable for the
 * daemon's existing capture endpoint. Tagged `source: 'replay'` so the resulting events are
 * distinguishable from live captures.
 *
 * No state is mutated. Pure parsing — the CLI subcommand wraps the output in network calls.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

export interface ReplayFrame {
  ts: number;
  sessionId: string;
  tool: string;
  payload: { tool_input: unknown; tool_response: unknown };
  source: 'replay';
}

export interface ReplayOptions {
  /** Filter to specific tool names. Defaults to the same set the live PostToolUse hook captures. */
  tools?: ReadonlySet<string>;
  /** Cap the number of frames returned. Useful for dry-runs and tests. */
  limit?: number;
}

export const DEFAULT_TOOLS: ReadonlySet<string> = new Set(['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob']);

interface AssistantContent {
  type: string;
  id?: string;
  name?: string;
  input?: unknown;
}

interface UserContent {
  type: string;
  tool_use_id?: string;
  content?: unknown;
}

interface TranscriptEntry {
  type?: string;
  timestamp?: string;
  message?: { role?: string; content?: AssistantContent[] | UserContent[] | string };
}

/**
 * Parse a transcript .jsonl content string and return capture frames in chronological order.
 * Bad lines are skipped silently.
 */
export function parseTranscript(jsonl: string, sessionId: string, opts: ReplayOptions = {}): ReplayFrame[] {
  const tools = opts.tools ?? DEFAULT_TOOLS;
  const limit = opts.limit ?? Infinity;

  const pendingTools = new Map<string, { name: string; input: unknown; ts: number }>();
  const frames: ReplayFrame[] = [];

  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue;
    let e: TranscriptEntry;
    try { e = JSON.parse(line) as TranscriptEntry; } catch { continue; }
    const ts = e.timestamp ? Date.parse(e.timestamp) : NaN;
    if (!Number.isFinite(ts)) continue;

    if (e.type === 'assistant' && Array.isArray(e.message?.content)) {
      for (const c of e.message.content as AssistantContent[]) {
        if (c.type !== 'tool_use' || !c.id || !c.name) continue;
        if (!tools.has(c.name)) continue;
        pendingTools.set(c.id, { name: c.name, input: c.input ?? null, ts });
      }
      continue;
    }

    if (e.type === 'user' && Array.isArray(e.message?.content)) {
      for (const c of e.message.content as UserContent[]) {
        if (c.type !== 'tool_result' || !c.tool_use_id) continue;
        const pending = pendingTools.get(c.tool_use_id);
        if (!pending) continue;
        pendingTools.delete(c.tool_use_id);
        frames.push({
          ts: pending.ts,
          sessionId,
          tool: pending.name,
          payload: { tool_input: pending.input, tool_response: c.content ?? null },
          source: 'replay',
        });
        if (frames.length >= limit) return frames;
      }
    }
  }
  return frames;
}

/**
 * Locate the .jsonl file for a Claude Code session id. If `cwd` is given, search only that
 * encoded project dir; otherwise scan all projects under ~/.claude/projects/.
 */
/* c8 ignore next -- homedir() default exercised in real runs; tests pass explicit home */
export function locateTranscript(sessionId: string, cwd?: string, home: string = homedir()): string | null {
  const projects = join(home, '.claude', 'projects');
  if (!existsSync(projects)) return null;
  if (cwd) {
    const dir = join(projects, cwd.replace(/\//g, '-'));
    const candidate = join(dir, `${sessionId}.jsonl`);
    return existsSync(candidate) ? candidate : null;
  }
  for (const sub of readdirSync(projects)) {
    const candidate = join(projects, sub, `${sessionId}.jsonl`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * List recent transcripts under ~/.claude/projects/ newest-first, with optional cwd filter.
 */
export interface TranscriptInfo {
  sessionId: string;
  path: string;
  encodedCwd: string;
  mtime: number;
  sizeBytes: number;
}

export function listTranscripts(opts: { home?: string; cwd?: string; limit?: number } = {}): TranscriptInfo[] {
  /* c8 ignore next -- homedir() default exercised in real runs; tests always pass an explicit home */
  const home = opts.home ?? homedir();
  const projects = join(home, '.claude', 'projects');
  if (!existsSync(projects)) return [];
  const entries: TranscriptInfo[] = [];
  const targets = opts.cwd
    ? [opts.cwd.replace(/\//g, '-')]
    : readdirSync(projects);
  for (const enc of targets) {
    const dir = join(projects, enc);
    /* c8 ignore next -- defensive guard for race where projects subdir disappears between readdir and stat */
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const path = join(dir, f);
      let st;
      /* c8 ignore next -- catches the rare race where a jsonl file is removed between readdir and stat */
      try { st = statSync(path); } catch { continue; }
      entries.push({
        sessionId: f.replace(/\.jsonl$/, ''),
        path,
        encodedCwd: enc,
        mtime: st.mtimeMs,
        sizeBytes: st.size,
      });
    }
  }
  entries.sort((a, b) => b.mtime - a.mtime);
  if (opts.limit !== undefined) return entries.slice(0, opts.limit);
  return entries;
}

export function readTranscript(path: string): string {
  return readFileSync(path, 'utf8');
}
