import type { Storage } from './storage/storage.js';
import type { GoldenItem } from './eval.js';
export interface MineOptions {
    termsPerQuery?: number;
    maxItems?: number;
    minSummaryTokens?: number;
}
export declare function mineGolden(storage: Storage, opts?: MineOptions): GoldenItem[];
//# sourceMappingURL=eval-mine.d.ts.map