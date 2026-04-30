import { hybridSearch } from './retrieval.js';
export async function evaluate(storage, embedder, golden, k = 5, now = Date.now(), opts = {}) {
    let recallSum = 0;
    let rrSum = 0;
    const perQuery = [];
    for (const item of golden) {
        const hits = await hybridSearch(storage, embedder, item.query, now, { ...opts, k });
        const hitIds = hits.map(h => h.id);
        const expected = new Set(item.expectedIds);
        const matched = hitIds.filter(id => expected.has(id)).length;
        const recall = expected.size === 0 ? 1 : matched / expected.size;
        recallSum += recall;
        let firstHitRank = null;
        for (let i = 0; i < hitIds.length; i++) {
            if (expected.has(hitIds[i])) {
                firstHitRank = i + 1;
                break;
            }
        }
        rrSum += firstHitRank !== null ? 1 / firstHitRank : 0;
        perQuery.push({ query: item.query, hitIds, firstHitRank, recall });
    }
    const n = golden.length;
    return {
        k,
        recallAtK: n === 0 ? 0 : recallSum / n,
        mrr: n === 0 ? 0 : rrSum / n,
        perQuery,
    };
}
//# sourceMappingURL=eval.js.map