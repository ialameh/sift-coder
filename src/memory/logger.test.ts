import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Logger, MemorySink, FileSink } from './logger.js';

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'log-')); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe('Logger', () => {
  it('writes structured ndjson records to the sink', () => {
    const sink = new MemorySink();
    const log = new Logger('mem', sink);
    log.info('hello', { id: 7 });
    const rec = JSON.parse(sink.lines[0]!);
    expect(rec.level).toBe('info');
    expect(rec.name).toBe('mem');
    expect(rec.message).toBe('hello');
    expect(rec.attributes).toEqual({ id: 7 });
    expect(typeof rec.timestamp).toBe('string');
  });

  it('omits attributes when none are provided', () => {
    const sink = new MemorySink();
    new Logger('mem', sink).warn('careful');
    const rec = JSON.parse(sink.lines[0]!);
    expect('attributes' in rec).toBe(false);
  });

  it('drops messages below the configured min level', () => {
    const sink = new MemorySink();
    const log = new Logger('mem', sink, 'warn');
    log.debug('skip'); log.info('skip'); log.warn('keep'); log.error('keep');
    expect(sink.lines).toHaveLength(2);
  });

  it('exposes leveled methods that all route through log()', () => {
    const sink = new MemorySink();
    const log = new Logger('mem', sink, 'debug');
    log.debug('a'); log.info('b'); log.warn('c'); log.error('d');
    expect(sink.lines.map(l => JSON.parse(l).level)).toEqual(['debug', 'info', 'warn', 'error']);
  });

  it('child() creates a logger with a dotted name suffix', () => {
    const sink = new MemorySink();
    const log = new Logger('mem', sink).child('queue');
    log.info('hi');
    expect(JSON.parse(sink.lines[0]!).name).toBe('mem.queue');
  });

  it('FileSink appends to disk', () => {
    const path = join(dir, 'log.ndjson');
    const sink = new FileSink(path);
    new Logger('mem', sink).info('written');
    sink.close(); // close fd before afterEach rmdir — open handles block rmdir on Windows
    const content = readFileSync(path, 'utf8');
    expect(content).toContain('"message":"written"');
  });

  it('FileSink rotates when maxBytes is exceeded, preserving prior content as .1', () => {
    const path = join(dir, 'rot.ndjson');
    // Tiny cap forces rotation after first write batch. checkEveryWrites=1 makes rotation
    // observable per write rather than every 64th.
    const sink = new FileSink(path, { maxBytes: 50, checkEveryWrites: 1, keepGenerations: 2 });
    const log = new Logger('mem', sink);
    for (let i = 0; i < 10; i++) log.info('large-line-' + i + '-aaaaaaaaaaaaaaaaaaaaaaaa');
    sink.close();
    expect(existsSync(path)).toBe(true);
    expect(existsSync(path + '.1')).toBe(true);
  });

  it('FileSink keeps at most keepGenerations rotations', () => {
    const path = join(dir, 'rot.ndjson');
    const sink = new FileSink(path, { maxBytes: 30, checkEveryWrites: 1, keepGenerations: 1 });
    const log = new Logger('mem', sink);
    for (let i = 0; i < 30; i++) log.info('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-' + i);
    sink.close();
    // keepGenerations=1 → only `.1` exists; no `.2`/`.3`.
    expect(existsSync(path + '.1')).toBe(true);
    expect(existsSync(path + '.2')).toBe(false);
  });

  it('FileSink with maxBytes=0 disables rotation entirely', () => {
    const path = join(dir, 'norot.ndjson');
    const sink = new FileSink(path, { maxBytes: 0, checkEveryWrites: 1 });
    const log = new Logger('mem', sink);
    for (let i = 0; i < 100; i++) log.info('line-' + i);
    sink.close();
    expect(existsSync(path)).toBe(true);
    expect(existsSync(path + '.1')).toBe(false);
  });
});

import { OtlpHttpSink, CompositeSink, type FetchLike } from './logger.js';

