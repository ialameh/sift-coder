/**
 * Worker thread for PostgreSQL storage.
 *
 * This module runs in a separate thread, owns the pg Pool, and handles
 * SQL commands from the main thread via worker.on('message').
 *
 * The worker replies using parentPort.postMessage().
 */
import { parentPort } from 'node:worker_threads';
import pg from 'pg';

const { Pool } = pg;

interface InitMessage {
  op: 'init';
  id: number;
  opts: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    maxConnections?: number;
  };
}

interface RequestMessage {
  id: number;
  op: 'exec' | 'run' | 'get' | 'all';
  sql: string;
  params: unknown[];
}

type WorkerMessage = InitMessage | RequestMessage;

interface ResponseMessage {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
  lastInsertRowid?: number;
}

let pool: Pool | null = null;
let fullDbName: string | null = null;

parentPort!.on('message', async (msg: WorkerMessage) => {
  if (msg.op === 'init') {
    const opts = (msg as InitMessage).opts;
    fullDbName = `${opts.database}`;
    // Create workspace database if not exists
    const adminPool = new Pool({
      host: opts.host,
      port: opts.port,
      user: opts.user,
      password: opts.password,
      database: 'postgres',
      max: 1,
    });
    try {
      await adminPool.query(`CREATE DATABASE "${fullDbName}"`);
    } catch (e: unknown) {
      if (!String(e).includes('already exists')) {
        parentPort!.postMessage({ id: -1, ok: false, error: String(e) } satisfies ResponseMessage);
        return;
      }
    }
    await adminPool.end();

    pool = new Pool({
      host: opts.host,
      port: opts.port,
      user: opts.user,
      password: opts.password,
      database: fullDbName,
      max: opts.maxConnections ?? 10,
    });

    // Enable pg_vector
    try { await pool.query('CREATE EXTENSION IF NOT EXISTS vector'); } catch { /* ignore */ }

    parentPort!.postMessage({ id: -1, ok: true } satisfies ResponseMessage);
    return;
  }

  if (!pool) {
    parentPort!.postMessage({ id: (msg as RequestMessage).id, ok: false, error: 'not initialized' } satisfies ResponseMessage);
    return;
  }

  const { id, op, sql, params } = msg as RequestMessage;

  try {
    if (op === 'exec') {
      const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
      for (const s of stmts) {
        try { await pool.query(s); } catch { /* ignore DDL errors */ }
      }
      parentPort!.postMessage({ id, ok: true } satisfies ResponseMessage);
      return;
    }

    if (op === 'run') {
      const isInsert = /^\s*INSERT/i.test(sql) && !sql.includes('RETURNING');
      if (isInsert) {
        const result = await pool.query(sql, params as (string | number | null)[]);
        let lastId = 0;
        try {
          const lv = await pool.query('SELECT lastval() as id');
          if (lv.rows[0]) lastId = Number(lv.rows[0]['id']);
        } catch { /* ignore if lastval not available */ }
        parentPort!.postMessage({ id, ok: true, lastInsertRowid: lastId } satisfies ResponseMessage);
      } else {
        await pool.query(sql, params as (string | number | null)[]);
        parentPort!.postMessage({ id, ok: true } satisfies ResponseMessage);
      }
      return;
    }

    if (op === 'get') {
      const result = await pool.query(sql, params as (string | number | null)[]);
      parentPort!.postMessage({ id, ok: true, result: result.rows[0] ?? null } satisfies ResponseMessage);
      return;
    }

    if (op === 'all') {
      const result = await pool.query(sql, params as (string | number | null)[]);
      parentPort!.postMessage({ id, ok: true, result: result.rows } satisfies ResponseMessage);
      return;
    }
  } catch (e: unknown) {
    parentPort!.postMessage({ id, ok: false, error: String(e) } satisfies ResponseMessage);
  }
});