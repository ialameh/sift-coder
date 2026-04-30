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
export interface FetchLike {
    (input: string, init?: {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
    }): Promise<{
        ok: boolean;
        status: number;
    }>;
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
export declare class OtlpHttpSink implements LogSink {
    private buf;
    private timer;
    private readonly cfg;
    constructor(opts: OtlpHttpSinkOptions);
    write(line: string): void;
    flush(): Promise<void>;
    close(): void;
}
export declare class CompositeSink implements LogSink {
    private readonly sinks;
    constructor(sinks: LogSink[]);
    write(line: string): void;
    close(): void;
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