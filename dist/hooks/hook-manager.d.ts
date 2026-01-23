/**
 * Hook Manager (Converted from bash hooks)
 * Manages session-start and post-tool-use hooks
 * Cross-platform (Windows, Mac, Linux)
 */
export interface HookContext {
    toolName?: string;
    toolInput?: any;
    sessionId?: string;
    agent?: string;
}
export type HookType = 'session-start' | 'post-tool-use';
export declare class HookManager {
    private stateManager;
    constructor(projectRoot?: string);
    /**
     * Execute session-start hook
     * Injects context at session start
     */
    onSessionStart(): Promise<void>;
    /**
     * Execute post-tool-use hook
     * Captures observations after tool use
     */
    onPostToolUse(context: HookContext): Promise<void>;
    /**
     * Register all hooks
     */
    registerHooks(): Promise<void>;
}
//# sourceMappingURL=hook-manager.d.ts.map