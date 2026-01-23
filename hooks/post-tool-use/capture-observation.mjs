#!/usr/bin/env node
/**
 * SiftCoder PostToolUse Hook - Observation Capture
 *
 * Captures structured observations after each tool use.
 *
 * SiftCoder Flavor:
 * - Agent attribution (which agent performed action)
 * - Workflow context (feature, subtask, phase)
 * - Learning extraction (concepts, facts, gotchas)
 * - Safety verification (boundaries, blast radius)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE_DIR = join(PROJECT_ROOT, '.claude', 'siftcoder-state');
const OBSERVATION_LOGGER = join(PROJECT_ROOT, 'services', 'observation-logger.ts');

// Suppress normal output, only log errors
process.stderr.write = () => {};

async function main() {
  // Get tool information from stdin
  const toolInput = await readStdin();

  // Skip observation capture if logger service doesn't exist
  if (!existsSync(OBSERVATION_LOGGER)) {
    process.exit(0); // Continue without observation capture
  }

  // Extract tool name from first argument or environment
  const toolName = process.argv[2] || process.env.TOOL_NAME || '';
  const toolInputStr = toolInput || '';

  // Capture observation for relevant tools
  const relevantTools = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'];

  if (relevantTools.includes(toolName)) {
    try {
      execSync(`node "${OBSERVATION_LOGGER}" log "${toolName}" "Tool executed: ${toolName}"`, {
        cwd: PROJECT_ROOT,
        stdio: 'pipe'
      });
    } catch (error) {
      // Observation logging failed, but don't block tool execution
    }
  }

  // Always allow tool execution to continue
  process.exit(0);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    // Timeout if no input
    setTimeout(() => resolve(''), 100);
  });
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
