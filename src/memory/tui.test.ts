import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from './storage/storage.js';
import { renderWatchSnapshot } from './tui.js';

let dir: string;
let db: Database.Database;
let storage: Storage;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'tui-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = await Storage.init(db);
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

function strip(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

describe('renderWatchSnapshot', () => {
  it('renders an empty snapshot with placeholder lines', async () => {
    const out = await renderWatchSnapshot(storage);
    const plain = strip(out);
    expect(plain).toContain('SiftCoder Memory');
    expect(plain).toContain('no events yet');
    expect(plain).toContain('no summaries yet');
  });

  it('renders counts and event tail', async () => {
    await storage.recordEvent({ ts: 1000, sessionId: 's', tool: 'Read', payload: { i: 1 } });
    await storage.recordEvent({ ts: 2000, sessionId: 's', tool: 'Edit', payload: { i: 2 } });
    await storage.markEventStatus(1, 'summarized');
    const out = await renderWatchSnapshot(storage, { limit: 5 });
    const plain = strip(out);
    expect(plain).toContain('events 2');
    expect(plain).toContain('summarized 1');
    expect(plain).toContain('Read');
    expect(plain).toContain('Edit');
  });

  it('renders summary tail and counts skipped events', async () => {
    const eid = await storage.recordEvent({ ts: 1000, sessionId: 's', tool: 'R', payload: {} });
    await storage.markEventStatus(eid, 'skipped');
    await storage.recordSummary({
      eventId: eid, ts: 2000, model: 'haiku', promptHash: 'p',
      text: 'this is a relevant fact', tokensIn: 1, tokensOut: 1, confidence: 0.85,
    });
    const out = await renderWatchSnapshot(storage);
    const plain = strip(out);
    expect(plain).toContain('skipped 1');
    expect(plain).toContain('this is a relevant fact');
    expect(plain).toContain('0.85');
  });

  it('truncates long summary text within the configured width', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    await storage.recordSummary({
      eventId: eid, ts: 0, model: 'm', promptHash: 'p',
      text: 'x'.repeat(500), tokensIn: null, tokensOut: null, confidence: 0,
    });
    const out = await renderWatchSnapshot(storage, { width: 60 });
    const lines = out.split('\n');
    for (const l of lines) {
      const visible = strip(l);
      expect(visible.length).toBeLessThanOrEqual(80);
    }
  });

  it('renders a non-zero superseded count when supersedes rows exist', async () => {
    const eid1 = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { i: 1 } });
    const eid2 = await storage.recordEvent({ ts: 2, sessionId: 's', tool: 'R', payload: { i: 2 } });
    const a = await storage.recordSummary({ eventId: eid1, ts: 0, model: 'm', promptHash: 'p', text: 'a', tokensIn: null, tokensOut: null, confidence: null });
    const b = await storage.recordSummary({ eventId: eid2, ts: 1, model: 'm', promptHash: 'p', text: 'b', tokensIn: null, tokensOut: null, confidence: null });
    await storage.recordSupersedes(b, a, 0.99, 100);
    const out = await renderWatchSnapshot(storage);
    expect(strip(out)).toContain('superseded 1');
  });
});
