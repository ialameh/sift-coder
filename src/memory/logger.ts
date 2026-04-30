/**
 * Structured ndjson logger.
 * One JSON object per line. Field names align with OpenTelemetry conventions where it makes sense:
 *   - timestamp (ISO-8601), level, name, message, attributes.
 *
 * Writes to a path (filesystem-backed) or to a provided WritableStream-like target (stdout for daemons).
 */
import { openSync, writeSync, fsyncSync } from 'node:fs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  name: string;
  message: string;
  attributes?: Record<string, unknown>;
}

export interface LogSink {
  write(line: string): void;
  close?(): void;
}

export class FileSink implements LogSink {
  private fd: number;
  private readonly fsync: boolean;

  constructor(path: string, fsync = false) {
    this.fd = openSync(path, 'a');
    this.fsync = fsync;
  }

  write(line: string): void {
    writeSync(this.fd, line);
    /* c8 ignore next -- fsync is opt-in; covered separately if enabled */
    if (this.fsync) fsyncSync(this.fd);
  }
}

export class MemorySink implements LogSink {
  readonly lines: string[] = [];
  write(line: string): void {
    this.lines.push(line);
  }
}

export interface FetchLike {
  (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ ok: boolean; status: number }>;
}

export interface OtlpHttpSinkOptions {
  endpoint: string;
  resourceName?: string;
  flushIntervalMs?: number;
  batchSize?: number;
  headers?: Record<string, string>;
  fetchImpl?: FetchLike;
}

/**
 * OTLP/HTTP log exporter. Buffers ndjson records, batches them as the OTLP "logs" body shape, and
 * POSTs to a collector. Activated by setting SIFTCODER_OTEL_ENDPOINT in the environment.
 *
 * Failures are swallowed (best-effort observability). Buffer is bounded by batchSize * 4.
 */
export class OtlpHttpSink implements LogSink {
  private buf: string[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly cfg: Required<Omit<OtlpHttpSinkOptions, 'fetchImpl' | 'headers'>> & {
    headers: Record<string, string>;
    fetchImpl: FetchLike;
  };

  constructor(opts: OtlpHttpSinkOptions) {
    this.cfg = {
      endpoint: opts.endpoint,
      resourceName: opts.resourceName ?? 'siftcoder-memory',
      flushIntervalMs: opts.flushIntervalMs ?? 5000,
      batchSize: opts.batchSize ?? 64,
      headers: opts.headers ?? {},
      /* c8 ignore next -- default real fetch only used when no fetchImpl injected */
      fetchImpl: opts.fetchImpl ?? ((input, init) => fetch(input, init)),
    };
  }

  write(line: string): void {
    this.buf.push(line.replace(/\n$/, ''));
    const cap = this.cfg.batchSize * 4;
    if (this.buf.length > cap) this.buf.splice(0, this.buf.length - cap);
    if (this.buf.length >= this.cfg.batchSize) {
      void this.flush();
    } else if (this.timer === null) {
      this.timer = setTimeout(() => { void this.flush(); }, this.cfg.flushIntervalMs);
    }
  }

  async flush(): Promise<void> {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    if (this.buf.length === 0) return;
    const records = this.buf.map(l => safeParse(l)).filter((r): r is LogRecord => r !== null);
    this.buf = [];
    if (records.length === 0) return;
    const body = {
      resourceLogs: [{
        resource: { attributes: [{ key: 'service.name', value: { stringValue: this.cfg.resourceName } }] },
        scopeLogs: [{
          scope: { name: 'siftcoder-memory' },
          logRecords: records.map(r => ({
            timeUnixNano: String(Date.parse(r.timestamp) * 1_000_000),
            severityText: r.level.toUpperCase(),
            body: { stringValue: r.message },
            attributes: Object.entries(r.attributes ?? {}).map(([k, v]) => ({
              key: k,
              value: stringValueOf(v),
            })),
          })),
        }],
      }],
    };
    try {
      await this.cfg.fetchImpl(this.cfg.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...this.cfg.headers },
        body: JSON.stringify(body),
      });
    } catch {
      /* best-effort; swallow */
    }
  }

  close(): void {
    void this.flush();
  }
}

function safeParse(line: string): LogRecord | null {
  try { return JSON.parse(line) as LogRecord; } catch { return null; }
}

function stringValueOf(v: unknown): { stringValue: string } | { intValue: number } | { boolValue: boolean } {
  if (typeof v === 'number' && Number.isInteger(v)) return { intValue: v };
  if (typeof v === 'boolean') return { boolValue: v };
  return { stringValue: String(v) };
}

export class CompositeSink implements LogSink {
  constructor(private readonly sinks: LogSink[]) {}
  write(line: string): void { for (const s of this.sinks) s.write(line); }
  close(): void { for (const s of this.sinks) s.close?.(); }
}

export class Logger {
  constructor(
    private readonly name: string,
    private readonly sink: LogSink,
    private readonly minLevel: LogLevel = 'info'
  ) {}

  private static order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

  log(level: LogLevel, message: string, attributes?: Record<string, unknown>): void {
    if (Logger.order[level] < Logger.order[this.minLevel]) return;
    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      name: this.name,
      message,
      ...(attributes ? { attributes } : {}),
    };
    this.sink.write(JSON.stringify(record) + '\n');
  }

  debug(msg: string, attrs?: Record<string, unknown>): void { this.log('debug', msg, attrs); }
  info(msg: string, attrs?: Record<string, unknown>): void { this.log('info', msg, attrs); }
  warn(msg: string, attrs?: Record<string, unknown>): void { this.log('warn', msg, attrs); }
  error(msg: string, attrs?: Record<string, unknown>): void { this.log('error', msg, attrs); }

  child(name: string): Logger {
    return new Logger(`${this.name}.${name}`, this.sink, this.minLevel);
  }
}
