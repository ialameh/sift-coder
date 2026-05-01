/**
 * A/B savings harness for SiftCoder Memory.
 *
 * Replays captured events from the local SQLite store as a multi-turn workload and reports the
 * token cost under two regimes:
 *
 *   Branch A — full history. Every turn re-sends every prior event as transcript context. This
 *              is the upper bound on what "no memory at all" would cost in a multi-turn agent.
 *   Branch B — memory-backed. Every turn re-sends only the current event payload plus the top-k
 *              summary hits returned by hybridSearch against a synthetic query mined from the
 *              current event's most informative tokens.
 *
 * The integral over an N-turn session is the realistic cost: Branch A is O(N^2) tokens because
 * each turn re-sends the growing transcript; Branch B is O(N * (1 + k)) tokens because each turn
 * re-sends only the current event plus a fixed-size memory window.
 *
 * The harness is fully deterministic and reads only — no captures, no summarization. Run it any
 * time after a session has accumulated >=20 events.
 */
import type { Storage, EventRow } from './storage/storage.js';
import type { Embedder } from './embedder.js';
import { hybridSearch } from './retrieval.js';
import { tokenize } from './reranker.js';
import { approximate } from './tokens.js';

export interface AbOptions {
  /** How many of the most recent events to replay. Default 100. */
  turns?: number;
  /** Memories to inject per turn in Branch B. Default 5. */
  memoryK?: number;
  /** Top-IDF tokens used to derive the synthetic query from each turn's event payload. Default 4. */
  queryTerms?: number;
  /** Override now() for retrieval recency decay. Useful for tests. */
  now?: number;
}

export interface AbTurn {
  id: number;
  ts: number;
  tool: string;
  branchATokens: number;
  branchBTokens: number;
  cumulativeA: number;
  cumulativeB: number;
}

export interface AbReport {
  turns: AbTurn[];
  totalA: number;
  totalB: number;
  savedTokens: number;
  savedPct: number;
  averageBranchAGrowth: number;
  averageBranchBSize: number;
  k: number;
}

export class AbHarness {
  constructor(private readonly storage: Storage, private readonly embedder: Embedder | null) {}

  async run(opts: AbOptions = {}): Promise<AbReport> {
    const turnsLimit = opts.turns ?? 100;
    const k = opts.memoryK ?? 5;
    const queryTerms = opts.queryTerms ?? 4;
    const now = opts.now ?? Date.now();

    const events = readRecentEvents(this.storage, turnsLimit);
    let cumulativeA = 0;
    let cumulativeB = 0;
    const transcript: number[] = [];
    const turns: AbTurn[] = [];

    for (const ev of events) {
      transcript.push(ev.tokensEst);
      const branchA = sum(transcript);
      const query = synthQuery(ev.payloadJson, queryTerms);
      const memoryTokens = query
        ? await retrieveMemoryTokens(this.storage, this.embedder, query, k, now)
        : 0;
      const branchB = ev.tokensEst + memoryTokens;
      cumulativeA += branchA;
      cumulativeB += branchB;
      turns.push({
        id: ev.id,
        ts: ev.ts,
        tool: ev.tool,
        branchATokens: branchA,
        branchBTokens: branchB,
        cumulativeA,
        cumulativeB,
      });
    }

    const totalA = cumulativeA;
    const totalB = cumulativeB;
    const savedTokens = totalA - totalB;
    const savedPct = totalA === 0 ? 0 : savedTokens / totalA;
    const averageBranchAGrowth = turns.length === 0 ? 0 : turns[turns.length - 1]!.branchATokens / turns.length;
    const averageBranchBSize = turns.length === 0 ? 0 : turns.reduce((s, t) => s + t.branchBTokens, 0) / turns.length;

    return { turns, totalA, totalB, savedTokens, savedPct, averageBranchAGrowth, averageBranchBSize, k };
  }
}

interface DBQuery {
  prepare(sql: string): { all(...p: unknown[]): unknown[] };
}

interface RecentEventRow {
  id: number;
  ts: number;
  session_id: string;
  tool: string;
  input_hash: string;
  payload_json: string;
  status: string;
  tokens_est: number;
}

function readRecentEvents(storage: Storage, limit: number): EventRow[] {
  const db = (storage as unknown as { ['db']: DBQuery })['db'];
  const rows = db.prepare(
    `SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est
     FROM events ORDER BY id DESC LIMIT ?`
  ).all(limit) as RecentEventRow[];
  return rows
    .map(r => ({
      id: r.id,
      ts: r.ts,
      sessionId: r.session_id,
      tool: r.tool,
      inputHash: r.input_hash,
      payloadJson: r.payload_json,
      status: r.status,
      tokensEst: r.tokens_est > 0 ? r.tokens_est : approximate(r.payload_json),
    }))
    .reverse();
}

function synthQuery(payloadJson: string, termsPerQuery: number): string {
  const tokens = tokenize(payloadJson);
  if (tokens.length === 0) return '';
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return [...tf.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, termsPerQuery)
    .map(x => x[0])
    .join(' ');
}

async function retrieveMemoryTokens(
  storage: Storage,
  embedder: Embedder | null,
  query: string,
  k: number,
  now: number
): Promise<number> {
  const hits = await hybridSearch(storage, embedder, query, now, { k, decayTauMs: 1e15 });
  let tokens = 0;
  for (const h of hits) tokens += approximate(h.text);
  return tokens;
}

function sum(arr: number[]): number {
  let s = 0;
  for (const n of arr) s += n;
  return s;
}

export function renderAb(r: AbReport): string {
  const num = (n: number): string => Math.round(n).toLocaleString('en-US');
  const pct = (n: number): string => (n * 100).toFixed(1) + '%';
  return [
    `=== SiftCoder Memory — A/B savings ===`,
    ``,
    `Turns replayed:           ${r.turns.length}`,
    `Memory injection K:       ${r.k}`,
    ``,
    `Branch A (full history)   ${num(r.totalA)} tokens cumulative`,
    `Branch B (memory-backed)  ${num(r.totalB)} tokens cumulative`,
    ``,
    `Saved:                    ${num(r.savedTokens)} tokens  (${pct(r.savedPct)})`,
    `Avg per-turn A:           ${num(r.averageBranchAGrowth)}`,
    `Avg per-turn B:           ${num(r.averageBranchBSize)}`,
    ``,
  ].join('\n');
}
