/**
 * Append-only write-ahead log. ndjson, fsynced on every write.
 * Crash recovery: replay missing rows into SQLite on daemon boot.
 */
import { openSync, writeSync, fsyncSync, closeSync, existsSync, readFileSync } from 'node:fs';
export class WAL {
    path;
    fsync;
    fd = null;
    constructor(path, fsync = true) {
        this.path = path;
        this.fsync = fsync;
    }
    open() {
        if (this.fd !== null)
            return;
        this.fd = openSync(this.path, 'a');
    }
    append(entry) {
        if (this.fd === null)
            this.open();
        const line = JSON.stringify(entry) + '\n';
        writeSync(this.fd, line);
        if (this.fsync)
            fsyncSync(this.fd);
    }
    close() {
        if (this.fd === null)
            return;
        closeSync(this.fd);
        this.fd = null;
    }
    static replay(path) {
        if (!existsSync(path))
            return [];
        const raw = readFileSync(path, 'utf8');
        const out = [];
        for (const line of raw.split('\n')) {
            if (!line.trim())
                continue;
            try {
                out.push(JSON.parse(line));
            }
            catch {
                // skip torn-write tail
            }
        }
        return out;
    }
}
//# sourceMappingURL=wal.js.map