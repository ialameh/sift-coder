import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { Storage } from './storage/storage.js';
import { ProvenanceStore } from './provenance.js';
import { inferEdgesForEvent } from './auto-edges.js';

let dir: string;
let db: Database.Database;
let storage: Storage;
let prov: ProvenanceStore;

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), 'auto-'));
  db = new Database(join(dir, 'd.sqlite'));
  storage = await Storage.init(db);
  prov = new ProvenanceStore(storage);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('inferEdgesForEvent', () => {
  it('Edit tool with file_path produces an edits edge to the file', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Edit', payload: { file_path: '/repo/auth.ts' } });
    const written = await inferEdgesForEvent(storage, prov, eid, 's', 'Edit', { file_path: '/repo/auth.ts' }, 1);
    expect(written).toBe(1); // single edits edge; no prior event in session.
    const out = await prov.outgoing({ kind: 'event', id: String(eid) }, 'edits');
    expect(out).toHaveLength(1);
    expect(out[0]!.to).toEqual({ kind: 'file', id: '/repo/auth.ts' });
    expect(out[0]!.source).toBe('auto');
  });

  it('Write tool falls back to `path` when `file_path` is absent', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Write', payload: { path: '/x.ts', content: 'k' } });
    await inferEdgesForEvent(storage, prov, eid, 's', 'Write', { path: '/x.ts', content: 'k' }, 1);
    expect((await prov.outgoing({ kind: 'event', id: String(eid) }, 'edits'))).toHaveLength(1);
  });

  it('Bash extracts path-like tokens and adds references edges', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: { command: 'cat /etc/hosts && grep foo ./src/auth.ts' } });
    await inferEdgesForEvent(storage, prov, eid, 's', 'Bash', { command: 'cat /etc/hosts && grep foo ./src/auth.ts' }, 1);
    const refs = await prov.outgoing({ kind: 'event', id: String(eid) }, 'references');
    const ids = refs.map(e => e.to.id).sort();
    expect(ids).toContain('/etc/hosts');
    expect(ids).toContain('./src/auth.ts');
  });

  it('Bash deduplicates a path that matches both regexes', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: { command: 'cat ./auth.ts' } });
    await inferEdgesForEvent(storage, prov, eid, 's', 'Bash', { command: 'cat ./auth.ts' }, 1);
    const refs = await prov.outgoing({ kind: 'event', id: String(eid) }, 'references');
    expect(refs).toHaveLength(1);
  });

  it('chains consecutive events in the same session via derives_from', async () => {
    const e1 = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Edit', payload: { file_path: '/a' } });
    await inferEdgesForEvent(storage, prov, e1, 's', 'Edit', { file_path: '/a' }, 1);
    const e2 = await storage.recordEvent({ ts: 2, sessionId: 's', tool: 'Edit', payload: { file_path: '/b' } });
    const written = await inferEdgesForEvent(storage, prov, e2, 's', 'Edit', { file_path: '/b' }, 2);
    expect(written).toBe(2); // edits + derives_from
    const chain = await prov.outgoing({ kind: 'event', id: String(e2) }, 'derives_from');
    expect(chain).toHaveLength(1);
    expect(chain[0]!.to).toEqual({ kind: 'event', id: String(e1) });
  });

  it('does not chain to a prior event in a different session', async () => {
    await storage.recordEvent({ ts: 1, sessionId: 'other', tool: 'Edit', payload: { file_path: '/a' } });
    const eid = await storage.recordEvent({ ts: 2, sessionId: 'mine', tool: 'Edit', payload: { file_path: '/b' } });
    const written = await inferEdgesForEvent(storage, prov, eid, 'mine', 'Edit', { file_path: '/b' }, 2);
    expect(written).toBe(1); // only the edits edge; no chain partner in this session.
  });

  it('skipChain suppresses the derives_from edge', async () => {
    const e1 = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: { command: 'ls' } });
    await inferEdgesForEvent(storage, prov, e1, 's', 'Bash', { command: 'ls' }, 1, { skipChain: true });
    const e2 = await storage.recordEvent({ ts: 2, sessionId: 's', tool: 'Bash', payload: { command: 'ls' } });
    const written = await inferEdgesForEvent(storage, prov, e2, 's', 'Bash', { command: 'ls' }, 2, { skipChain: true });
    expect(written).toBe(0);
  });

  it('non-file, non-bash tools without sequential context produce zero edges', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Glob', payload: { pattern: '**/*' } });
    const written = await inferEdgesForEvent(storage, prov, eid, 's', 'Glob', { pattern: '**/*' }, 1);
    expect(written).toBe(0);
  });

  it('marks every inferred edge with source=auto', async () => {
    const eid = await storage.recordEvent({ ts: 1, sessionId: 's', tool: 'Bash', payload: { command: 'cat /a.ts' } });
    await inferEdgesForEvent(storage, prov, eid, 's', 'Bash', { command: 'cat /a.ts' }, 1);
    const refs = await prov.outgoing({ kind: 'event', id: String(eid) });
    expect(refs.every(e => e.source === 'auto')).toBe(true);
  });
});
