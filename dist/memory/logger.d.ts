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
export declare class FileSink implements LogSink {
    private fd;
    private readonly fsync;
    constructor(path: string, fsync?: boolean);
    write(line: string): void;
}
export declare class MemorySink implements LogSink {
    readonly lines: string[];
    write(line: string): void;
}
export declare class Logger {
    private readonly name;
    private readonly sink;
    private readonly minLevel;
    constructor(name: string, sink: LogSink, minLevel?: LogLevel);
    private static order;
    log(level: LogLevel, message: string, attributes?: Record<string, unknown>): void;
    debug(msg: string, attrs?: Record<string, unknown>): void;
    info(msg: string, attrs?: Record<string, unknown>): void;
    warn(msg: string, attrs?: Record<string, unknown>): void;
    error(msg: string, attrs?: Record<string, unknown>): void;
    child(name: string): Logger;
}
//# sourceMappingURL=logger.d.ts.map