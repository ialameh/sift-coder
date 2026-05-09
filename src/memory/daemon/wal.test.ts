import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WAL } from './wal.js';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'wal-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('WAL', () => {
  it('appends ndjson entries and persists them across opens', () => {
    const path = join(dir, 'wal.ndjson');
    const w = new WAL(path);
    w.append({ ts: 1, sessionId: 's', tool: 'Read', inputHash: 'h', payload: { a: 1 } });
    w.append({ ts: 2, sessionId: 's', tool: 'Bash', inputHash: 'h2', payload: 'x' });
    w.close();
    const lines = readFileSync(path, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!)).toMatchObject({ ts: 1, tool: 'Read' });
  });

  it('open() is idempotent', () => {
    const path = join(dir, 'wal.ndjson');
    const w = new WAL(path);
    w.open();
    w.open();
    w.append({ ts: 1, sessionId: 's', tool: 'Read', inputHash: 'h', payload: {} });
    w.close();
    expect(readFileSync(path, 'utf8').trim().split('\n')).toHaveLength(1);
  });

  it('close() is a no-op when not open', () => {
    const w = new WAL(join(dir, 'wal.ndjson'));
    expect(() => w.close()).not.toThrow();
  });

  it('replay() returns [] for missing files', () => {
    expect(WAL.replay(join(dir, 'nope.ndjson'))).toEqual([]);
  });

  it('replay() parses well-formed lines and skips a torn final line', () => {
    const path = join(dir, 'wal.ndjson');
    writeFileSync(path, '{"ts":1,"sessionId":"s","tool":"R","inputHash":"h","payload":1}\n{"broken');
    const out = WAL.replay(path);
    expect(out).toHaveLength(1);
    expect(out[0]!.ts).toBe(1);
  });

  it('replay() skips blank lines without throwing', () => {
    const path = join(dir, 'wal.ndjson');
    writeFileSync(path, '\n   \n{"ts":1,"sessionId":"s","tool":"R","inputHash":"h","payload":1}\n\n');
    const out = WAL.replay(path);
    expect(out).toHaveLength(1);
  });

  it('append without fsync still writes data', () => {
    const path = join(dir, 'wal.ndjson');
    const w = new WAL(path, false);
    w.append({ ts: 1, sessionId: 's', tool: 'R', inputHash: 'h', payload: {} });
    w.close();
    expect(readFileSync(path, 'utf8')).toContain('"ts":1');
  });

  it('truncate() empties the file', () => {
    const path = join(dir, 'wal.ndjson');
    const w = new WAL(path);
    w.append({ ts: 1, sessionId: 's', tool: 'R', inputHash: 'h', payload: {} });
    w.close();
    expect(readFileSync(path, 'utf8').length).toBeGreaterThan(0);
    WAL.truncate(path);
    expect(readFileSync(path, 'utf8')).toBe('');
  });

  it('truncate() is a no-op for missing files', () => {
    expect(() => WAL.truncate(join(dir, 'absent.ndjson'))).not.toThrow();
  });
});
