/**
 * Token counting + budget tracking. Replaces V1's token-counter + token-monitor + token-monitor-v2 (3 files of overlap).
 */

import { encode } from 'gpt-tokenizer';

export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch {
    return Math.ceil(text.length / 4);
  }
}

export function approximate(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function countPayload(payload: unknown): number {
  if (payload === null || payload === undefined) return 0;
  if (typeof payload === 'string') return countTokens(payload);
  return countTokens(JSON.stringify(payload));
}

export interface BudgetState {
  limit: number;
  used: number;
  remaining: number;
  pctUsed: number;
}

export class Budget {
  private used = 0;

  constructor(public readonly limit: number) {}

  consume(text: string): BudgetState {
    this.used += countTokens(text);
    return this.state();
  }

  reset(): void {
    this.used = 0;
  }

  state(): BudgetState {
    const remaining = Math.max(0, this.limit - this.used);
    const pctUsed = this.limit > 0 ? this.used / this.limit : 0;
    return { limit: this.limit, used: this.used, remaining, pctUsed };
  }

  withinBudget(text: string): boolean {
    return this.used + countTokens(text) <= this.limit;
  }
}
