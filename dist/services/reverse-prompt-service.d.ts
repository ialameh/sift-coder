export declare const SYSTEM_PROMPT: string;

export interface QuickContext {
    repoId: string;
    manifest: { name: string; content: string | null } | null;
    tree: string;
    readme: string | null;
}

export interface ContextBlockOpts {
    deepSummary?: string;
    focus?: string;
}

export interface CacheEntry {
    id: string;
    repoId: string;
    mode: 'quick' | 'deep' | 'focus';
    focus: string;
    prompt: string;
    generatedAt: string;
}

export interface CacheIndexEntry {
    id: string;
    repoId: string;
    mode: string;
    focus: string;
    generatedAt: string;
    preview: string;
}

export declare function gatherQuickContext(projectRoot?: string): QuickContext;
export declare function buildContextBlock(ctx: QuickContext, opts?: ContextBlockOpts): string;
export declare function getCached(args: { repoId: string; mode: string; focus: string; projectRoot?: string }): Promise<CacheEntry | null>;
export declare function putCached(args: { repoId: string; mode: string; focus: string; prompt: string; projectRoot?: string }): Promise<CacheEntry>;
export declare function listCached(args?: { projectRoot?: string }): Promise<CacheIndexEntry[]>;
export declare function withDedup<T>(key: string, fn: () => Promise<T>): Promise<T>;
export declare const constants: {
    QUICK_REVERSE_FOCUS: string;
    DEEP_REVERSE_FOCUS: string;
    cacheKey: (repoId: string, mode: string, focus: string) => string;
    focusFingerprint: (focus: string) => string;
};
