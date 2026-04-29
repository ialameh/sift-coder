export interface TreeItem {
    path: string;
    type: 'tree' | 'blob';
}
export interface FormatOpts {
    depth?: number;
    includePaths?: string[];
    excludePaths?: string[];
    maxEntries?: number;
    rootLabel?: string;
    maxDepth?: number;
}
export declare function formatLocalTree(rootPath: string, opts?: FormatOpts): string;
export declare function formatPathList(items: TreeItem[], opts?: FormatOpts): string;
