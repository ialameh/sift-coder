#!/usr/bin/env node

/**
 * SiftCoder File Iterator Service
 *
 * Manages sequential file processing with state tracking,
 * auto-checkpointing, and insight accumulation.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { calculateSessionTokens } from './token-monitor.js';

const STATE_DIR = process.env.SIFTCODER_STATE_DIR || '.claude/siftcoder-state';
const ITERATION_STATE_FILE = path.join(STATE_DIR, 'file-iteration.json');
const INSIGHTS_FILE = path.join(STATE_DIR, 'insights.json');

// File iteration state
export interface FileIterationState {
  id: string;
  status: 'in_progress' | 'completed' | 'paused';
  pattern: string;
  goal: string;
  files: {
    total: number;
    processed: string[];
    remaining: string[];
    current: string | null;
  };
  insights: {
    file: string;
    count: number;
  };
  checkpoints: string[];
  started_at: string;
  updated_at: string;
  checkpoint_every_n_files: number;
}

// Insight entry
export interface Insight {
  id: string;
  type: string;
  category?: string;
  quote?: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Initialize new file iteration
 */
export async function initializeIteration(pattern: string, goal: string, checkpointEvery: number = 10): Promise<FileIterationState> {
  try {
    // Ensure state directory exists
    await fs.mkdir(STATE_DIR, { recursive: true });

    // Expand glob pattern to file list
    const files = await expandGlobPattern(pattern);

    if (files.length === 0) {
      throw new Error(`No files found matching pattern: ${pattern}`);
    }

    // Create initial state
    const state: FileIterationState = {
      id: `iter-${Date.now()}`,
      status: 'in_progress',
      pattern,
      goal,
      files: {
        total: files.length,
        processed: [],
        remaining: files,
        current: files[0]
      },
      insights: {
        file: INSIGHTS_FILE,
        count: 0
      },
      checkpoints: [],
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      checkpoint_every_n_files: checkpointEvery
    };

    // Initialize insights file
    await fs.writeFile(INSIGHTS_FILE, JSON.stringify({
      goal,
      files_analyzed: 0,
      insights: [],
      patterns: [],
      started_at: state.started_at
    }, null, 2), 'utf-8');

    // Save state
    await saveState(state);

    console.error(`✓ File iteration initialized: ${files.length} files`);
    console.error(`  Pattern: ${pattern}`);
    console.error(`  Goal: ${goal}`);
    console.error(`  Checkpoint every: ${checkpointEvery} files`);

    return state;
  } catch (error: any) {
    console.error(`✗ Failed to initialize iteration: ${error.message}`);
    throw error;
  }
}

/**
 * Load existing iteration state
 */
