/**
 * Pure-JS / WebAssembly SQLite backend for SiftCoder Memory.
 *
 * Wraps `node-sqlite3-wasm` and adapts its slightly-different binding semantics so the same
 * async `DBHandle` interface used by the better-sqlite3 path works unchanged. The WASM backend has
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
  run(args?: unknown[]): { lastInsertRowid: number | bigint };
  get(args?: unknown[]): unknown;
  all(args?: unknown[]): unknown[];
  /** node-sqlite3-wasm exposes finalize() to release the underlying SQLite statement handle. */
  finalize?: () => void;
}

/**
 * Loads node-sqlite3-wasm and returns a DBHandle-compatible wrapper. Throws if the package
 * is not installed.
 */
export async function openWasmDatabase(path: string): Promise<DBHandle & { close(): void }> {
  let raw: {
    Database?: new (path: string) => WasmDatabase;
    default?: { Database?: new (path: string) => WasmDatabase };
  };
  try {
    raw = await import('node-sqlite3-wasm' as string) as typeof raw;
  } catch (e) {
    /* c8 ignore next 5 -- Cache plugin install missing optional dep; bubble up actionable msg */
    throw new Error(
      'WASM SQLite fallback unavailable: node-sqlite3-wasm not installed. ' +
      'Run /siftcoder:mem-check (or `npm install` in the plugin dir) to repair, ' +
      `then retry. Underlying: ${(e as Error).message}`,
    );
  }
  /* c8 ignore next -- ESM-CJS interop fallback: node-sqlite3-wasm currently exposes Database as named, but bundlers may move it under default */
  const Ctor = raw.Database ?? raw.default?.Database;
  /* c8 ignore next 3 -- defensive guard for module-shape drift in node-sqlite3-wasm */
  if (typeof Ctor !== 'function') {
    throw new Error('node-sqlite3-wasm: Database constructor not found in module exports');
  }
  const inner = new Ctor(path);
  return wrap(inner);
}

export function wrap(inner: WasmDatabase): DBHandle & { close(): void } {
  return {
    async exec(sql: string): Promise<unknown> {
      return inner.exec(sql);
    },
    async prepare(sql: string) {
      // node-sqlite3-wasm leaks SQLite statement handles unless finalize() is called. Each
      // run/get/all invocation here is one-shot, so finalize after every call. This trades
      // re-prepare cost for memory safety on the long-lived daemon.
      return {
        async run(...params: unknown[]) {
          const stmt = inner.prepare(sql);
          try {
            const r = stmt.run(params.length > 0 ? params : undefined);
            return { lastInsertRowid: r.lastInsertRowid };
          } finally {
            stmt.finalize?.();
          }
        },
        async get(...params: unknown[]) {
          const stmt = inner.prepare(sql);
          try {
            return stmt.get(params.length > 0 ? params : undefined);
          } finally {
            stmt.finalize?.();
          }
        },
        async all(...params: unknown[]) {
          const stmt = inner.prepare(sql);
          try {
            return stmt.all(params.length > 0 ? params : undefined) as unknown[];
          } finally {
            stmt.finalize?.();
          }
        },
      };
    },
    close(): Promise<void> {
      inner.close();
      return Promise.resolve();
    },
  };
}