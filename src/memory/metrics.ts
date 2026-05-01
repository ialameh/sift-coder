/**
 * Memory savings metrics.
 *
 * Aggregates from existing tables to produce a quantitative picture of:
 *   - Capture volume   — events captured, tokens stored before redaction.
 *   - Compression ratio — events tokens vs summaries tokens (savings).
 *   - Drain coverage   — fraction of events that have been summarized.
 *   - Cache hit rate   — proportion of summarizations served from cache.
 *   - Dedup ratio      — fraction of summaries marked as superseded.
 *   - Spend            — total summarizer tokens_in / tokens_out (cost).
 *   - ROI              — captured tokens minus summarizer tokens minus stored summary tokens.
 *
 * Pure read-only over a Storage handle. No DB schema changes required.
 */
import type { Storage } from './storage/storage.js';

interface DBQuery {
  prepare(sql: string): { get(...p: unknown[]): unknown; all(...p: unknown[]): unknown[] };
}

export interface SavingsReport {
  workspace: { dbPath: string | null; sizeBytes: number | null };
  capture: {
    events: number;
    tokensCaptured: number;
    redactedEvents: number;
    perTool: Record<string, number>;
  };
  drain: {
    summarized: number;
    skipped: number;
    raw: number;
    coverage: number;
  };
  spend: {
    summaries: number;
    tokensIn: number;
    tokensOut: number;
    cacheRows: number;
    cacheHits: number;
    cacheHitRate: number;
  };
  dedup: {
    embeddings: number;
    superseded: number;
    dedupRatio: number;
  };
  context: {
    summaryTokensStored: number;
    compressionRatio: number;
    netSavedTokens: number;
  };
}

interface CountRow { c: number }
interface NumRow { n: number | null }

function getDb(storage: Storage): DBQuery {
  return (storage as unknown as { ['db']: DBQuery })['db'];
}

export function computeSavings(storage: Storage): SavingsReport {
  const db = getDb(storage);
  /* c8 ignore next -- count(*) always returns a row; ?? 0 is a defensive type guard */
  const c = (sql: string): number => (db.prepare(sql).get() as CountRow | undefined)?.c ?? 0;
  /* c8 ignore next -- sum(...) always returns a row; ?? 0 is a defensive type guard */
  const n = (sql: string): number => (db.prepare(sql).get() as NumRow | undefined)?.n ?? 0;

  const events = c('SELECT count(*) AS c FROM events');
  const tokensCaptured = n('SELECT sum(tokens_est) AS n FROM events');
  const redactedEvents = c("SELECT count(*) AS c FROM events WHERE payload_json LIKE '%REDACTED:%'");
  const summarized = c("SELECT count(*) AS c FROM events WHERE status = 'summarized'");
  const skipped    = c("SELECT count(*) AS c FROM events WHERE status = 'skipped'");
  const raw        = c("SELECT count(*) AS c FROM events WHERE status = 'raw'");

  const perToolRows = db.prepare('SELECT tool, count(*) AS c FROM events GROUP BY tool ORDER BY c DESC').all() as Array<{ tool: string; c: number }>;
  const perTool: Record<string, number> = {};
  for (const r of perToolRows) perTool[r.tool] = r.c;

  const summaries = c('SELECT count(*) AS c FROM summaries');
  const tokensIn  = n('SELECT sum(tokens_in)  AS n FROM summaries');
  const tokensOut = n('SELECT sum(tokens_out) AS n FROM summaries');
  const cacheRows = c('SELECT count(*) AS c FROM summary_cache');
  const cacheHits = Math.max(0, summaries - cacheRows);
  const cacheHitRate = summaries === 0 ? 0 : cacheHits / summaries;
  const summaryTokensStored = n('SELECT sum(length(text) / 4) AS n FROM summaries');

  const embeddings = c('SELECT count(*) AS c FROM summary_embeddings');
  const superseded = c('SELECT count(DISTINCT older_id) AS c FROM summary_supersedes');
  const dedupRatio = summaries === 0 ? 0 : superseded / summaries;

  const compressionRatio = tokensCaptured === 0 ? 0 : summaryTokensStored / tokensCaptured;
  const netSavedTokens = tokensCaptured - tokensIn - tokensOut - summaryTokensStored;

  const coverage = events === 0 ? 0 : summarized / events;

  return {
    workspace: { dbPath: null, sizeBytes: null },
    capture: { events, tokensCaptured, redactedEvents, perTool },
    drain: { summarized, skipped, raw, coverage },
    spend: { summaries, tokensIn, tokensOut, cacheRows, cacheHits, cacheHitRate },
    dedup: { embeddings, superseded, dedupRatio },
    context: { summaryTokensStored, compressionRatio, netSavedTokens },
  };
}

export function renderSavings(r: SavingsReport): string {
  const pct = (n: number): string => (n * 100).toFixed(1) + '%';
  const num = (n: number): string => n.toLocaleString('en-US');
  return [
    `=== SiftCoder Memory — Savings Report ===`,
    ``,
    `Capture`,
    `  events captured:        ${num(r.capture.events)}`,
    `  tokens captured (est):  ${num(r.capture.tokensCaptured)}`,
    `  redacted events:        ${num(r.capture.redactedEvents)} (${pct(r.capture.events === 0 ? 0 : r.capture.redactedEvents / r.capture.events)})`,
    `  by tool:                ${Object.entries(r.capture.perTool).map(([k, v]) => `${k}=${v}`).join(', ')}`,
    ``,
    `Drain`,
    `  summarized:             ${num(r.drain.summarized)} (${pct(r.drain.coverage)} coverage)`,
    `  skipped:                ${num(r.drain.skipped)}`,
    `  raw / pending:          ${num(r.drain.raw)}`,
    ``,
    `Spend (summarization through host sampling)`,
    `  summaries:              ${num(r.spend.summaries)}`,
    `  tokens in:              ${num(r.spend.tokensIn)}`,
    `  tokens out:             ${num(r.spend.tokensOut)}`,
    `  cache hits:             ${num(r.spend.cacheHits)} (${pct(r.spend.cacheHitRate)})`,
    ``,
    `Dedup + consolidation`,
    `  embeddings:             ${num(r.dedup.embeddings)}`,
    `  superseded summaries:   ${num(r.dedup.superseded)} (${pct(r.dedup.dedupRatio)})`,
    ``,
    `Context savings`,
    `  summary tokens stored:  ${num(r.context.summaryTokensStored)}`,
    `  compression ratio:      ${pct(r.context.compressionRatio)}  (lower = more compressed)`,
    `  net saved tokens:       ${num(r.context.netSavedTokens)}  (captured − sampled − stored)`,
    ``,
  ].join('\n');
}
