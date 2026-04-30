import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from './storage/storage.js';
import { computeSavings, renderSavings } from './metrics.js';
import { approximate } from './tokens.js';

let dir: string;
let db: Database.Database;
let storage: Storage;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'metrics-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = new Storage(db);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('computeSavings', () => {
  it('returns zeros for an empty store', () => {
    const r = computeSavings(storage);
    expect(r.capture.events).toBe(0);
    expect(r.drain.coverage).toBe(0);
    expect(r.spend.cacheHitRate).toBe(0);
    expect(r.dedup.dedupRatio).toBe(0);
    expect(r.context.compressionRatio).toBe(0);
  });

  it('counts captured events with token estimates and per-tool breakdown', () => {
    const big = 'x'.repeat(400);
    storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Read', payload: { content: big }, tokensEst: approximate(big) });
    storage.recordEvent({ ts: 2, sessionId: 's', tool: 'Bash', payload: { cmd: 'ls' }, tokensEst: 5 });
    const r = computeSavings(storage);
    expect(r.capture.events).toBe(2);
    expect(r.capture.tokensCaptured).toBeGreaterThan(50);
    expect(r.capture.perTool['Read']).toBe(1);
    expect(r.capture.perTool['Bash']).toBe(1);
  });

  it('detects redaction marker substring in payload', () => {
    storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Edit', payload: { content: 'token=[REDACTED:aws]' } });
    storage.recordEvent({ ts: 2, sessionId: 's', tool: 'Edit', payload: { content: 'plain' } });
    const r = computeSavings(storage);
    expect(r.capture.redactedEvents).toBe(1);
  });

  it('reports drain coverage from event status', () => {
    const a = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const b = storage.recordEvent({ ts: 2, sessionId: 's', tool: 'R', payload: {} });
    storage.recordEvent({ ts: 3, sessionId: 's', tool: 'R', payload: {} });
    storage.markEventStatus(a, 'summarized');
    storage.markEventStatus(b, 'skipped');
    const r = computeSavings(storage);
    expect(r.drain.summarized).toBe(1);
    expect(r.drain.skipped).toBe(1);
    expect(r.drain.raw).toBe(1);
    expect(r.drain.coverage).toBeCloseTo(1 / 3, 3);
  });

  it('reports spend and cache hit rate', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'first', tokensIn: 10, tokensOut: 5, confidence: 0.9 });
    storage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'second', tokensIn: 10, tokensOut: 5, confidence: 0.9 });
    storage.putCachedSummary('k1', '{"text":"first","confidence":0.9}', 10, 5, 0);
    const r = computeSavings(storage);
    expect(r.spend.summaries).toBe(2);
    expect(r.spend.tokensIn).toBe(20);
    expect(r.spend.tokensOut).toBe(10);
    expect(r.spend.cacheRows).toBe(1);
    expect(r.spend.cacheHits).toBe(1);
    expect(r.spend.cacheHitRate).toBeCloseTo(0.5, 5);
  });

  it('reports dedup ratio when supersedes rows exist', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const a = storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'a', tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    const b = storage.recordSummary({ eventId: eid, ts: 1, model: 'm', promptHash: 'p', text: 'b', tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    storage.recordSupersedes(b, a, 0.99, 0);
    const r = computeSavings(storage);
    expect(r.dedup.superseded).toBe(1);
    expect(r.dedup.dedupRatio).toBe(0.5);
  });

  it('reports compression ratio and net saved tokens', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: { x: 'x' }, tokensEst: 1000 });
    storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'hello', tokensIn: 100, tokensOut: 20, confidence: 0.9 });
    const r = computeSavings(storage);
    expect(r.context.summaryTokensStored).toBeGreaterThanOrEqual(1);
    expect(r.context.compressionRatio).toBeLessThan(1);
    expect(r.context.netSavedTokens).toBeGreaterThan(800);
  });

  it('reports zero compression ratio when no captured tokens', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {}, tokensEst: 0 });
    storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'x', tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    const r = computeSavings(storage);
    expect(r.context.compressionRatio).toBe(0);
  });

  it('counts embeddings', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: {} });
    const sid = storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'x', tokensIn: 1, tokensOut: 1, confidence: 0.9 });
    storage.putEmbedding(sid, Float32Array.from([1, 2, 3]));
    const r = computeSavings(storage);
    expect(r.dedup.embeddings).toBe(1);
  });
});

describe('renderSavings', () => {
  it('produces a sane report on an empty store (zero-events branch)', () => {
    const out = renderSavings(computeSavings(storage));
    expect(out).toContain('events captured:');
    expect(out).toContain('0.0%');
  });

  it('produces a human-readable report', () => {
    const eid = storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Read', payload: {}, tokensEst: 100 });
    storage.recordSummary({ eventId: eid, ts: 0, model: 'm', promptHash: 'p', text: 'short', tokensIn: 10, tokensOut: 5, confidence: 0.9 });
    storage.markEventStatus(eid, 'summarized');
    const out = renderSavings(computeSavings(storage));
    expect(out).toContain('SiftCoder Memory');
    expect(out).toContain('events captured:');
    expect(out).toContain('compression ratio:');
    expect(out).toContain('Read=1');
  });
});
