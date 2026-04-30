/**
 * Snapshot-style TUI renderer for the memory store.
 * Pure function: takes a Storage handle, returns an ANSI-rendered string.
 * No interactive event loop — invokers wrap this in setInterval if they want a live dashboard.
 */
import type { Storage } from './storage/storage.js';
export interface WatchOptions {
    limit?: number;
    width?: number;
}
export declare function renderWatchSnapshot(storage: Storage, opts?: WatchOptions): string;
//# sourceMappingURL=tui.d.ts.map