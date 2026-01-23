#!/usr/bin/env node

/**
 * SiftCoder Token Monitor Service
 *
 * Monitors context usage and triggers auto-checkpoints before hitting limits.
 * Prevents context overflow and ensures work isn't lost on long-running sessions.
 */

import fs from 'fs/promises';
import path from 'path';
import { encode } from 'gpt-tokenizer';

const STATE_DIR = process.env.SIFTCODER_STATE_DIR || '.claude/siftcoder-state';

// Token thresholds (for 200k context window)
interface TokenThresholds {
  warn: number;      // 80% - log warning
  checkpoint: number; // 90% - auto-checkpoint
  critical: number;   // 95% - force checkpoint + pause
}

const THRESHOLDS: TokenThresholds = {
  warn: 160_000,      // 80% of 200k
  checkpoint: 180_000, // 90%
  critical: 190_000    // 95%
};

// Token status levels
export type TokenStatus = 'ok' | 'warn' | 'checkpoint' | 'critical';

// Token usage data
export interface TokenUsage {
  tokens: number;
  characters: number;
  method: 'exact' | 'estimate';
  status: TokenStatus;
  threshold_percent: number;
  recommendation: string;
}

/**
 * Count tokens using gpt-tokenizer library (Node.js)
 * Uses cl100k_base encoding (compatible with Claude/GPT-4)
 */
export function countTokens(text: string): { tokens: number; method: string; characters: number } {
  try {
    // Use gpt-tokenizer for accurate counting
    const tokens = encode(text);
    return {
      tokens: tokens.length,
      method: 'exact',
      characters: text.length
    };
  } catch (error: any) {
    // Fallback to fast estimation if tokenizer fails
    console.error(`⚠️  Token counter failed, using estimation: ${error.message}`);
    return estimateTokens(text);
  }
}

/**
 * Fast token estimation (fallback)
 * 1 token ≈ 3.5 characters for code/mixed content
 */
export function estimateTokens(text: string): { tokens: number; method: string; characters: number } {
  const tokens = Math.ceil(text.length / 3.5);
  return {
    tokens,
    method: 'estimate',
    characters: text.length
  };
}

/**
 * Calculate session tokens from all relevant state files
 */
export async function calculateSessionTokens(): Promise<TokenUsage> {
  try {
    let totalText = '';

    // Files to include in token count
    const filesToCount = [
      path.join(STATE_DIR, 'implementation-log.jsonl'),
      path.join(STATE_DIR, 'session.json'),
      path.join(STATE_DIR, 'current-task.json'),
      path.join(STATE_DIR, 'boundaries.json'),
      path.join(STATE_DIR, 'file-iteration.json')
    ];

    // Read all files
    for (const file of filesToCount) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        totalText += content + '\n';
      } catch {
        // File doesn't exist, skip
      }
    }

    // Count tokens (now synchronous using gpt-tokenizer)
    const { tokens, method, characters } = countTokens(totalText);

    // Determine status
    const status = checkTokenStatus(tokens);
    const thresholdPercent = Math.round((tokens / 200_000) * 100);

    // Generate recommendation
    let recommendation = '';
    switch (status) {
      case 'ok':
        recommendation = 'Context usage is healthy';
        break;
      case 'warn':
        recommendation = 'Consider creating a checkpoint soon';
        break;
      case 'checkpoint':
        recommendation = 'Auto-checkpoint should be triggered';
        break;
      case 'critical':
        recommendation = 'IMMEDIATE checkpoint required - approaching context limit';
        break;
    }

    return {
      tokens,
      characters,
      method: method as 'exact' | 'estimate',
      status,
      threshold_percent: thresholdPercent,
      recommendation
    };
  } catch (error: any) {
    console.error(`✗ Failed to calculate session tokens: ${error.message}`);
    throw error;
  }
}

/**
 * Check token status against thresholds
 */
export function checkTokenStatus(tokens: number): TokenStatus {
  if (tokens >= THRESHOLDS.critical) return 'critical';
  if (tokens >= THRESHOLDS.checkpoint) return 'checkpoint';
  if (tokens >= THRESHOLDS.warn) return 'warn';
  return 'ok';
}

/**
 * Get recommended action based on token usage
 */
export function getRecommendedAction(status: TokenStatus): string {
  switch (status) {
    case 'critical':
      return 'auto-checkpoint-critical';
    case 'checkpoint':
      return 'auto-checkpoint';
    case 'warn':
      return 'log-warning';
    default:
      return 'continue';
  }
}

/**
 * Format token usage for display
 */
export function formatTokenUsage(usage: TokenUsage): string {
  const bar = createProgressBar(usage.threshold_percent);
  return `
Token Usage: ${usage.tokens.toLocaleString()} tokens (${usage.threshold_percent}%)
Method: ${usage.method}
Status: ${usage.status.toUpperCase()}
${bar}
${usage.recommendation}
`.trim();
}

/**
 * Create progress bar for token usage
 */
function createProgressBar(percent: number, width: number = 40): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  let bar = '';
  let color = '';

  if (percent >= 95) {
    color = '🔴'; // Critical
  } else if (percent >= 90) {
    color = '🟠'; // Checkpoint
  } else if (percent >= 80) {
    color = '🟡'; // Warning
  } else {
    color = '🟢'; // OK
  }

  bar = color + ' ' + '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`;
  return bar;
}

/**
 * Check if checkpoint is needed based on current token usage
 */
export async function shouldCheckpoint(): Promise<{ needed: boolean; reason: string; usage: TokenUsage }> {
  const usage = await calculateSessionTokens();

  if (usage.status === 'critical' || usage.status === 'checkpoint') {
    return {
      needed: true,
      reason: usage.status === 'critical' ? 'Critical threshold exceeded' : 'Checkpoint threshold exceeded',
      usage
    };
  }

  return {
    needed: false,
    reason: 'Token usage within acceptable range',
    usage
  };
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'check': {
      const usage = await calculateSessionTokens();
      console.log(formatTokenUsage(usage));
      process.exit(0);
    }

    case 'should-checkpoint': {
      const { needed, reason, usage } = await shouldCheckpoint();
      console.log(JSON.stringify({ needed, reason, usage }, null, 2));
      process.exit(needed ? 0 : 1);
    }

    case 'count': {
      const text = process.argv[3];
      if (!text) {
        console.error('Usage: token-monitor.ts count <text>');
        process.exit(1);
      }
      const result = countTokens(text);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.error(`
Usage: token-monitor.ts <command> [arguments]

Commands:
  check                  Check current session token usage
  should-checkpoint      Determine if checkpoint is needed
  count <text>           Count tokens in text

Examples:
  node services/token-monitor.ts check
  node services/token-monitor.ts should-checkpoint
  node services/token-monitor.ts count "Hello world"
      `);
      process.exit(1);
  }
}
