export declare function sanitizeFtsQuery(q: string): string;
export interface DBHandle {
    exec(sql: string): unknown;
    prepare(sql: string): {
        run(...params: unknown[]): {
            lastInsertRowid: number | bigint;
        };
        get(...params: unknown[]): unknown;
        all(...params: unknown[]): unknown[];
    };
    loadExtension?(path: string): void;
    close?(): void;
}
export interface EventRow {
    id: number;
    ts: number;
    sessionId: string;
    tool: string;
    inputHash: string;
    payloadJson: string;
    status: string;
    tokensEst: number;
}
export interface SummaryRow {
    id: number;
    eventId: number;
    ts: number;
    model: string;
    promptHash: string;
    text: string;
    tokensIn: number | null;
    tokensOut: number | null;
    confidence: number | null;
}
export interface CaptureInput {
    ts: number;
    sessionId: string;
    tool: string;
    payload: unknown;
    tokensEst?: number;
}
export interface SearchHit {
    id: number;
    eventId: number;
    text: string;
    ts: number;
    score: number;
}
export declare function hashInput(payload: unknown): string;
export declare class Storage {
    private readonly db;
    readonly vecEnabled: boolean;
    constructor(db: DBHandle, opts?: {
        vecExtensionPath?: string;
    });
    ensureSession(sessionId: string, cwd: string, ts: number): void;
    recordEvent(input: CaptureInput): number;
    getEvent(id: number): EventRow | null;
    markEventStatus(id: number, status: 'raw' | 'summarized' | 'skipped'): void;
    pendingEvents(limit?: number): EventRow[];
    recordSummary(s: Omit<SummaryRow, 'id'>): number;
    getSummariesByIds(ids: number[]): SummaryRow[];
    searchFts(query: string, k?: number): SearchHit[];
    timeline(nearId: number, window?: number): SummaryRow[];
    putEmbedding(summaryId: number, vec: Float32Array): void;
    getEmbedding(summaryId: number): Float32Array | null;
    allEmbeddings(): Array<{
        summaryId: number;
        vec: Float32Array;
        ts: number;
    }>;
    recordSupersedes(newerId: number, olderId: number, cosineSim: number, ts: number): void;
    supersededIds(): Set<number>;
    cacheKey(model: string, promptHash: string, inputHash: string): string;
    getCachedSummary(cacheKey: string): {
        text: string;
        tokensIn: number | null;
        tokensOut: number | null;
    } | null;
    putCachedSummary(cacheKey: string, text: string, tokensIn: number | null, tokensOut: number | null, ts: number): void;
}
//# sourceMappingURL=storage.d.ts.map