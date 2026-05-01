/**
 * Structured ndjson logger. Writes to file (append) and optionally stderr.
 */

import fs from 'node:fs';
import path from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogRecord {
  ts: string;
  level: LogLevel;
  scope: string;
  msg: string;
  [k: string]: unknown;
}

export class Logger {
  private stream?: fs.WriteStream;

  constructor(
    private readonly scope: string,
    private readonly opts: { file?: string; toStderr?: boolean; minLevel?: LogLevel } = {},
  ) {
    if (opts.file) {
      fs.mkdirSync(path.dirname(opts.file), { recursive: true });
      this.stream = fs.createWriteStream(opts.file, { flags: 'a' });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const min = this.opts.minLevel || 'info';
    return order.indexOf(level) >= order.indexOf(min);
  }

  private write(level: LogLevel, msg: string, extra?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;
    const rec: LogRecord = {
      ts: new Date().toISOString(),
      level,
      scope: this.scope,
      msg,
      ...(extra || {}),
    };
    const line = JSON.stringify(rec) + '\n';
    if (this.stream) this.stream.write(line);
    if (this.opts.toStderr) process.stderr.write(line);
  }

  debug(msg: string, extra?: Record<string, unknown>): void { this.write('debug', msg, extra); }
  info(msg: string, extra?: Record<string, unknown>): void { this.write('info', msg, extra); }
  warn(msg: string, extra?: Record<string, unknown>): void { this.write('warn', msg, extra); }
  error(msg: string, extra?: Record<string, unknown>): void { this.write('error', msg, extra); }

  child(scope: string): Logger {
    return new Logger(`${this.scope}:${scope}`, this.opts);
  }
}
