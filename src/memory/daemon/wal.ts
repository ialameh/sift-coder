/**
 * Append-only write-ahead log. ndjson, fsynced on every write.
 * Crash recovery: replay missing rows into SQLite on daemon boot.
 */
import { openSync, writeSync, fsyncSync, closeSync, existsSync, readFileSync } from 'node:fs';

export interface WalEntry {
  ts: number;
  sessionId: string;
  tool: string;
  inputHash: string;
  payload: unknown;
}

export class WAL {
  private fd: number | null = null;

  constructor(private readonly path: string, private readonly fsync: boolean = true) {}

  open(): void {
    if (this.fd !== null) return;
    this.fd = openSync(this.path, 'a');
  }

  append(entry: WalEntry): void {
    if (this.fd === null) this.open();
    const line = JSON.stringify(entry) + '\n';
    writeSync(this.fd!, line);
    if (this.fsync) fsyncSync(this.fd!);
  }

  close(): void {
    if (this.fd === null) return;
    closeSync(this.fd);
    this.fd = null;
  }

  static replay(path: string): WalEntry[] {
    if (!existsSync(path)) return [];
    const raw = readFileSync(path, 'utf8');
    const out: WalEntry[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as WalEntry);
      } catch {
        // skip torn-write tail
      }
    }
    return out;
  }
}
