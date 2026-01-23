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

// Find plugin root directory (where package.json is)
function findPluginRoot(startDir) {
  let currentDir = startDir;
  const rootCheckLimit = 10; // Prevent infinite loops
  let checks = 0;

  while (currentDir !== dirname(currentDir) && checks < rootCheckLimit) {
    if (existsSync(join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
    checks++;
  }
  return null;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || findPluginRoot(__dirname);
const STATE_DIR = join(PROJECT_ROOT, '.claude', 'siftcoder-state');
const OBSERVATION_LOGGER = join(PLUGIN_ROOT, 'dist', 'services', 'observation-logger.js');

// Suppress normal output, only log errors
process.stderr.write = () => {};

async function main() {
  // Find plugin root if not set
  if (!process.env.CLAUDE_PLUGIN_ROOT) {
    const foundRoot = findPluginRoot(__dirname);
    if (!foundRoot) {
      process.exit(0); // Silent exit if plugin root not found
    }
    process.env.CLAUDE_PLUGIN_ROOT = foundRoot;
  }

  // Get tool information from stdin
  const toolInput = await readStdin();

  // Skip observation capture if logger service doesn't exist
  const observationLoggerPath = join(process.env.CLAUDE_PLUGIN_ROOT, 'dist', 'services', 'observation-logger.js');
  if (!existsSync(observationLoggerPath)) {
    process.exit(0); // Continue without observation capture
  }

  // Extract tool name from first argument or environment
  const toolName = process.argv[2] || process.env.TOOL_NAME || '';
  const toolInputStr = toolInput || '';

  // Capture observation for relevant tools
  const relevantTools = ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'];

  if (relevantTools.includes(toolName)) {
    try {
      execSync(`node "${observationLoggerPath}" log "${toolName}" "Tool executed: ${toolName}"`, {
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

async function readStdin() {
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
