/**
 * Storage facade over better-sqlite3 + (optional) sqlite-vec.
 * Capture path is synchronous and crash-safe; embeddings + FTS rank are layered on top.
 */
import { createHash } from 'node:crypto';
import { CORE_DDL, MIGRATIONS, VEC_DDL } from './schema.js';
/**
 * FTS5 MATCH treats `-`, `+`, `"`, `(`, `)`, `*`, `:`, `^`, AND, OR, NOT, NEAR as operators.
 * User-typed queries with any of these blow up with `fts5: syntax error near "X"`. Reduce to
 * alphanumeric tokens (incl. underscore); strip the FTS5 keywords NEAR/AND/OR/NOT to avoid
 * accidental operator semantics; join with spaces for default AND-of-tokens behavior.
 */
const FTS5_KEYWORDS = new Set(['NEAR', 'AND', 'OR', 'NOT']);
export function sanitizeFtsQuery(q) {
    const tokens = (q.match(/[A-Za-z0-9_]+/g) ?? []).filter(t => !FTS5_KEYWORDS.has(t.toUpperCase()));
    return tokens.join(' ');
}
export function hashInput(payload) {
    const json = JSON.stringify(payload);
    return createHash('sha256').update(json).digest('hex');
}
export class Storage {
    db;
    vecEnabled;
    constructor(db, opts = {}) {
        this.db = db;
        db.exec(CORE_DDL);
        for (const stmt of MIGRATIONS) {
            try {
                db.exec(stmt);
            }
            catch { /* migration already applied */ }
        }
        let vec = false;
        if (opts.vecExtensionPath && db.loadExtension) {
            try {
                db.loadExtension(opts.vecExtensionPath);
                db.exec(VEC_DDL);
                vec = true;
            }
            catch {
                vec = false;
            }
        }
        this.vecEnabled = vec;
    }
    ensureSession(sessionId, cwd, ts) {
        this.db
            .prepare('INSERT OR IGNORE INTO sessions (id, started_at, cwd) VALUES (?, ?, ?)')
            .run(sessionId, ts, cwd);
    }
    recordEvent(input) {
        const inputHash = hashInput(input.payload);
        const result = this.db
            .prepare('INSERT INTO events (ts, session_id, tool, input_hash, payload_json, tokens_est) VALUES (?, ?, ?, ?, ?, ?)')
            .run(input.ts, input.sessionId, input.tool, inputHash, JSON.stringify(input.payload), input.tokensEst ?? 0);
        return Number(result.lastInsertRowid);
    }
    getEvent(id) {
        const row = this.db
            .prepare('SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE id = ?')
            .get(id);
        if (!row)
            return null;
        return {
            id: row['id'],
            ts: row['ts'],
            sessionId: row['session_id'],
            tool: row['tool'],
            inputHash: row['input_hash'],
            payloadJson: row['payload_json'],
            status: row['status'],
            tokensEst: row['tokens_est'] ?? 0,
        };
    }
    markEventStatus(id, status) {
        this.db.prepare('UPDATE events SET status = ? WHERE id = ?').run(status, id);
    }
    pendingEvents(limit = 32) {
        const rows = this.db
            .prepare("SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est FROM events WHERE status = 'raw' ORDER BY id ASC LIMIT ?")
            .all(limit);
        return rows.map(r => ({
            id: r['id'],
            ts: r['ts'],
            sessionId: r['session_id'],
            tool: r['tool'],
            inputHash: r['input_hash'],
            payloadJson: r['payload_json'],
            status: r['status'],
            tokensEst: r['tokens_est'] ?? 0,
        }));
    }
    recordSummary(s) {
        const result = this.db
            .prepare('INSERT INTO summaries (event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(s.eventId, s.ts, s.model, s.promptHash, s.text, s.tokensIn, s.tokensOut, s.confidence);
        return Number(result.lastInsertRowid);
    }
    getSummariesByIds(ids) {
        if (ids.length === 0)
            return [];
        const placeholders = ids.map(() => '?').join(',');
        const rows = this.db
            .prepare(`SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence FROM summaries WHERE id IN (${placeholders})`)
            .all(...ids);
        return rows.map(r => ({
            id: r['id'],
            eventId: r['event_id'],
            ts: r['ts'],
            model: r['model'],
            promptHash: r['prompt_hash'],
            text: r['text'],
            tokensIn: r['tokens_in'] ?? null,
            tokensOut: r['tokens_out'] ?? null,
            confidence: r['confidence'] ?? null,
        }));
    }
    searchFts(query, k = 5) {
        const safe = sanitizeFtsQuery(query);
        if (!safe)
            return [];
        const rows = this.db
            .prepare(`SELECT s.id AS id, s.event_id AS event_id, s.text AS text, s.ts AS ts,
                bm25(summaries_fts) AS score
         FROM summaries_fts JOIN summaries s ON s.id = summaries_fts.rowid
         WHERE summaries_fts MATCH ?
         ORDER BY score ASC LIMIT ?`)
            .all(safe, k);
        return rows.map(r => ({
            id: r['id'],
            eventId: r['event_id'],
            text: r['text'],
            ts: r['ts'],
            score: r['score'],
        }));
    }
    timeline(nearId, window = 10) {
        const rows = this.db
            .prepare(`SELECT id, event_id, ts, model, prompt_hash, text, tokens_in, tokens_out, confidence
         FROM summaries
         WHERE id BETWEEN ? AND ?
         ORDER BY id ASC`)
            .all(nearId - window, nearId + window);
        return rows.map(r => ({
            id: r['id'],
            eventId: r['event_id'],
            ts: r['ts'],
            model: r['model'],
            promptHash: r['prompt_hash'],
            text: r['text'],
            tokensIn: r['tokens_in'] ?? null,
            tokensOut: r['tokens_out'] ?? null,
            confidence: r['confidence'] ?? null,
        }));
    }
    putEmbedding(summaryId, vec) {
        const buf = Buffer.from(vec.buffer, vec.byteOffset, vec.byteLength);
        this.db
            .prepare('INSERT OR REPLACE INTO summary_embeddings (summary_id, dim, vec) VALUES (?, ?, ?)')
            .run(summaryId, vec.length, buf);
    }
    getEmbedding(summaryId) {
        const row = this.db
            .prepare('SELECT dim, vec FROM summary_embeddings WHERE summary_id = ?')
            .get(summaryId);
        if (!row)
            return null;
        return new Float32Array(row.vec.buffer, row.vec.byteOffset, row.dim);
    }
    allEmbeddings() {
        const rows = this.db
            .prepare(`SELECT e.summary_id AS sid, e.dim AS dim, e.vec AS vec, s.ts AS ts
         FROM summary_embeddings e JOIN summaries s ON s.id = e.summary_id`)
            .all();
        return rows.map(r => ({
            summaryId: r.sid,
            vec: new Float32Array(r.vec.buffer, r.vec.byteOffset, r.dim),
            ts: r.ts,
        }));
    }
    recordSupersedes(newerId, olderId, cosineSim, ts) {
        this.db
            .prepare('INSERT OR IGNORE INTO summary_supersedes (newer_id, older_id, cosine, ts) VALUES (?, ?, ?, ?)')
            .run(newerId, olderId, cosineSim, ts);
    }
    supersededIds() {
        const rows = this.db
            .prepare('SELECT older_id FROM summary_supersedes')
            .all();
        return new Set(rows.map(r => r.older_id));
    }
    cacheKey(model, promptHash, inputHash) {
        return createHash('sha256')
            .update(model)
            .update('|')
            .update(promptHash)
            .update('|')
            .update(inputHash)
            .digest('hex');
    }
    getCachedSummary(cacheKey) {
        const row = this.db
            .prepare('SELECT text, tokens_in, tokens_out FROM summary_cache WHERE cache_key = ?')
            .get(cacheKey);
        if (!row)
            return null;
        return {
            text: row['text'],
            tokensIn: row['tokens_in'] ?? null,
            tokensOut: row['tokens_out'] ?? null,
        };
    }
    putCachedSummary(cacheKey, text, tokensIn, tokensOut, ts) {
        this.db
            .prepare('INSERT OR REPLACE INTO summary_cache (cache_key, text, tokens_in, tokens_out, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(cacheKey, text, tokensIn, tokensOut, ts);
    }
}
//# sourceMappingURL=storage.js.map