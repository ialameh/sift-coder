/**
 * Storage backend resolver for SiftCoder Memory.
 *
 * Supports:
 *   - sqlite-native: better-sqlite3 (fast, native-compiled) — DEFAULT
 *   - sqlite-wasm:   node-sqlite3-wasm (slower, pure-JS fallback)
 *   - postgres:       PostgreSQL via pg (opt-in only, for future hosted/team use)
 *
 * Selection via SIFTCODER_DB_BACKEND:
 *   - unset / auto:  sqlite-native → sqlite-wasm (no PostgreSQL attempted)
 *   - sqlite:       sqlite-native → sqlite-wasm (explicit SQLite)
 *   - postgres:      PostgreSQL only (requires pg package + DATABASE_URL)
 *
 * NOTE: SQLite is the required local runtime database.
 *       PostgreSQL is reserved for future cloud/team server use only.
 */
import { createRequire } from 'node:module';
import type { DBHandle } from './storage.js';

// Re-export for convenience
export { type DBHandle } from './storage.js';

export type StorageBackendName = 'sqlite-native' | 'sqlite-wasm' | 'postgres';

export interface OpenStorageResult {
  db: DBHandle;
  backend: StorageBackendName;
  dbPath: string;
  /** PG-specific DDL overrides — passed through to Storage.init so the schema matches the backend. */
  coreDdl?: string;
  vecDdl?: string;
  migrations?: ReadonlyArray<string>;
}

export interface BackendResolverOptions {
  /** Override backend selection. Defaults to process.env.SIFTCODER_DB_BACKEND || 'auto' */
  backend?: 'sqlite' | 'postgres' | 'auto';
  /** Path for the database file (sqlite) or database name (postgres) */
  dbPath: string;
}

/** Determines backend from environment variable. */
function envBackend(): 'sqlite' | 'postgres' | 'auto' {
  const val = process.env['SIFTCODER_DB_BACKEND']?.toLowerCase() ?? 'auto';
  if (val === 'postgres') return 'postgres';
  if (val === 'sqlite') return 'sqlite';
  return 'auto';
}

// ─── Sync SQLite (better-sqlite3) wrapped to async DBHandle ───────────────────

interface SyncDB {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): { lastInsertRowid: number | bigint };
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
  loadExtension(path: string): void;
  close(): void;
}

/**
 * Wraps a synchronous better-sqlite3 database in an async DBHandle interface.
 * The underlying SQLite calls block the thread but the wrapper exposes Promises.
 */
function wrapSyncDb(sync: SyncDB): DBHandle {
  // Prepared-statement cache: better-sqlite3 parses + plans every `prepare()` call. The capture
  // hot path runs the same handful of INSERTs millions of times — caching by SQL string skips
  // the re-parse and gives a measurable latency win on busy daemons. Cache is cleared on close.
  type PreparedSync = ReturnType<SyncDB['prepare']>;
  const stmtCache = new Map<string, PreparedSync>();
  const prep = (sql: string): PreparedSync => {
    let s = stmtCache.get(sql);
    if (!s) {
      s = sync.prepare(sql);
      stmtCache.set(sql, s);
    }
    return s;
  };
  return {
    exec(sql: string): Promise<unknown> {
      return Promise.resolve(sync.exec(sql));
    },
    async prepare(sql: string) {
      const stmt = prep(sql);
      return {
        run(...params: unknown[]) {
          return Promise.resolve(stmt.run(...params));
        },
        get(...params: unknown[]) {
          return Promise.resolve(stmt.get(...params));
        },
        all(...params: unknown[]) {
          return Promise.resolve(stmt.all(...params));
        },
      };
    },
    loadExtension(path: string): void {
      sync.loadExtension(path);
    },
    close(): Promise<void> {
      stmtCache.clear();
      return Promise.resolve(sync.close());
    },
  };
}

// ─── Async SQLite (node-sqlite3-wasm) ────────────────────────────────────────

/**
 * Opens node-sqlite3-wasm and wraps it as an async DBHandle.
 */
async function openWasmDb(dbPath: string): Promise<DBHandle> {
  const { openWasmDatabase } = await import('./wasm-db.js');
  return openWasmDatabase(dbPath);
}

// ─── PostgreSQL (opt-in only) ─────────────────────────────────────────────────

/**
 * Opens PostgreSQL as an async DBHandle via the PostgresDB adapter. Returns the handle plus
 * PG-specific DDL strings the resolver passes through to Storage.init so the schema matches.
 *
 * Only available when SIFTCODER_DB_BACKEND=postgres is set.
 */
async function openPostgresDb(dbPath: string): Promise<{ db: DBHandle; coreDdl: string; vecDdl: string; migrations: ReadonlyArray<string> }> {
  const { PostgresDB, pgOptionsFromEnv, PG_CORE_DDL, PG_VEC_DDL, PG_MIGRATIONS } = await import('./pg-db.js');
  const opts = pgOptionsFromEnv(dbPath);
  const db = await PostgresDB.connect(opts);
  return { db, coreDdl: PG_CORE_DDL, vecDdl: PG_VEC_DDL, migrations: PG_MIGRATIONS };
}

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Opens the appropriate storage backend based on options and environment.
 *
 * Default (auto/unset): sqlite-native → sqlite-wasm
 * SIFTCODER_DB_BACKEND=sqlite: sqlite-native → sqlite-wasm
 * SIFTCODER_DB_BACKEND=postgres: PostgreSQL (future hosted/team only)
 */
export async function openStorage(opts: BackendResolverOptions): Promise<OpenStorageResult> {
  const require = createRequire(import.meta.url);
  const backend = opts.backend ?? envBackend();
  const { dbPath } = opts;

  // SQLite: native → wasm fallback
  if (backend === 'sqlite' || backend === 'auto') {
    // Try native (better-sqlite3) first
    try {
      const Database = require('better-sqlite3') as new (path: string) => SyncDB;
      const syncDb = new Database(dbPath);
      return { db: wrapSyncDb(syncDb), backend: 'sqlite-native', dbPath };
    } catch (nativeErr) {
      // Fall back to WASM
      try {
        const db = await openWasmDb(dbPath);
        return { db, backend: 'sqlite-wasm', dbPath };
      } catch (wasmErr) {
        throw new Error(
          `SQLite: neither better-sqlite3 nor node-sqlite3-wasm could be loaded.\n` +
          `  native: ${(nativeErr as Error).message}\n` +
          `  wasm:   ${(wasmErr as Error).message}\n` +
          `  Hint: ensure better-sqlite3 is installed (\`npm rebuild better-sqlite3\`).`
        );
      }
    }
  }

  // PostgreSQL: opt-in only (future hosted/team use)
  if (backend === 'postgres') {
    try {
      const { db, coreDdl, vecDdl, migrations } = await openPostgresDb(dbPath);
      return { db, backend: 'postgres', dbPath, coreDdl, vecDdl, migrations };
    } catch (pgErr) {
      throw new Error(
        `PostgreSQL requested via SIFTCODER_DB_BACKEND=postgres but connection failed.\n` +
        `  Error: ${(pgErr as Error).message}\n` +
        `  Hint: Set DATABASE_URL or POSTGRES_HOST/USER/PASSWORD/PORT.\n` +
        `  Or remove SIFTCODER_DB_BACKEND=postgres to use SQLite instead.`
      );
    }
  }

  // Fallback to auto (shouldn't reach here)
  return openStorage({ ...opts, backend: 'auto' });
}