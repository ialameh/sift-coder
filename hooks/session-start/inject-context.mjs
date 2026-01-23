#!/usr/bin/env node
/**
 * SiftCoder SessionStart Hook
 *
 * Injects multi-agent context from previous sessions at session start.
 *
 * SiftCoder Flavor:
 * - Multi-agent summaries (what each agent learned)
 * - Quality trends (improving/regressing)
 * - Workflow state (phase, iteration, next action)
 * - Boundary state (modifiable/protected files)
 * - Token economics (efficiency, discovery tokens)
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STATE_DIR = join(PROJECT_ROOT, '.claude', 'siftcoder-state');
const CONTEXT_SERVICE = join(PROJECT_ROOT, 'services', 'context-builder.ts');

// Find plugin root directory (where package.json is)
function findPluginRoot(startDir) {
  let currentDir = startDir;
  while (currentDir !== dirname(currentDir)) {
    if (existsSync(join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }
  return null;
}

// Ensure dependencies are installed
function ensureDependencies(pluginRoot) {
  if (!pluginRoot) {
    return false;
  }

  const nodeModulesPath = join(pluginRoot, 'node_modules');
  const packageJsonPath = join(pluginRoot, 'package.json');

  // Check if node_modules exists
  if (!existsSync(nodeModulesPath)) {
    try {
      // Run npm install silently
      execSync('npm install --ignore-scripts --no-audit --no-fund', {
        cwd: pluginRoot,
        stdio: 'ignore'
      });
      return true;
    } catch (error) {
      // Failed to install, but continue anyway
      return false;
    }
  }

  return false;
}

// Suppress normal echo, only output context
process.stderr.write = () => {};

async function main() {
  // Check if context builder service exists
  if (!existsSync(CONTEXT_SERVICE)) {
    // Fallback: simple context injection without service
    const sessionFile = join(STATE_DIR, 'session.json');
    if (existsSync(sessionFile)) {
      try {
        const sessionContent = readFileSync(sessionFile, 'utf-8');
        const lastSession = JSON.parse(sessionContent);
        console.log('## 🔄 SiftCoder Session Continuation');
        console.log('');
        console.log('### Previous Session');
        console.log(`- Session: ${lastSession.id}`);
        console.log(`- Phase: ${lastSession.workflow_phase}`);
        console.log(`- Agent: ${lastSession.agent}`);
        console.log(`- Feature: ${lastSession.feature}`);
        console.log(`- Subtask: ${lastSession.subtask}`);
        console.log('');
      } catch (error) {
        // Session file exists but failed to parse
      }
    }
    process.exit(0);
  }

  // Use context builder service
  try {
    execSync(`tsx "${CONTEXT_SERVICE}" inject-context`, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit'
    });
  } catch (error) {
    // Context builder failed, but allow session to continue
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
