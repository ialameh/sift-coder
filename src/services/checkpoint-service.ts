#!/usr/bin/env node

/**
 * SiftCoder Checkpoint Service
 *
 * Manages checkpoint CRUD operations with schema validation,
 * multi-agent state tracking, and query capabilities.
 *
 * SiftCoder Flavor:
 * - Multi-agent state snapshots
 * - Quality gate result tracking
 * - Boundary state management
 * - Token economics calculation
 * - Feature queue persistence
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = process.env.SIFTCODER_STATE_DIR || '.claude/siftcoder-state';
const CHECKPOINT_DIR = path.join(STATE_DIR, 'checkpoints');

// Checkpoint data structure
interface CheckpointData {
  name: string;
  workflow_phase: 'PLANNING' | 'CODING' | 'QA' | 'DONE';
  iteration?: number;
  agent: string;
  project_root: string;
  features: {
    completed: string[];
    in_progress: string[];
    pending: string[];
  };
  quality_results: {
    format: { status: string; files_checked?: number; time_ms?: number };
    lint: { status: string; errors?: number; warnings?: number; time_ms?: number };
    type_check: { status: string; files_checked?: number; time_ms?: number };
  };
  boundaries: {
    modifiable: string[];
    protected: string[];
    blast_radius_verified: boolean;
    last_check?: string;
  };
  token_economics: {
    session_tokens: number;
    discovery_tokens: number;
    efficiency: string;
    patterns_learned?: number;
  };
  file_iteration?: {
    pattern: string;
    total_files: number;
    processed_files: number;
    current_file: string;
    insights_accumulated: number;
    started_at: string;
  };
  metadata?: {
    observations?: number;
    knowledge_entries?: number;
    description?: string;
    tags?: string[];
  };
}

// Query filters
interface CheckpointFilters {
  agent?: string;
  phase?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}

// Validation result
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate checkpoint data against schema
 */
