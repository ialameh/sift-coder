const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'it', 'its']);
export function tokenize(text) {
    return (text.toLowerCase().match(/[a-z0-9_-]{2,}/g) ?? []).filter(t => !STOP.has(t));
}
function docStats(text) {
    const tokens = tokenize(text);
    const tf = new Map();
    for (const t of tokens)
        tf.set(t, (tf.get(t) ?? 0) + 1);
    return { termFreq: tf, length: tokens.length };
}
export function rerank(query, hits, opts = {}) {
    const k = opts.k ?? 5;
    const lambdaLen = opts.lengthPenalty ?? 0.01;
    const phraseBonus = opts.phraseBonus ?? 0.4;
    const exactBonus = opts.exactTermBonus ?? 0.1;
    if (hits.length === 0)
        return [];
    const qTokens = tokenize(query);
    if (qTokens.length === 0)
        return hits.slice(0, k);
    const docs = hits.map(h => docStats(h.text));
    const docFreq = new Map();
    for (const d of docs) {
        for (const t of d.termFreq.keys())
            docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
    }
    const N = docs.length;
    const idf = (term) => {
        /* c8 ignore next -- term is always present in docFreq when idf is invoked; ?? 0 is a type guard */
        const df = docFreq.get(term) ?? 0;
        return Math.log(1 + (N - df + 0.5) / (df + 0.5));
    };
    const phrase = query.toLowerCase().trim();
    const reranked = hits.map((h, i) => {
        const d = docs[i];
        let score = 0;
        const seen = new Set();
        for (const t of qTokens) {
            const tf = d.termFreq.get(t);
            if (!tf)
                continue;
            /* c8 ignore next -- d.length is non-zero whenever tf > 0; Math.max guard is defensive */
            const tfidf = (tf / Math.max(1, d.length)) * idf(t);
            score += tfidf;
            if (!seen.has(t)) {
                score += exactBonus;
                seen.add(t);
            }
        }
        if (phrase.length >= 4 && h.text.toLowerCase().includes(phrase))
            score += phraseBonus;
        score -= lambdaLen * Math.log(1 + d.length);
        score += h.score * 0.5;
        return { ...h, score };
    });
    reranked.sort((a, b) => b.score - a.score);
    return reranked.slice(0, k);
}
//# sourceMappingURL=reranker.js.map