/**
 * Symbol extractor for code payloads. Default implementation is regex-based — fast, no deps,
 * adequate for TS/JS/Python/Go/Rust top-level declarations. The interface allows swapping in a
 * real tree-sitter (WASM) implementation when correctness matters more than startup time.
 *
 * The extractor is idempotent and bounded: at most `maxSymbols` per call to keep payloads small.
 */
export interface ExtractOptions {
    maxSymbols?: number;
    language?: string;
}
export interface SymbolHit {
    kind: 'function' | 'class' | 'method' | 'interface' | 'type' | 'const';
    name: string;
}
export interface SymbolExtractor {
    extract(code: string, opts?: ExtractOptions): SymbolHit[];
}
export interface AsyncSymbolExtractor {
    extract(code: string, opts?: ExtractOptions & {
        path?: string;
    }): Promise<SymbolHit[]>;
}
export declare class RegexSymbolExtractor implements SymbolExtractor {
    extract(code: string, opts?: ExtractOptions): SymbolHit[];
}
export declare const CODE_EXTENSIONS: Set<string>;
export declare function looksLikeCodePath(path: string | undefined | null): boolean;
export declare function symbolList(hits: SymbolHit[]): string;
//# sourceMappingURL=symbols.d.ts.map