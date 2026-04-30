import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from './storage/storage.js';
import { DeterministicEmbedder } from './embedder.js';
import { AbHarness, renderAb } from './ab.js';

let dir: string;
let db: Database.Database;
let storage: Storage;
const e = new DeterministicEmbedder(128);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'ab-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = new Storage(db);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

async function seedSession(n: number, tokensPerEvent = 50) {
  for (let i = 0; i < n; i++) {
    const eid = storage.recordEvent({
      ts: 1000 + i,
      sessionId: 'demo',
      tool: i % 2 === 0 ? 'Edit' : 'Bash',
      payload: { content: `event payload ${i} `.repeat(10) },
      tokensEst: tokensPerEvent,
    });
    const sid = storage.recordSummary({
      eventId: eid,
      ts: 1000 + i,
      model: 'm',
      promptHash: 'p',
      text: `summary of event ${i} touching auth login session`,
      tokensIn: 1,
      tokensOut: 1,
      confidence: 0.9,
    });
    storage.putEmbedding(sid, await e.embed(`summary of event ${i} touching auth login session`));
  }
}

describe('AbHarness.run', () => {
  it('returns zero totals on an empty store', async () => {
    const r = await new AbHarness(storage, null).run();
    expect(r.totalA).toBe(0);
    expect(r.totalB).toBe(0);
    expect(r.turns).toEqual([]);
    expect(r.savedPct).toBe(0);
  });

  it('replays the most recent N events in chronological order', async () => {
    await seedSession(10);
    const r = await new AbHarness(storage, null).run({ turns: 5 });
    expect(r.turns).toHaveLength(5);
    for (let i = 1; i < r.turns.length; i++) {
      expect(r.turns[i]!.id).toBeGreaterThan(r.turns[i - 1]!.id);
    }
  });

  it('Branch A token count grows linearly while Branch B stays bounded', async () => {
    await seedSession(20, 40);
    const r = await new AbHarness(storage, e).run({ turns: 20, memoryK: 3 });
    const lastA = r.turns[r.turns.length - 1]!.branchATokens;
    const firstA = r.turns[0]!.branchATokens;
    expect(lastA).toBeGreaterThan(firstA * 5);
    const lastB = r.turns[r.turns.length - 1]!.branchBTokens;
    const firstB = r.turns[0]!.branchBTokens;
    expect(Math.abs(lastB - firstB)).toBeLessThan(lastB);
  });

  it('reports positive savings on a long enough session', async () => {
    await seedSession(30, 80);
    const r = await new AbHarness(storage, e).run({ turns: 30, memoryK: 3 });
    expect(r.savedTokens).toBeGreaterThan(0);
    expect(r.savedPct).toBeGreaterThan(0);
  });

  it('honors the turns limit', async () => {
    await seedSession(50, 30);
    const r = await new AbHarness(storage, null).run({ turns: 10 });
    expect(r.turns).toHaveLength(10);
  });

  it('falls back to approximate token counts when tokens_est is zero', async () => {
    storage.recordEvent({
      ts: 1, sessionId: 's', tool: 'R',
      payload: { content: 'x'.repeat(400) },
    });
    const r = await new AbHarness(storage, null).run();
    expect(r.turns[0]!.branchATokens).toBeGreaterThan(0);
  });

  it('returns zero memory tokens when synthQuery cannot extract any informative tokens', async () => {
    storage.recordEvent({ ts: 1, sessionId: 's', tool: 'R', payload: '!@#$%', tokensEst: 5 });
    const r = await new AbHarness(storage, null).run();
    expect(r.turns[0]!.branchBTokens).toBe(5);
  });

  it('cumulative totals are non-decreasing', async () => {
    await seedSession(15, 40);
    const r = await new AbHarness(storage, e).run({ turns: 15 });
    for (let i = 1; i < r.turns.length; i++) {
      expect(r.turns[i]!.cumulativeA).toBeGreaterThanOrEqual(r.turns[i - 1]!.cumulativeA);
      expect(r.turns[i]!.cumulativeB).toBeGreaterThanOrEqual(r.turns[i - 1]!.cumulativeB);
    }
  });

  it('uses default options when none are provided', async () => {
    await seedSession(3);
    const r = await new AbHarness(storage, null).run();
    expect(r.k).toBe(5);
  });
});

describe('renderAb', () => {
  it('produces a human-readable A/B report', async () => {
    await seedSession(5, 50);
    const r = await new AbHarness(storage, e).run({ turns: 5 });
    const out = renderAb(r);
    expect(out).toContain('A/B savings');
    expect(out).toContain('Branch A');
    expect(out).toContain('Branch B');
    expect(out).toContain('Saved:');
  });
});
