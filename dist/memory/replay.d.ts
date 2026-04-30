export interface ReplayFrame {
    ts: number;
    sessionId: string;
    tool: string;
    payload: {
        tool_input: unknown;
        tool_response: unknown;
    };
    source: 'replay';
}
export interface ReplayOptions {
    /** Filter to specific tool names. Defaults to the same set the live PostToolUse hook captures. */
    tools?: ReadonlySet<string>;
    /** Cap the number of frames returned. Useful for dry-runs and tests. */
    limit?: number;
}
export declare const DEFAULT_TOOLS: ReadonlySet<string>;
/**
 * Parse a transcript .jsonl content string and return capture frames in chronological order.
 * Bad lines are skipped silently.
 */
export declare function parseTranscript(jsonl: string, sessionId: string, opts?: ReplayOptions): ReplayFrame[];
/**
 * Locate the .jsonl file for a Claude Code session id. If `cwd` is given, search only that
 * encoded project dir; otherwise scan all projects under ~/.claude/projects/.
 */
export declare function locateTranscript(sessionId: string, cwd?: string, home?: string): string | null;
/**
 * List recent transcripts under ~/.claude/projects/ newest-first, with optional cwd filter.
 */
export interface TranscriptInfo {
    sessionId: string;
    path: string;
    encodedCwd: string;
    mtime: number;
    sizeBytes: number;
}
export declare function listTranscripts(opts?: {
    home?: string;
    cwd?: string;
    limit?: number;
}): TranscriptInfo[];
export declare function readTranscript(path: string): string;
//# sourceMappingURL=replay.d.ts.map