/**
 * Structured ndjson logger.
 * One JSON object per line. Field names align with OpenTelemetry conventions where it makes sense:
 *   - timestamp (ISO-8601), level, name, message, attributes.
 *
 * Writes to a path (filesystem-backed) or to a provided WritableStream-like target (stdout for daemons).
 */
import { openSync, writeSync, fsyncSync } from 'node:fs';
export class FileSink {
    fd;
    fsync;
    constructor(path, fsync = false) {
        this.fd = openSync(path, 'a');
        this.fsync = fsync;
    }
    write(line) {
        writeSync(this.fd, line);
        /* c8 ignore next -- fsync is opt-in; covered separately if enabled */
        if (this.fsync)
            fsyncSync(this.fd);
    }
}
export class MemorySink {
    lines = [];
    write(line) {
        this.lines.push(line);
    }
}
export class Logger {
    name;
    sink;
    minLevel;
    constructor(name, sink, minLevel = 'info') {
        this.name = name;
        this.sink = sink;
        this.minLevel = minLevel;
    }
    static order = { debug: 0, info: 1, warn: 2, error: 3 };
    log(level, message, attributes) {
        if (Logger.order[level] < Logger.order[this.minLevel])
            return;
        const record = {
            timestamp: new Date().toISOString(),
            level,
            name: this.name,
            message,
            ...(attributes ? { attributes } : {}),
        };
        this.sink.write(JSON.stringify(record) + '\n');
    }
    debug(msg, attrs) { this.log('debug', msg, attrs); }
    info(msg, attrs) { this.log('info', msg, attrs); }
    warn(msg, attrs) { this.log('warn', msg, attrs); }
    error(msg, attrs) { this.log('error', msg, attrs); }
    child(name) {
        return new Logger(`${this.name}.${name}`, this.sink, this.minLevel);
    }
}
//# sourceMappingURL=logger.js.map