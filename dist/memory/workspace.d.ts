export interface WorkspacePaths {
    key: string;
    root: string;
    db: string;
    wal: string;
    pid: string;
    socket: string;
    log: string;
}
export declare function gitToplevel(cwd: string): string | null;
export declare function workspaceKey(cwd: string): string;
export declare function workspacePaths(cwd: string, home?: string): WorkspacePaths;
export declare function ensureWorkspaceDirs(paths: WorkspacePaths): void;
//# sourceMappingURL=workspace.d.ts.map