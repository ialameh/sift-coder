import { hybridSearch } from './retrieval.js';
import { tokenize } from './reranker.js';
import { approximate } from './tokens.js';
export class AbHarness {
    storage;
    embedder;
    constructor(storage, embedder) {
        this.storage = storage;
        this.embedder = embedder;
    }
    async run(opts = {}) {
        const turnsLimit = opts.turns ?? 100;
        const k = opts.memoryK ?? 5;
        const queryTerms = opts.queryTerms ?? 4;
        const now = opts.now ?? Date.now();
        const events = readRecentEvents(this.storage, turnsLimit);
        let cumulativeA = 0;
        let cumulativeB = 0;
        const transcript = [];
        const turns = [];
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
        const averageBranchAGrowth = turns.length === 0 ? 0 : turns[turns.length - 1].branchATokens / turns.length;
        const averageBranchBSize = turns.length === 0 ? 0 : turns.reduce((s, t) => s + t.branchBTokens, 0) / turns.length;
        return { turns, totalA, totalB, savedTokens, savedPct, averageBranchAGrowth, averageBranchBSize, k };
    }
}
function readRecentEvents(storage, limit) {
    const db = storage['db'];
    const rows = db.prepare(`SELECT id, ts, session_id, tool, input_hash, payload_json, status, tokens_est
     FROM events ORDER BY id DESC LIMIT ?`).all(limit);
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
function synthQuery(payloadJson, termsPerQuery) {
    const tokens = tokenize(payloadJson);
    if (tokens.length === 0)
        return '';
    const tf = new Map();
    for (const t of tokens)
        tf.set(t, (tf.get(t) ?? 0) + 1);
    return [...tf.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, termsPerQuery)
        .map(x => x[0])
        .join(' ');
}
async function retrieveMemoryTokens(storage, embedder, query, k, now) {
    const hits = await hybridSearch(storage, embedder, query, now, { k, decayTauMs: 1e15 });
    let tokens = 0;
    for (const h of hits)
        tokens += approximate(h.text);
    return tokens;
}
function sum(arr) {
    let s = 0;
    for (const n of arr)
        s += n;
    return s;
}
export function renderAb(r) {
    const num = (n) => Math.round(n).toLocaleString('en-US');
    const pct = (n) => (n * 100).toFixed(1) + '%';
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
//# sourceMappingURL=ab.js.map