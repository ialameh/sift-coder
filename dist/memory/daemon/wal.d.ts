export interface WalEntry {
    ts: number;
    sessionId: string;
    tool: string;
    inputHash: string;
    payload: unknown;
}
export declare class WAL {
    private readonly path;
    private readonly fsync;
    private fd;
    constructor(path: string, fsync?: boolean);
    open(): void;
    append(entry: WalEntry): void;
    close(): void;
    static replay(path: string): WalEntry[];
}
//# sourceMappingURL=wal.d.ts.map