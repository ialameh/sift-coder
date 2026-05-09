/**
 * Worker thread for PostgreSQL storage.
 *
 * Runs in a separate thread, owns the pg Pool, and handles SQL commands from the main thread
 * via worker.on('message'). Replies via parentPort.postMessage().
 *
 * Message shapes (kept as JSDoc since this file is plain JS for lint compatibility):
 *
 *   InitMessage    = { op: 'init', id, opts: { host, port, user, password, database, maxConnections? } }
 *   RequestMessage = { id, op: 'exec'|'run'|'get'|'all', sql, params }
 *   ResponseMessage = { id, ok, result?, error?, lastInsertRowid? }
 */
import { parentPort } from 'node:worker_threads';
import pg from 'pg';

const { Pool } = pg;

let pool = null;
let fullDbName = null;

parentPort.on('message', async (msg) => {
  if (msg.op === 'init') {
    const opts = msg.opts;
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
    } catch (e) {
      if (!String(e).includes('already exists')) {
        parentPort.postMessage({ id: -1, ok: false, error: String(e) });
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

    parentPort.postMessage({ id: -1, ok: true });
    return;
  }

  if (!pool) {
    parentPort.postMessage({ id: msg.id, ok: false, error: 'not initialized' });
    return;
  }

  const { id, op, sql, params } = msg;

  try {
    if (op === 'exec') {
      const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
      for (const s of stmts) {
        try { await pool.query(s); } catch { /* ignore DDL errors */ }
      }
      parentPort.postMessage({ id, ok: true });
      return;
    }

    if (op === 'run') {
      const isInsert = /^\s*INSERT/i.test(sql) && !sql.includes('RETURNING');
      if (isInsert) {
        await pool.query(sql, params);
        let lastId = 0;
        try {
          const lv = await pool.query('SELECT lastval() as id');
          if (lv.rows[0]) lastId = Number(lv.rows[0]['id']);
        } catch { /* ignore if lastval not available */ }
        parentPort.postMessage({ id, ok: true, lastInsertRowid: lastId });
      } else {
        await pool.query(sql, params);
        parentPort.postMessage({ id, ok: true });
      }
      return;
    }

    if (op === 'get') {
      const result = await pool.query(sql, params);
      parentPort.postMessage({ id, ok: true, result: result.rows[0] ?? null });
      return;
    }

    if (op === 'all') {
      const result = await pool.query(sql, params);
      parentPort.postMessage({ id, ok: true, result: result.rows });
      return;
    }
  } catch (e) {
    parentPort.postMessage({ id, ok: false, error: String(e) });
  }
});
