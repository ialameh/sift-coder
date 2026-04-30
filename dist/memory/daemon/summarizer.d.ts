import { Storage } from '../storage/storage.js';
export interface ModelClient {
    generate(req: ModelRequest): Promise<ModelResult>;
}
export interface ModelRequest {
    model: string;
    system: string;
    user: string;
    maxTokens: number;
}
export interface ModelResult {
    text: string;
    tokensIn: number | null;
    tokensOut: number | null;
}
export interface SummarizerOptions {
    haikuModel?: string;
    sonnetModel?: string;
    confidenceThreshold?: number;
    maxTokens?: number;
}
export declare class Summarizer {
    private readonly storage;
    private readonly client;
    private readonly haiku;
    private readonly sonnet;
    private readonly threshold;
    private readonly maxTokens;
    constructor(storage: Storage, client: ModelClient, opts?: SummarizerOptions);
    static promptHash(system: string): string;
    summarize(eventId: number, inputHash: string, user: string, ts: number): Promise<{
        id: number;
        text: string;
        model: string;
        confidence: number;
        cached: boolean;
    }>;
}
export declare function parseModelOutput(raw: string): {
    text: string;
    confidence: number;
};
//# sourceMappingURL=summarizer.d.ts.map