describe('OtlpHttpSink', () => {
  it('flushes a batch when batchSize is reached', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
      return { ok: true, status: 200 };
    };
    const sink = new OtlpHttpSink({ endpoint: 'http://x/v1/logs', batchSize: 2, flushIntervalMs: 10000, fetchImpl });
    new Logger('mem', sink).info('a', { n: 1, ok: true, s: 'x' });
    new Logger('mem', sink).warn('b');
    await new Promise(r => setTimeout(r, 10));
    expect(calls).toHaveLength(1);
    const body = calls[0]!.body as { resourceLogs: [{ scopeLogs: [{ logRecords: unknown[] }] }] };
    expect(body.resourceLogs[0].scopeLogs[0].logRecords).toHaveLength(2);
  });

  it('does not stack timers when writes happen before the first timer fires', async () => {
    const calls: number[] = [];
    const fetchImpl: FetchLike = async () => { calls.push(Date.now()); return { ok: true, status: 200 }; };
    const sink = new OtlpHttpSink({ endpoint: 'http://x', batchSize: 100, flushIntervalMs: 30, fetchImpl });
    const log = new Logger('mem', sink);
    log.info('a');
    log.info('b');
    log.info('c');
    await new Promise(r => setTimeout(r, 60));
    expect(calls.length).toBe(1);
  });

  it('flushes on timer when batchSize is not reached', async () => {
    const calls: Array<{ url: string }> = [];
    const fetchImpl: FetchLike = async url => { calls.push({ url }); return { ok: true, status: 200 }; };
    const sink = new OtlpHttpSink({ endpoint: 'http://x', batchSize: 100, flushIntervalMs: 5, fetchImpl });
    new Logger('mem', sink).info('a');
    await new Promise(r => setTimeout(r, 25));
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  it('drops the oldest records when the buffer exceeds 4x batchSize', () => {
    const fetchImpl: FetchLike = async () => ({ ok: true, status: 200 });
    const sink = new OtlpHttpSink({ endpoint: 'http://x', batchSize: 2, flushIntervalMs: 1_000_000, fetchImpl });
    interface InnerSink { buf: string[] }
    const inner = sink as unknown as InnerSink;
    inner.buf = Array.from({ length: 20 }, (_, i) => `{"timestamp":"2026-01-01T00:00:00.000Z","level":"info","name":"x","message":"m${i}"}`);
    sink.write('{"timestamp":"2026-01-01T00:00:00.000Z","level":"info","name":"x","message":"trigger"}');
    expect((sink as unknown as InnerSink).buf.length).toBeLessThanOrEqual(8);
  });

  it('swallows fetch errors silently', async () => {
    const fetchImpl: FetchLike = async () => { throw new Error('boom'); };
    const sink = new OtlpHttpSink({ endpoint: 'http://x', batchSize: 1, flushIntervalMs: 1000, fetchImpl });
    new Logger('mem', sink).info('a');
    await new Promise(r => setTimeout(r, 10));
  });

  it('skips lines that fail to parse', async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    const fetchImpl: FetchLike = async (url, init) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
      return { ok: true, status: 200 };
    };
    const sink = new OtlpHttpSink({ endpoint: 'http://x', batchSize: 1, flushIntervalMs: 1000, fetchImpl });
    sink.write('not-json\n');
    await sink.flush();
    expect(calls).toHaveLength(0);
  });

  it('close() triggers a final flush', async () => {
    const calls: Array<{ url: string }> = [];
    const fetchImpl: FetchLike = async url => { calls.push({ url }); return { ok: true, status: 200 }; };
    const sink = new OtlpHttpSink({ endpoint: 'http://x', batchSize: 100, flushIntervalMs: 1000000, fetchImpl });
    new Logger('mem', sink).info('a');
    sink.close();
    await new Promise(r => setTimeout(r, 5));
    expect(calls.length).toBe(1);
  });

  it('flush() is a no-op when buffer is empty', async () => {
    const fetchImpl: FetchLike = async () => ({ ok: true, status: 200 });
    const sink = new OtlpHttpSink({ endpoint: 'http://x', fetchImpl });
    await sink.flush();
  });
});

describe('CompositeSink', () => {
  it('writes to every wrapped sink', () => {
    const a = new MemorySink();
    const b = new MemorySink();
    const c = new CompositeSink([a, b]);
    new Logger('mem', c).info('hi');
    expect(a.lines).toHaveLength(1);
    expect(b.lines).toHaveLength(1);
  });

  it('close() forwards to wrapped sinks that implement it', async () => {
    let closed = 0;
    const closing = { write: () => {}, close: () => { closed++; } };
    const noClose = new MemorySink();
    new CompositeSink([closing, noClose]).close();
    expect(closed).toBe(1);
  });
});