export async function loadState(): Promise<FileIterationState | null> {
  try {
    const content = await fs.readFile(ITERATION_STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Save iteration state
 */
export async function saveState(state: FileIterationState): Promise<void> {
  state.updated_at = new Date().toISOString();
  await fs.writeFile(ITERATION_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * Mark file as processed and move to next
 */
export async function advanceToNextFile(state: FileIterationState): Promise<FileIterationState> {
  if (state.files.current) {
    state.files.processed.push(state.files.current);
  }

  state.files.remaining = state.files.remaining.slice(1);
  state.files.current = state.files.remaining[0] || null;

  if (state.files.remaining.length === 0) {
    state.status = 'completed';
  }

  await saveState(state);
  return state;
}

/**
 * Add insight to accumulated insights
 */
export async function addInsight(insight: Insight): Promise<void> {
  try {
    // Load existing insights
    const content = await fs.readFile(INSIGHTS_FILE, 'utf-8');
    const data = JSON.parse(content);

    // Add new insight
    data.insights.push(insight);
    data.files_analyzed = data.insights.reduce((count: number, ins: Insight) => {
      return count + (data.insights.filter((i: Insight) => i.source === ins.source).length > 0 ? 1 : 0);
    }, 0);

    // Save updated insights
    await fs.writeFile(INSIGHTS_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // Update state
    const state = await loadState();
    if (state) {
      state.insights.count = data.insights.length;
      await saveState(state);
    }
  } catch (error: any) {
    console.error(`✗ Failed to add insight: ${error.message}`);
    throw error;
  }
}

/**
 * Check if checkpoint is needed
 */
export async function shouldCheckpoint(state: FileIterationState): Promise<boolean> {
  // Check file count threshold
  const filesProcessed = state.files.processed.length;
  const fileThresholdMet = filesProcessed > 0 && filesProcessed % state.checkpoint_every_n_files === 0;

  // Check token threshold
  const tokenUsage = await calculateSessionTokens();
  const tokenThresholdMet = tokenUsage.status === 'checkpoint' || tokenUsage.status === 'critical';

  return fileThresholdMet || tokenThresholdMet;
}

/**
 * Create checkpoint for current iteration state
 */
export async function createIterationCheckpoint(state: FileIterationState, reason: string = 'periodic'): Promise<string> {
  const checkpointName = `${state.id}-${state.files.processed.length}`;

  // Add to state's checkpoint list
  state.checkpoints.push(checkpointName);
  await saveState(state);

  console.error(`✓ Iteration checkpoint created: ${checkpointName}`);
  console.error(`  Reason: ${reason}`);
  console.error(`  Progress: ${state.files.processed.length}/${state.files.total} files`);

  return checkpointName;
}

/**
 * Expand glob pattern to list of files
 */
async function expandGlobPattern(pattern: string): Promise<string[]> {
  try {
    // Use find command to expand glob pattern
    const projectRoot = process.cwd();
    const command = `find ${projectRoot} -path "${pattern}" -type f 2>/dev/null`;
    const output = execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });

    const files = output
      .trim()
      .split('\n')
      .filter(f => f.trim() !== '')
      .sort();

    return files;
  } catch (error: any) {
    // Fallback to simple glob using ls
    try {
      const output = execSync(`ls ${pattern} 2>/dev/null`, { encoding: 'utf-8' });
      return output.trim().split('\n').filter(f => f.trim() !== '');
    } catch {
      return [];
    }
  }
}

/**
 * Resume iteration from saved state
 */
export async function resumeIteration(): Promise<FileIterationState | null> {
  const state = await loadState();

  if (!state) {
    console.error('No active iteration to resume');
    return null;
  }

  if (state.status === 'completed') {
    console.error('Iteration already completed');
    return state;
  }

  console.error(`✓ Resuming iteration: ${state.id}`);
  console.error(`  Progress: ${state.files.processed.length}/${state.files.total} files`);
  console.error(`  Current: ${state.files.current}`);
  console.error(`  Insights: ${state.insights.count}`);

  return state;
}

/**
 * Pause current iteration
 */
export async function pauseIteration(): Promise<void> {
  const state = await loadState();

  if (!state) {
    throw new Error('No active iteration to pause');
  }

  state.status = 'paused';
  await saveState(state);

  console.error(`✓ Iteration paused`);
  console.error(`  Progress: ${state.files.processed.length}/${state.files.total} files`);
}

/**
 * Get iteration progress summary
 */
export async function getProgress(): Promise<string> {
  const state = await loadState();

  if (!state) {
    return 'No active file iteration';
  }

  const percent = Math.round((state.files.processed.length / state.files.total) * 100);
  const bar = createProgressBar(percent);

  return `
📄 File Iteration: ${state.status.toUpperCase()}

Goal: ${state.goal}
Pattern: ${state.pattern}

Progress: ${state.files.processed.length}/${state.files.total} files (${percent}%)
${bar}

Current: ${state.files.current || 'None'}
Insights: ${state.insights.count}
Checkpoints: ${state.checkpoints.length}

Started: ${new Date(state.started_at).toLocaleString()}
Updated: ${new Date(state.updated_at).toLocaleString()}
`.trim();
}

/**
 * Create progress bar
 */
function createProgressBar(percent: number, width: number = 40): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percent}%`;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'init': {
      const pattern = process.argv[3];
      const goal = process.argv[4] || 'Extract insights';
      const checkpointEvery = parseInt(process.argv[5] || '10', 10);

      if (!pattern) {
        console.error('Usage: file-iterator.ts init <pattern> [goal] [checkpoint-every]');
        process.exit(1);
      }

      await initializeIteration(pattern, goal, checkpointEvery);
      break;
    }

    case 'resume': {
      const state = await resumeIteration();
      if (!state) {
        process.exit(1);
      }
      break;
    }

    case 'pause': {
      await pauseIteration();
      break;
    }

    case 'progress': {
      const progress = await getProgress();
      console.log(progress);
      break;
    }

    case 'next': {
      const state = await loadState();
      if (!state) {
        console.error('No active iteration');
        process.exit(1);
      }
      const updated = await advanceToNextFile(state);
      console.error(`✓ Advanced to: ${updated.files.current}`);
      break;
    }

    default:
      console.error(`
Usage: file-iterator.ts <command> [arguments]

Commands:
  init <pattern> [goal] [checkpoint-every]  Initialize file iteration
  resume                                     Resume paused iteration
  pause                                      Pause current iteration
  progress                                   Show iteration progress
  next                                       Advance to next file

Examples:
  node services/file-iterator.ts init "transcripts/*.txt" "Extract pain points" 10
  node services/file-iterator.ts resume
  node services/file-iterator.ts progress
      `);
      process.exit(1);
  }
}
