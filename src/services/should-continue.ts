/**
 * Should Continue Service
 *
 * Determines if workflow should continue after Claude stops.
 * Checks task state, iterations, and pending work.
 */

import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';

export interface ContinueDecision {
  decision: 'continue' | 'stop';
  reason: string;
}

export interface CurrentTask {
  mode?: string;
  phase?: string;
  iteration?: number;
  paused?: boolean;
}

export interface FeaturesState {
  queue?: {
    pending?: string[];
    in_progress?: string[];
  };
}

export interface Config {
  autoContinue?: boolean;
  maxIterations?: number;
}

export class ShouldContinueService {
  private stateDir: string;

  constructor(projectRoot?: string) {
    this.stateDir = PathUtils.getStateDir(projectRoot);
  }

  /**
   * Determine if workflow should continue
   */
  async shouldContinue(): Promise<ContinueDecision> {
    const currentTaskPath = PathUtils.join(this.stateDir, 'current-task.json');

    // Check if there's an active task
    if (!await FileUtils.exists(currentTaskPath)) {
      return { decision: 'stop', reason: 'No active task' };
    }

    // Load current task
    const task = await FileUtils.readJSON<CurrentTask>(currentTaskPath);

    // Check if paused
    if (task.paused) {
      return { decision: 'stop', reason: 'Workflow is paused' };
    }

    // Load config
    const config = await this.loadConfig();

    // Check if auto-continue is enabled
    if (config.autoContinue === false) {
      return { decision: 'stop', reason: 'Auto-continue disabled' };
    }

    // Check iteration count
    const maxIterations = config.maxIterations || 10;
    if (task.iteration && task.iteration >= maxIterations) {
      return { decision: 'stop', reason: `Max iterations reached (${maxIterations})` };
    }

    // Check for more work based on mode
    const hasWork = await this.checkForWork(task);
    return hasWork;
  }

  /**
   * Check if there's more work to do based on mode
   */
  private async checkForWork(task: CurrentTask): Promise<ContinueDecision> {
    const mode = task.mode || '';

    switch (mode) {
      case 'build':
      case 'add-feature': {
        const features = await this.loadFeatures();
        const pendingCount = features?.queue?.pending?.length || 0;
        const inProgressCount = features?.queue?.in_progress?.length || 0;

        if (pendingCount > 0 || inProgressCount > 0) {
          return {
            decision: 'continue',
            reason: `Continuing to next task in queue (${pendingCount} pending, ${inProgressCount} in progress)`
          };
        }
        return { decision: 'stop', reason: 'Feature queue is empty' };
      }

      case 'fix':
      case 'investigate':
      case 'optimize': {
        if (task.phase !== 'complete' && task.phase !== 'user_review') {
          return {
            decision: 'continue',
            reason: `Continuing ${mode} workflow (phase: ${task.phase})`
          };
        }
        return { decision: 'stop', reason: `${mode} workflow complete` };
      }

      case 'document': {
        if (task.phase !== 'complete') {
          return {
            decision: 'continue',
            reason: `Continuing documentation generation (phase: ${task.phase})`
          };
        }
        return { decision: 'stop', reason: 'Documentation complete' };
      }

      default:
        return { decision: 'stop', reason: `Unknown mode: ${mode}` };
    }
  }

  /**
   * Load config file
   */
  private async loadConfig(): Promise<Config> {
    const configPath = PathUtils.join(this.stateDir, 'config.json');
    if (await FileUtils.exists(configPath)) {
      return FileUtils.readJSON<Config>(configPath);
    }
    return {};
  }

  /**
   * Load features state
   */
  private async loadFeatures(): Promise<FeaturesState | null> {
    const featuresPath = PathUtils.join(this.stateDir, 'features.json');
    if (await FileUtils.exists(featuresPath)) {
      return FileUtils.readJSON<FeaturesState>(featuresPath);
    }
    return null;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new ShouldContinueService();

  service.shouldContinue().then(decision => {
    if (decision.decision === 'continue') {
      console.log(JSON.stringify({ decision: 'block', reason: decision.reason }));
      process.exit(0);
    } else {
      process.exit(0); // Exit 0 means stop
    }
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
