import type { ModelClient } from './daemon/summarizer.js';
import type { HybridHit } from './retrieval.js';
import type { Storage } from './storage/storage.js';
export interface ClaudeRerankerOptions {
    model?: string;
    concurrency?: number;
    k?: number;
    cache?: RerankCache;
}
export interface RerankCache {
    get(key: string): number | undefined;
    set(key: string, value: number): void;
}
export declare class ClaudeReranker {
    private readonly client;
    private readonly model;
    private readonly concurrency;
    private readonly k;
    private readonly cache;
    constructor(client: ModelClient, opts?: ClaudeRerankerOptions);
    static cacheKey(query: string, summaryId: number, model: string): string;
    rerank(query: string, hits: HybridHit[]): Promise<HybridHit[]>;
    private scoreOne;
}
/**
 * SQLite-backed cache adapter that stores rerank scores in summary_cache, reusing the existing
 * cache table so we get free TTL/eviction policy if we add one later.
 */
export declare class StorageRerankCache implements RerankCache {
    private readonly storage;
    constructor(storage: Storage);
    get(key: string): number | undefined;
    set(key: string, value: number): void;
}
//# sourceMappingURL=claude-reranker.d.ts.map