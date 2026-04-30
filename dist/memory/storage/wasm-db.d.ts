/**
 * Pure-JS / WebAssembly SQLite backend for SiftCoder Memory.
 *
 * Wraps `node-sqlite3-wasm` and adapts its slightly-different binding semantics so the same
 * `DBHandle` interface used by the better-sqlite3 path works unchanged. The WASM backend has
 * no native compile step — it ships as a single .wasm asset inside the npm package — so the
 * plugin works on any Node 18+ install regardless of platform, network access, or whether
 * better-sqlite3's prebuild-install was able to run.
 *
 * Trade-offs vs better-sqlite3:
 *   - ~30% slower writes (tolerable at memory-store scale).
 *   - No `loadExtension` (sqlite-vec must be compiled into the wasm build to be available;
 *     `node-sqlite3-wasm` does not bundle it). Hybrid retrieval falls back to the JS-side
 *     cosine path that Storage already supports when `vecEnabled` is false.
 *   - Async `import()` boundary at construction (acceptable; daemon boot path is already async).
 */
import type { DBHandle } from './storage.js';
interface WasmDatabase {
    exec(sql: string): unknown;
    prepare(sql: string): WasmStatement;
    close(): void;
}
interface WasmStatement {
    run(args?: unknown[]): {
        lastInsertRowid: number | bigint;
    };
    get(args?: unknown[]): unknown;
    all(args?: unknown[]): unknown[];
}
/**
 * Loads node-sqlite3-wasm and returns a DBHandle-compatible wrapper. Throws if the package
 * is not installed.
 */
export declare function openWasmDatabase(path: string): Promise<DBHandle & {
    close(): void;
}>;
export declare function wrap(inner: WasmDatabase): DBHandle & {
    close(): void;
};
export {};
//# sourceMappingURL=wasm-db.d.ts.map