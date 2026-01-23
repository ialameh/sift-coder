/**
 * Auto Checkpoint Service
 *
 * Creates git checkpoints at feature milestones.
 * Called after subtask completion or feature completion.
 */

import { execSync } from 'child_process';
import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';

export type CheckpointTrigger = 'feature_complete' | 'subtask_complete' | 'manual' | 'auto_threshold' | 'auto_critical';

export interface CheckpointMetadata {
  id: string;
  createdAt: string;
  gitRef: string;
  featureId: string;
  trigger: CheckpointTrigger;
  message: string;
  filesChanged: string;
}

export class AutoCheckpointService {
  private stateDir: string;
  private checkpointsDir: string;
  private logFile: string;
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.stateDir = PathUtils.getStateDir(projectRoot);
    this.checkpointsDir = PathUtils.join(this.stateDir, 'checkpoints');
    this.logFile = PathUtils.join(this.stateDir, 'implementation-log.jsonl');
  }

  /**
   * Create a checkpoint
   */
  async createCheckpoint(options: {
    trigger?: 'feature_complete' | 'subtask_complete' | 'manual' | 'auto_threshold' | 'auto_critical';
    featureId?: string;
    message?: string;
  }): Promise<CheckpointMetadata | null> {
    const { trigger = 'manual', featureId = 'unknown', message = 'siftcoder checkpoint' } = options;

    // Ensure checkpoints directory exists
    await FileUtils.mkdir(this.checkpointsDir);

    // Check if in a git repo
    try {
      execSync('git rev-parse --git-dir', { cwd: this.projectRoot, stdio: 'ignore' });
    } catch {
      console.log('Not a git repository, skipping checkpoint');
      return null;
    }

    // Check for changes to commit
    try {
      execSync('git diff --quiet && git diff --staged --quiet', { cwd: this.projectRoot, stdio: 'ignore' });
      console.log('No changes to checkpoint');
      return null;
    } catch {
      // There are changes, continue
    }

    // Generate checkpoint ID
    const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const checkpointId = `cp-${date}`;

    // Stage all changes
    execSync('git add -A', { cwd: this.projectRoot });

    // Create commit
    const commitMsg = `[siftcoder] ${message}

Feature: ${featureId}
Trigger: ${trigger}
Checkpoint: ${checkpointId}

Co-Authored-By: Claude <noreply@anthropic.com>`;

    try {
      execSync(`git commit -m "${commitMsg}"`, { cwd: this.projectRoot, stdio: 'pipe' });
    } catch (error) {
      console.error('Commit failed:', error);
      throw error;
    }

    // Get the commit ref
    const gitRef = execSync('git rev-parse HEAD', { cwd: this.projectRoot, encoding: 'utf-8' }).trim();

    // Get list of files in commit
    const filesChanged = execSync('git diff-tree --no-commit-id --name-only -r HEAD', {
      cwd: this.projectRoot,
      encoding: 'utf-8'
    }).trim().split('\n').filter(f => f).join(',');

    // Create checkpoint metadata
    const metadata: CheckpointMetadata = {
      id: checkpointId,
      createdAt: new Date().toISOString(),
      gitRef,
      featureId,
      trigger,
      message,
      filesChanged
    };

    // Save checkpoint metadata
    const checkpointFile = PathUtils.join(this.checkpointsDir, `${checkpointId}.json`);
    await FileUtils.writeJSON(checkpointFile, metadata);

    // Log the checkpoint event
    const logEntry = {
      event: 'checkpoint_created',
      checkpointId,
      gitRef,
      featureId,
      trigger,
      timestamp: new Date().toISOString()
    };
    await FileUtils.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');

    console.log(`Checkpoint created: ${checkpointId} (git ref: ${gitRef.slice(0, 7)})`);

    return metadata;
  }

  /**
   * List all checkpoints
   */
  async listCheckpoints(): Promise<CheckpointMetadata[]> {
    const files = await FileUtils.listFiles(this.checkpointsDir);
    const checkpoints: CheckpointMetadata[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await FileUtils.readJSON<CheckpointMetadata>(
          PathUtils.join(this.checkpointsDir, file)
        );
        checkpoints.push(content);
      }
    }

    return checkpoints.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const trigger = (process.argv[2] || 'manual') as CheckpointTrigger;
  const featureId = process.argv[3] || 'unknown';
  const message = process.argv[4] || 'siftcoder checkpoint';

  const service = new AutoCheckpointService();

  service.createCheckpoint({ trigger, featureId, message })
    .then(metadata => {
      if (!metadata) {
        process.exit(0);
      }
      console.log(JSON.stringify(metadata, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}