async function validateCheckpoint(data: any, name?: string): Promise<ValidationResult> {
  const errors: string[] = [];

  // Basic structure validation
  if (name && typeof name !== 'string') {
    errors.push('Checkpoint name is required and must be a string');
  }

  if (!data.workflow_phase || !['PLANNING', 'CODING', 'QA', 'DONE'].includes(data.workflow_phase)) {
    errors.push('workflow_phase must be one of: PLANNING, CODING, QA, DONE');
  }

  if (!data.agent || typeof data.agent !== 'string') {
    errors.push('Agent is required and must be a string');
  }

  // Features validation
  if (!data.features || typeof data.features !== 'object') {
    errors.push('Features object is required');
  } else {
    if (!Array.isArray(data.features.completed)) {
      errors.push('features.completed must be an array');
    }
    if (!Array.isArray(data.features.in_progress)) {
      errors.push('features.in_progress must be an array');
    }
    if (!Array.isArray(data.features.pending)) {
      errors.push('features.pending must be an array');
    }
  }

  // Quality results validation
  if (!data.quality_results || typeof data.quality_results !== 'object') {
    errors.push('Quality results object is required');
  } else {
    const requiredGates = ['format', 'lint', 'type_check'];
    for (const gate of requiredGates) {
      if (!data.quality_results[gate]) {
        errors.push(`Quality gate '${gate}' is required`);
      } else if (!data.quality_results[gate].status) {
        errors.push(`Quality gate '${gate}.status' is required`);
      }
    }
  }

  // Boundaries validation
  if (!data.boundaries || typeof data.boundaries !== 'object') {
    errors.push('Boundaries object is required');
  } else {
    if (!Array.isArray(data.boundaries.modifiable)) {
      errors.push('boundaries.modifiable must be an array');
    }
    if (!Array.isArray(data.boundaries.protected)) {
      errors.push('boundaries.protected must be an array');
    }
    if (typeof data.boundaries.blast_radius_verified !== 'boolean') {
      errors.push('boundaries.blast_radius_verified must be a boolean');
    }
  }

  // Token economics validation
  if (!data.token_economics || typeof data.token_economics !== 'object') {
    errors.push('Token economics object is required');
  } else {
    if (typeof data.token_economics.session_tokens !== 'number') {
      errors.push('token_economics.session_tokens must be a number');
    }
    if (typeof data.token_economics.discovery_tokens !== 'number') {
      errors.push('token_economics.discovery_tokens must be a number');
    }
    if (!data.token_economics.efficiency || !/^\d+\.\d+%$/.test(data.token_economics.efficiency)) {
      errors.push('token_economics.efficiency must be a string matching X.Y% format');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Ensure checkpoint directory exists
 */
async function ensureCheckpointDir(): Promise<void> {
  try {
    await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

/**
 * Capture file iteration state if active
 */
async function captureFileIterationState(): Promise<CheckpointData['file_iteration'] | undefined> {
  const iterationStatePath = path.join(STATE_DIR, 'file-iteration.json');

  try {
    const content = await fs.readFile(iterationStatePath, 'utf-8');
    const state = JSON.parse(content);

    if (state.status === 'in_progress' || state.status === 'paused') {
      return {
        pattern: state.pattern,
        total_files: state.files.total,
        processed_files: state.files.processed.length,
        current_file: state.files.current,
        insights_accumulated: state.insights.count,
        started_at: state.started_at
      };
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error(`⚠️  Failed to capture file iteration state: ${error.message}`);
    }
  }

  return undefined;
}

/**
 * Save checkpoint with validation
 */
export async function saveCheckpoint(name: string, data: CheckpointData): Promise<boolean> {
  try {
    // Validate input
    const validation = await validateCheckpoint(data, name);
    if (!validation.valid) {
      throw new Error(`Invalid checkpoint data:\n  - ${validation.errors.join('\n  - ')}`);
    }

    // Ensure directory exists
    await ensureCheckpointDir();

    // Capture file iteration state if not provided
    if (!data.file_iteration) {
      data.file_iteration = await captureFileIterationState();
    }

    // Add metadata
    const checkpoint = {
      version: '1.0.0',
      created_at: new Date().toISOString(),
      ...data,
      checkpoint_name: name
    };

    // Write checkpoint file
    const filepath = path.join(CHECKPOINT_DIR, `${name}.json`);
    await fs.writeFile(filepath, JSON.stringify(checkpoint, null, 2), 'utf-8');

    // Update index
    await updateIndex(checkpoint);

    console.error(`✓ Checkpoint saved: ${name}`);
    return true;
  } catch (error: any) {
    console.error(`✗ Failed to save checkpoint: ${error.message}`);
    throw error;
  }
}

/**
 * Load checkpoint with validation
 */
export async function loadCheckpoint(name: string): Promise<any> {
  try {
    const filepath = path.join(CHECKPOINT_DIR, `${name}.json`);
    const content = await fs.readFile(filepath, 'utf-8');
    const checkpoint = JSON.parse(content);

    // Validate loaded checkpoint
    const validation = await validateCheckpoint(checkpoint);
    if (!validation.valid) {
      throw new Error(`Corrupt checkpoint: ${validation.errors.join(', ')}`);
    }

    return checkpoint;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Checkpoint not found: ${name}`);
    }
    throw error;
  }
}

/**
 * Restore file iteration state from checkpoint
 */
async function restoreFileIterationState(fileIteration: CheckpointData['file_iteration']): Promise<void> {
  if (!fileIteration) return;

  const iterationStatePath = path.join(STATE_DIR, 'file-iteration.json');

  try {
    // Load current state to preserve file lists
    const currentContent = await fs.readFile(iterationStatePath, 'utf-8');
    const currentState = JSON.parse(currentContent);

    // Update state with checkpoint data
    currentState.files.processed = currentState.files.processed.slice(0, fileIteration.processed_files);
    currentState.files.current = fileIteration.current_file;
    currentState.files.remaining = currentState.files.list.slice(fileIteration.processed_files);
    currentState.insights.count = fileIteration.insights_accumulated;
    currentState.status = 'paused'; // Pause until user resumes

    await fs.writeFile(iterationStatePath, JSON.stringify(currentState, null, 2), 'utf-8');

    console.error(`  - File Iteration: ${fileIteration.processed_files}/${fileIteration.total_files} files`);
  } catch (error: any) {
    console.error(`⚠️  Failed to restore file iteration state: ${error.message}`);
  }
}

/**
 * Restore checkpoint - loads and applies state
 */
export async function restoreCheckpoint(name: string): Promise<void> {
  try {
    const checkpoint = await loadCheckpoint(name);

    // Restore to current-task.json
    const taskPath = path.join(STATE_DIR, 'current-task.json');
    if (checkpoint.features.in_progress && checkpoint.features.in_progress.length > 0) {
      await fs.writeFile(taskPath, JSON.stringify({
        current_task: checkpoint.features.in_progress[0],
        workflow_phase: checkpoint.workflow_phase,
        iteration: checkpoint.iteration,
        agent: checkpoint.agent,
        restored_from: name,
        restored_at: new Date().toISOString()
      }, null, 2), 'utf-8');
    }

    // Restore boundaries
    const boundariesPath = path.join(STATE_DIR, 'boundaries.json');
    await fs.writeFile(boundariesPath, JSON.stringify({
      modifiable: checkpoint.boundaries.modifiable,
      protected: checkpoint.boundaries.protected,
      restored_from: name,
      restored_at: new Date().toISOString()
    }, null, 2), 'utf-8');

    // Restore file iteration if present
    if (checkpoint.file_iteration) {
      await restoreFileIterationState(checkpoint.file_iteration);
    }

    console.error(`✓ Checkpoint restored: ${name}`);
    console.error(`  - Phase: ${checkpoint.workflow_phase}`);
    console.error(`  - Agent: ${checkpoint.agent}`);
    console.error(`  - Iteration: ${checkpoint.iteration}`);
    console.error(`  - Completed: ${checkpoint.features.completed.length}`);
    console.error(`  - In Progress: ${checkpoint.features.in_progress.length}`);
    console.error(`  - Pending: ${checkpoint.features.pending.length}`);
  } catch (error: any) {
    console.error(`✗ Failed to restore checkpoint: ${error.message}`);
    throw error;
  }
}

/**
 * List checkpoints with optional filters
 */
export async function listCheckpoints(filters?: CheckpointFilters): Promise<any[]> {
  try {
    await ensureCheckpointDir();
    const files = await fs.readdir(CHECKPOINT_DIR);
    const checkpointFiles = files.filter(f => f.endsWith('.json'));

    let checkpoints = [];
    for (const file of checkpointFiles) {
      const filepath = path.join(CHECKPOINT_DIR, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const checkpoint = JSON.parse(content);
      checkpoints.push(checkpoint);
    }

    // Sort by created_at descending
    checkpoints.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply filters
    if (filters?.agent) {
      checkpoints = checkpoints.filter(cp => cp.agent === filters.agent);
    }
    if (filters?.phase) {
      checkpoints = checkpoints.filter(cp => cp.workflow_phase === filters.phase);
    }
    if (filters?.since) {
      checkpoints = checkpoints.filter(cp => new Date(cp.created_at) >= filters.since);
    }
    if (filters?.until) {
      checkpoints = checkpoints.filter(cp => new Date(cp.created_at) <= filters.until);
    }
    if (filters?.limit) {
      checkpoints = checkpoints.slice(0, filters.limit);
    }

    return checkpoints;
  } catch (error: any) {
    console.error(`✗ Failed to list checkpoints: ${error.message}`);
    throw error;
  }
}

/**
 * Update checkpoint index
 */
async function updateIndex(checkpoint: any): Promise<void> {
  const indexPath = path.join(CHECKPOINT_DIR, 'index.jsonl');
  const indexEntry = {
    name: checkpoint.name,
    created_at: checkpoint.created_at,
    workflow_phase: checkpoint.workflow_phase,
    agent: checkpoint.agent,
    features_completed: checkpoint.features.completed.length,
    features_in_progress: checkpoint.features.in_progress.length,
    features_pending: checkpoint.features.pending.length
  };

  await fs.appendFile(indexPath, JSON.stringify(indexEntry) + '\n', 'utf-8');
}

/**
 * Delete checkpoint
 */
export async function deleteCheckpoint(name: string): Promise<boolean> {
  try {
    const filepath = path.join(CHECKPOINT_DIR, `${name}.json`);
    await fs.unlink(filepath);
    console.error(`✓ Checkpoint deleted: ${name}`);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Checkpoint not found: ${name}`);
    }
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'save': {
      const name = args[0];
      const dataFile = args[1];
      if (!name || !dataFile) {
        console.error('Usage: checkpoint-service.ts save <name> <data.json>');
        process.exit(1);
      }
      const data = JSON.parse(await fs.readFile(dataFile, 'utf-8'));
      await saveCheckpoint(name, data);
      break;
    }

    case 'restore': {
      const name = args[0];
      if (!name) {
        console.error('Usage: checkpoint-service.ts restore <name>');
        process.exit(1);
      }
      await restoreCheckpoint(name);
      break;
    }

    case 'list': {
      const filters: any = {};
      if (args.includes('--agent')) {
        filters.agent = args[args.indexOf('--agent') + 1];
      }
      if (args.includes('--phase')) {
        filters.phase = args[args.indexOf('--phase') + 1];
      }
      if (args.includes('--limit')) {
        filters.limit = parseInt(args[args.indexOf('--limit') + 1], 10);
      }

      const checkpoints = await listCheckpoints(filters);
      console.error(`\n📋 Checkpoints (${checkpoints.length}):\n`);
      checkpoints.forEach(cp => {
        console.error(`  ${cp.name}`);
        console.error(`    Phase: ${cp.workflow_phase} | Agent: ${cp.agent}`);
        console.error(`    Created: ${new Date(cp.created_at).toLocaleString()}`);
        console.error(`    Features: ${cp.features.completed.length} done, ${cp.features.in_progress.length} in progress, ${cp.features.pending.length} pending`);
        console.error('');
      });
      break;
    }

    case 'delete': {
      const name = args[0];
      if (!name) {
        console.error('Usage: checkpoint-service.ts delete <name>');
        process.exit(1);
      }
      await deleteCheckpoint(name);
      break;
    }

    default:
      console.error(`
Usage: checkpoint-service.ts <command> [arguments]

Commands:
  save <name> <data.json>     Save a checkpoint
  restore <name>               Restore a checkpoint
  list [--agent X] [--phase P] List checkpoints (optional filters)
  delete <name>                Delete a checkpoint

Examples:
  node services/checkpoint-service.ts save after-jwt checkpoint-data.json
  node services/checkpoint-service.ts restore after-jwt
  node services/checkpoint-service.ts list --agent siftcoder-coder --limit 5
      `);
      process.exit(1);
  }
}
