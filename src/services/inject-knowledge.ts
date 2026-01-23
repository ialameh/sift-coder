/**
 * Knowledge Injection Service
 *
 * SessionStart hook that injects learned patterns into context.
 * Outputs a summary of relevant knowledge for the current project.
 */

import { FileUtils } from '../utils/file-utils.js';
import { PathUtils } from '../utils/path-utils.js';

export interface KnowledgeSummary {
  patterns: number;
  gotchas: number;
  activeTask?: {
    mode: string;
    phase: string;
  };
}

export class KnowledgeInjectionService {
  private stateDir: string;
  private knowledgeDir: string;

  constructor(projectRoot?: string) {
    this.stateDir = PathUtils.getStateDir(projectRoot);
    this.knowledgeDir = PathUtils.join(this.stateDir, 'knowledge');
  }

  /**
   * Generate knowledge summary for session start
   */
  async getKnowledgeSummary(): Promise<string> {
    // Check if state exists
    if (!await FileUtils.exists(this.stateDir)) {
      return '';
    }

    const output: string[] = [];

    // Check for patterns
    const patternsFile = PathUtils.join(this.knowledgeDir, 'patterns.json');
    if (await FileUtils.exists(patternsFile)) {
      const patterns = await FileUtils.readJSON<any[]>(patternsFile);
      if (Array.isArray(patterns) && patterns.length > 0) {
        output.push(`[siftcoder] Loaded ${patterns.length} code patterns from previous sessions.`);
      }
    }

    // Check for gotchas
    const gotchasFile = PathUtils.join(this.knowledgeDir, 'gotchas.json');
    if (await FileUtils.exists(gotchasFile)) {
      const gotchas = await FileUtils.readJSON<any[]>(gotchasFile);
      if (Array.isArray(gotchas) && gotchas.length > 0) {
        output.push(`[siftcoder] Loaded ${gotchas.length} known gotchas from previous sessions.`);
      }
    }

    // Check for active task
    const currentTaskFile = PathUtils.join(this.stateDir, 'current-task.json');
    if (await FileUtils.exists(currentTaskFile)) {
      const task = await FileUtils.readJSON<{ mode?: string; phase?: string }>(currentTaskFile);
      if (task.mode && task.phase) {
        output.push(`[siftcoder] Active task: ${task.mode} (phase: ${task.phase}). Use /siftcoder:status for details.`);
      }
    }

    return output.join('\n');
  }

  /**
   * Get structured knowledge summary
   */
  async getStructuredSummary(): Promise<KnowledgeSummary> {
    const summary: KnowledgeSummary = {
      patterns: 0,
      gotchas: 0
    };

    // Check for patterns
    const patternsFile = PathUtils.join(this.knowledgeDir, 'patterns.json');
    if (await FileUtils.exists(patternsFile)) {
      const patterns = await FileUtils.readJSON<any[]>(patternsFile);
      summary.patterns = Array.isArray(patterns) ? patterns.length : 0;
    }

    // Check for gotchas
    const gotchasFile = PathUtils.join(this.knowledgeDir, 'gotchas.json');
    if (await FileUtils.exists(gotchasFile)) {
      const gotchas = await FileUtils.readJSON<any[]>(gotchasFile);
      summary.gotchas = Array.isArray(gotchas) ? gotchas.length : 0;
    }

    // Check for active task
    const currentTaskFile = PathUtils.join(this.stateDir, 'current-task.json');
    if (await FileUtils.exists(currentTaskFile)) {
      const task = await FileUtils.readJSON<{ mode?: string; phase?: string }>(currentTaskFile);
      if (task.mode && task.phase) {
        summary.activeTask = {
          mode: task.mode,
          phase: task.phase
        };
      }
    }

    return summary;
  }
}

// CLI interface
const currentFilePath = new URL(import.meta.url).pathname;
if (process.argv[1] === currentFilePath) {
  const service = new KnowledgeInjectionService();

  service.getKnowledgeSummary().then(output => {
    if (output) {
      console.log(output);
    }
    process.exit(0);
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}
