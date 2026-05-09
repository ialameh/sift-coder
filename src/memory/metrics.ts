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

export async function computeSavings(storage: Storage): Promise<SavingsReport> {
  const events = await storage.countAll('events');
  const tokensCaptured = await storage.sumNumber('SELECT sum(tokens_est) AS n FROM events');
  const redactedEvents = await storage.countRedacted();
  const summarized = await storage.countByStatus('summarized');
  const skipped    = await storage.countByStatus('skipped');
  const raw        = await storage.countByStatus('raw');
  const perTool    = await storage.perToolCounts();

  const summaries = await storage.countAll('summaries');
  const tokensIn  = await storage.sumNumber('SELECT sum(tokens_in)  AS n FROM summaries');
  const tokensOut = await storage.sumNumber('SELECT sum(tokens_out) AS n FROM summaries');
  const cacheRows = await storage.countAll('summary_cache');
  // Cache hit estimate: events sharing an input_hash whose summary already exists. The first
  // event populates the cache, every subsequent same-hash event hits it.
  const cacheHits = await storage.countSharedInputHashes();
  const cacheHitRate = summaries === 0 ? 0 : Math.min(1, cacheHits / summaries);
  const summaryTokensStored = await storage.sumSummaryTextChars();

  const embeddings = await storage.countAll('summary_embeddings');
  const superseded = await storage.countSupersededDistinct();
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