#!/usr/bin/env node
/**
 * SiftCoder PostToolUse Hook - Strategic Compaction Suggestions
 *
 * Suggests /compact at strategic intervals to maintain conversation health.
 * Tracks tool call count and provides timely suggestions.
 *
 * SiftCoder Flavor:
 * - Cross-platform path handling
 * - Session-aware tracking (uses CLAUDE_SESSION_ID)
 * - Non-intrusive suggestions
 * - Minimal performance overhead
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Configuration
const THRESHOLD = 50; // First suggestion at 50 tool calls
const SUBSEQUENT_INTERVAL = 25; // Subsequent suggestions every 25 calls

/**
 * Get session ID from environment
 */
function getSessionId() {
  return process.env.CLAUDE_SESSION_ID ||
         process.env.CLAUDE_SESSION_UUID ||
         process.ppid ||
         'default';
}

/**
 * Get counter file path
 */
function getCounterFile() {
  const sessionId = getSessionId();
  return join(homedir(), '.claude', `tool-count-${sessionId}`);
}

/**
 * Ensure directory exists
 */
function ensureDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Read current counter value
 */
function readCounter() {
  try {
    const counterFile = getCounterFile();
    if (existsSync(counterFile)) {
      const content = readFileSync(counterFile, 'utf-8');
      return parseInt(content, 10) || 0;
    }
  } catch (error) {
    // Return 0 on error
  }
  return 0;
}

/**
 * Write counter value
 */
function writeCounter(count) {
  try {
    const counterFile = getCounterFile();
    ensureDir(counterFile);
    writeFileSync(counterFile, count.toString());
  } catch (error) {
    // Silently skip write errors
  }
}

/**
 * Main hook function
 */
async function main() {
  // Only track certain tools (not every tool)
  const trackedTools = ['Write', 'Edit', 'Bash', 'Read'];
  const toolName = process.argv[2] || process.env.TOOL_NAME || '';

  if (!trackedTools.includes(toolName)) {
    process.exit(0);
  }

  // Increment counter
  const count = readCounter() + 1;
  writeCounter(count);

  // Check if we should suggest compaction
  const shouldSuggest =
    count === THRESHOLD ||
    (count > THRESHOLD && count % SUBSEQUENT_INTERVAL === 0);

  if (shouldSuggest) {
    console.log(`\n📊 [StrategicCompact] ${count} tool calls - consider /compact to free memory\n`);
  }

  process.exit(0);
}

main().catch(error => {
  // Silent failure - don't break the tool execution
  process.exit(0);
});
