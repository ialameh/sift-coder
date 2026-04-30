/**
 * CDG (ContextDigger) HTTP adapter for SiftCoder Memory.
 *
 * Implements AsyncSymbolExtractor by calling CDG's REST endpoint, which runs real tree-sitter
 * (Python/JS/TS/Apex grammars) plus its own SymbolReference + DependencyEdge index. Falls back to
 * a configured local extractor (regex) on any failure — never blocks the capture path.
 *
 * Activation:
 *   SIFTCODER_CDG_URL=http://127.0.0.1:8080  (or remote)
 *   SIFTCODER_CDG_TOKEN=<api-key>            (optional; included as Bearer when set)
 *
 * Wire shape (POST {url}/v1/symbols):
 *   request:  { path?: string; content: string; language?: string }
 *   response: { symbols: Array<{ kind: string; name: string; line?: number; signature?: string }> }
 *
 * The response mapper is configurable so different CDG versions / future endpoints can be plugged
 * in without rewriting the adapter.
 */
import type { AsyncSymbolExtractor, ExtractOptions, SymbolHit } from './symbols.js';
export interface FetchLike {
    (input: string, init?: {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
        signal?: AbortSignal;
    }): Promise<{
        ok: boolean;
        status: number;
        json(): Promise<unknown>;
        text(): Promise<string>;
    }>;
}
export interface CdgAdapterOptions {
    baseUrl: string;
    token?: string;
    endpoint?: string;
    timeoutMs?: number;
    fetchImpl?: FetchLike;
    fallback?: AsyncSymbolExtractor | null;
    mapResponse?: (body: unknown) => SymbolHit[];
}
export declare class CdgSymbolExtractor implements AsyncSymbolExtractor {
    private readonly cfg;
    constructor(opts: CdgAdapterOptions);
    static fromEnv(env?: NodeJS.ProcessEnv, fallback?: AsyncSymbolExtractor | null): CdgSymbolExtractor | null;
    extract(code: string, opts?: ExtractOptions & {
        path?: string;
    }): Promise<SymbolHit[]>;
    private fallbackExtract;
}
/**
 * Wraps a sync SymbolExtractor as an AsyncSymbolExtractor — useful as a fallback for
 * CdgSymbolExtractor without async overhead in the happy path.
 */
export declare class AsyncFromSync implements AsyncSymbolExtractor {
    private readonly sync;
    constructor(sync: {
        extract(code: string, opts?: ExtractOptions): SymbolHit[];
    });
    extract(code: string, opts?: ExtractOptions): Promise<SymbolHit[]>;
}
//# sourceMappingURL=cdg-adapter.d.ts.map