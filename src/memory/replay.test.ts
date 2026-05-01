import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseTranscript, locateTranscript, listTranscripts, readTranscript, DEFAULT_TOOLS } from './replay.js';

let home: string;

function mkTranscript(cwd: string, sessionId: string, lines: string[], mtime?: number): string {
  const enc = cwd.replace(/\//g, '-');
  const dir = join(home, '.claude', 'projects', enc);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${sessionId}.jsonl`);
  writeFileSync(path, lines.join('\n') + '\n');
  if (mtime !== undefined) {
    const fs = require('node:fs');
    fs.utimesSync(path, mtime / 1000, mtime / 1000);
  }
  return path;
}

beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'replay-')); });
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

describe('parseTranscript', () => {
  it('pairs tool_use with tool_result by id', () => {
    const lines = [
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { role: 'assistant', content: [
        { type: 'tool_use', id: 'tu1', name: 'Read', input: { file_path: '/x.ts' } },
      ] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { role: 'user', content: [
        { type: 'tool_result', tool_use_id: 'tu1', content: 'file contents' },
      ] } }),
    ];
    const frames = parseTranscript(lines.join('\n'), 'sess-1');
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      sessionId: 'sess-1',
      tool: 'Read',
      source: 'replay',
      payload: { tool_input: { file_path: '/x.ts' }, tool_response: 'file contents' },
    });
  });

  it('skips tool_use entries whose tool name is not in the filter set', () => {
    const lines = [
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { role: 'assistant', content: [
        { type: 'tool_use', id: 'a', name: 'TodoWrite', input: {} },
      ] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { role: 'user', content: [
        { type: 'tool_result', tool_use_id: 'a', content: 'ok' },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toEqual([]);
  });

  it('honors a custom tools filter', () => {
    const lines = [
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { content: [
        { type: 'tool_use', id: 'a', name: 'TodoWrite', input: {} },
      ] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', tool_use_id: 'a', content: 'ok' },
      ] } }),
    ];
    const frames = parseTranscript(lines.join('\n'), 's', { tools: new Set(['TodoWrite']) });
    expect(frames).toHaveLength(1);
  });

  it('skips lines that do not parse as JSON', () => {
    const lines = [
      'not-json',
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { content: [
        { type: 'tool_use', id: 'a', name: 'Read', input: {} },
      ] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', tool_use_id: 'a', content: 'ok' },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toHaveLength(1);
  });

  it('skips entries without a parseable timestamp', () => {
    const lines = [
      JSON.stringify({ type: 'assistant', timestamp: 'not-a-date', message: { content: [
        { type: 'tool_use', id: 'a', name: 'Read', input: {} },
      ] } }),
      JSON.stringify({ type: 'assistant', message: { content: [
        { type: 'tool_use', id: 'b', name: 'Read', input: {} },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toEqual([]);
  });

  it('ignores tool_result entries with no matching pending tool_use', () => {
    const lines = [
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', tool_use_id: 'orphan', content: 'ok' },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toEqual([]);
  });

  it('drops assistant content blocks of type other than tool_use', () => {
    const lines = [
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { content: [
        { type: 'text', text: 'hi' },
        { type: 'tool_use', id: 'a', name: 'Read', input: { file_path: '/x' } },
      ] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', tool_use_id: 'a', content: 'ok' },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toHaveLength(1);
  });

  it('skips tool_use blocks missing id or name', () => {
    const lines = [
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { content: [
        { type: 'tool_use', name: 'Read', input: {} },
        { type: 'tool_use', id: 'b', input: {} },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toEqual([]);
  });

  it('honors the limit option', () => {
    const lines: string[] = [];
    for (let i = 0; i < 10; i++) {
      lines.push(JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { content: [
        { type: 'tool_use', id: `t${i}`, name: 'Read', input: { i } },
      ] } }));
      lines.push(JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', tool_use_id: `t${i}`, content: 'ok' },
      ] } }));
    }
    expect(parseTranscript(lines.join('\n'), 's', { limit: 3 })).toHaveLength(3);
  });

  it('ignores user messages with non-array content', () => {
    const lines = [
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:21.000Z', message: { content: 'plain string' } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toEqual([]);
  });

  it('uses null as tool_response when content is missing', () => {
    const lines = [
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { content: [
        { type: 'tool_use', id: 'a', name: 'Read', input: { x: 1 } },
      ] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', tool_use_id: 'a' },
      ] } }),
    ];
    const f = parseTranscript(lines.join('\n'), 's');
    expect(f[0]!.payload.tool_response).toBeNull();
  });

  it('uses null as tool_input when input field is missing', () => {
    const lines = [
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { content: [
        { type: 'tool_use', id: 'a', name: 'Read' },
      ] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', tool_use_id: 'a', content: 'ok' },
      ] } }),
    ];
    const f = parseTranscript(lines.join('\n'), 's');
    expect(f[0]!.payload.tool_input).toBeNull();
  });

  it('skips blank lines', () => {
    const lines = [
      '',
      '   ',
      JSON.stringify({ type: 'assistant', timestamp: '2026-04-29T07:30:21.000Z', message: { content: [
        { type: 'tool_use', id: 'a', name: 'Read', input: {} },
      ] } }),
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', tool_use_id: 'a', content: 'ok' },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toHaveLength(1);
  });

  it('drops user content blocks of type other than tool_result', () => {
    const lines = [
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'text', text: 'hello' },
        { type: 'image', source: 'foo' },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toEqual([]);
  });

  it('drops user content tool_result blocks missing tool_use_id', () => {
    const lines = [
      JSON.stringify({ type: 'user', timestamp: '2026-04-29T07:30:22.000Z', message: { content: [
        { type: 'tool_result', content: 'ok' },
      ] } }),
    ];
    expect(parseTranscript(lines.join('\n'), 's')).toEqual([]);
  });

  it('exposes the default tool filter set', () => {
    expect(DEFAULT_TOOLS.has('Read')).toBe(true);
    expect(DEFAULT_TOOLS.has('TodoWrite')).toBe(false);
  });
});

describe('locateTranscript', () => {
  it('returns the path when a session id matches under the given cwd', () => {
    mkTranscript('/repo/a', 'sess-1', ['{"type":"system"}']);
    expect(locateTranscript('sess-1', '/repo/a', home)).toContain('sess-1.jsonl');
  });

  it('searches all projects when no cwd is provided', () => {
    mkTranscript('/repo/b', 'sess-2', ['{"type":"system"}']);
    expect(locateTranscript('sess-2', undefined, home)).toContain('sess-2.jsonl');
  });

  it('returns null when ~/.claude/projects does not exist', () => {
    expect(locateTranscript('whatever', undefined, '/tmp/no-such-home-' + Date.now())).toBeNull();
  });

  it('returns null when the session id is not found', () => {
    mkTranscript('/repo/x', 'sess-1', ['{}']);
    expect(locateTranscript('missing', undefined, home)).toBeNull();
  });

  it('returns null when given a cwd that has no transcripts', () => {
    expect(locateTranscript('sess-1', '/no/such/cwd', home)).toBeNull();
  });

  it('returns null when cwd dir exists but session is not in it', () => {
    mkTranscript('/repo/here', 'real', ['{}']);
    expect(locateTranscript('missing-sess', '/repo/here', home)).toBeNull();
  });
});

describe('listTranscripts', () => {
  it('returns transcripts newest first', () => {
    mkTranscript('/repo/a', 'older', ['{}'], Date.now() - 1_000_000);
    mkTranscript('/repo/a', 'newer', ['{}'], Date.now());
    const list = listTranscripts({ home });
    expect(list[0]!.sessionId).toBe('newer');
  });

  it('filters by encoded cwd', () => {
    mkTranscript('/repo/a', 'a1', ['{}']);
    mkTranscript('/repo/b', 'b1', ['{}']);
    const list = listTranscripts({ home, cwd: '/repo/a' });
    expect(list).toHaveLength(1);
    expect(list[0]!.sessionId).toBe('a1');
  });

  it('honors the limit', () => {
    for (let i = 0; i < 5; i++) mkTranscript('/repo/a', `s${i}`, ['{}']);
    expect(listTranscripts({ home, limit: 2 })).toHaveLength(2);
  });

  it('returns empty when ~/.claude/projects is missing', () => {
    expect(listTranscripts({ home: '/tmp/missing-' + Date.now() })).toEqual([]);
  });

  it('skips a cwd-encoded directory that does not exist', () => {
    expect(listTranscripts({ home, cwd: '/never/created' })).toEqual([]);
  });

  it('skips files that fail to stat', () => {
    mkdirSync(join(home, '.claude', 'projects', 'empty'), { recursive: true });
    expect(listTranscripts({ home })).toEqual([]);
  });

  it('skips non-jsonl files in a project dir', () => {
    const enc = '-repo-a';
    const dir = join(home, '.claude', 'projects', enc);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'note.txt'), 'ignore me');
    writeFileSync(join(dir, 'sess.jsonl'), '{}');
    const list = listTranscripts({ home });
    expect(list.map(t => t.sessionId)).toEqual(['sess']);
  });
});

describe('readTranscript', () => {
  it('reads the file content', () => {
    const p = mkTranscript('/repo/a', 'sess-1', ['{"k":"v"}']);
    expect(readTranscript(p)).toContain('"k":"v"');
  });
});
