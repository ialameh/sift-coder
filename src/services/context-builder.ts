#!/usr/bin/env node

/**
 * SiftCoder Context Builder
 *
 * Builds multi-agent context from previous sessions for injection at session start.
 *
 * SiftCoder Flavor:
 * - Multi-agent summaries (what each agent learned)
 * - Quality trends (improving/regressing)
 * - Workflow state (phase, iteration, next action)
 * - Boundary state (modifiable/protected files)
 * - Token economics (efficiency, discovery tokens)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const STATE_DIR = process.env.SIFTCODER_STATE_DIR || '.claude/siftcoder-state';

interface CheckpointData {
  id: string;
  createdAt: string;
  gitRef: string;
  featureId: string;
  trigger: string;
  message: string;
  filesChanged: string;
  // Legacy fields (may not exist)
  workflow_phase?: 'PLANNING' | 'CODING' | 'QA' | 'DONE';
  iteration?: number;
  agent?: string;
  features?: {
    completed: string[];
    in_progress: string[];
    pending: string[];
  };
  quality_results?: {
    format?: { status: string };
    lint?: { status: string; errors?: number; warnings?: number };
    type_check?: { status: string };
  };
  boundaries?: {
    modifiable: string[];
    protected: string[];
    blast_radius_verified: boolean;
  };
  token_economics?: {
    session_tokens: number;
    discovery_tokens: number;
    efficiency: string;
  };
}

interface ObservationEntry {
  timestamp: string;
  session_id: string;
  agent: string;
  workflow: {
    feature: string;
    subtask: string;
    phase: 'PLANNING' | 'CODING' | 'QA' | 'DONE';
    iteration: number;
  };
  learning?: {
    concepts: string[];
    facts: string[];
    gotchas: string[];
    discovery_tokens: number;
  };
}

interface AgentSummary {
  agent: string;
  sessions: number;
  concepts: string[];
  facts: string[];
  gotchas: string[];
  discovery_tokens: number;
}

interface QualityTrend {
  format: { passed: number; total: number; rate: string };
  lint: { passed: number; warnings: number; trend: string };
  type_check: { passed: number; total: number; rate: string };
}

/**
 * Get recent checkpoints
 */
async function getRecentCheckpoints(limit: number = 3): Promise<CheckpointData[]> {
  try {
    const checkpointsDir = path.join(STATE_DIR, 'checkpoints');
    const files = await fs.readdir(checkpointsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    // Read and parse all checkpoints
    const checkpoints: CheckpointData[] = [];
    for (const file of jsonFiles) {
      const filePath = path.join(checkpointsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const checkpoint = JSON.parse(content);
      checkpoints.push(checkpoint);
    }

    // Sort by creation date (newest first) and limit
    checkpoints.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return checkpoints.slice(0, limit);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Load observations from implementation log
 */
async function loadObservations(): Promise<ObservationEntry[]> {
  try {
    const logFile = path.join(STATE_DIR, 'implementation-log.jsonl');
    const content = await fs.readFile(logFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());

    return lines.map(line => JSON.parse(line));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Build agent summaries from observations
 */
async function buildAgentSummaries(): Promise<AgentSummary[]> {
  const observations = await loadObservations();

  // Group by agent
  const agentMap = new Map<string, AgentSummary>();

  for (const obs of observations) {
    if (!obs.learning) continue;

    if (!agentMap.has(obs.agent)) {
      agentMap.set(obs.agent, {
        agent: obs.agent,
        sessions: 0,
        concepts: [],
        facts: [],
        gotchas: [],
        discovery_tokens: 0
      });
    }

    const summary = agentMap.get(obs.agent)!;
    summary.sessions++;
    summary.discovery_tokens += obs.learning.discovery_tokens || 0;

    // Merge concepts (unique)
    for (const concept of obs.learning.concepts || []) {
      if (!summary.concepts.includes(concept)) {
        summary.concepts.push(concept);
      }
    }

    // Merge facts (unique, limit to top 10)
    for (const fact of obs.learning.facts || []) {
      if (!summary.facts.includes(fact) && summary.facts.length < 10) {
        summary.facts.push(fact);
      }
    }

    // Merge gotchas (unique, limit to top 5)
    for (const gotcha of obs.learning.gotchas || []) {
      if (!summary.gotchas.includes(gotcha) && summary.gotchas.length < 5) {
        summary.gotchas.push(gotcha);
      }
    }
  }

  return Array.from(agentMap.values());
}

/**
 * Calculate quality trends from checkpoints
 */
async function calculateQualityTrends(): Promise<QualityTrend | null> {
  const checkpoints = await getRecentCheckpoints(10);

  if (checkpoints.length === 0) {
    return null;
  }

  let formatPassed = 0;
  let formatTotal = 0;
  let lintWarnings = 0;
  let typeCheckPassed = 0;
  let typeCheckTotal = 0;

  for (const checkpoint of checkpoints) {
    const qr = checkpoint.quality_results;

    // Skip if no quality_results
    if (!qr) {
      continue;
    }

    // Format stats
    if (qr.format) {
      formatTotal++;
      if (qr.format.status === 'passed') {
        formatPassed++;
      }
    }

    // Lint warnings
    if (qr.lint?.warnings) {
      lintWarnings += qr.lint.warnings;
    }

    // Type check stats
    if (qr.type_check) {
      typeCheckTotal++;
      if (qr.type_check.status === 'passed') {
        typeCheckPassed++;
      }
    }
  }

  // Calculate lint trend (more checkpoints = more data)
  const avgWarnings = lintWarnings / checkpoints.length;
  const lintTrend = avgWarnings < 5 ? '↓ Improving' : avgWarnings < 10 ? '→ Stable' : '↑ Regressing';

  return {
    format: {
      passed: formatPassed,
      total: formatTotal,
      rate: formatTotal > 0 ? `${Math.round((formatPassed / formatTotal) * 100)}%` : 'N/A'
    },
    lint: {
      passed: checkpoints.length - lintWarnings, // Approximate
      warnings: lintWarnings,
      trend: lintTrend
    },
    type_check: {
      passed: typeCheckPassed,
      total: typeCheckTotal,
      rate: typeCheckTotal > 0 ? `${Math.round((typeCheckPassed / typeCheckTotal) * 100)}%` : 'N/A'
    }
  };
}

/**
 * Format agent name for display
 */
function formatAgentName(agent: string): string {
  const names: Record<string, string> = {
    'siftcoder-orchestrator': '🎯 Orchestrator',
    'siftcoder-planner': '🤔 Planner',
    'siftcoder-coder': '💻 Coder',
    'siftcoder-investigator': '🔍 Investigator',
    'siftcoder-qa-reviewer': '✅ QA Reviewer',
    'siftcoder-qa-fixer': '🔧 QA Fixer',
    'siftcoder-documenter': '📚 Documenter'
  };

  return names[agent] || agent;
}

/**
 * Inject context for session start
 */
export async function injectContext(): Promise<void> {
  // Get recent checkpoints
  const recentCheckpoints = await getRecentCheckpoints(3);

  // Build agent summaries
  const agentSummaries = await buildAgentSummaries();

  // Calculate quality trends
  const qualityTrends = await calculateQualityTrends();

  // Get current workflow state
  let currentTask: any = {};
  try {
    const taskFile = path.join(STATE_DIR, 'current-task.json');
    const content = await fs.readFile(taskFile, 'utf-8');
    currentTask = JSON.parse(content);
  } catch {
    // No current task
  }

  // Output formatted context
  console.log('## 🔄 SiftCoder Session Continuation');
  console.log('');

  // Recent sessions
  if (recentCheckpoints.length > 0) {
    console.log('### Previous Sessions');
    for (const checkpoint of recentCheckpoints) {
      const date = new Date(checkpoint.createdAt);
      const timeAgo = getTimeAgo(date);
      const agentName = checkpoint.agent ? formatAgentName(checkpoint.agent) : 'System';

      console.log(`- **${checkpoint.id}** (${timeAgo})`);
      console.log(`  - Trigger: ${checkpoint.trigger}`);
      console.log(`  - Message: ${checkpoint.message}`);
      if (checkpoint.workflow_phase) {
        console.log(`  - Phase: ${checkpoint.workflow_phase}`);
      }
      if (checkpoint.agent) {
        console.log(`  - Agent: ${agentName}`);
      }
      if (checkpoint.features) {
        console.log(`  - Features: ${checkpoint.features.completed.length} completed, ${checkpoint.features.in_progress.length} in progress`);
      }
      if (checkpoint.filesChanged) {
        console.log(`  - Files: ${checkpoint.filesChanged}`);
      }
      console.log('');
    }
  }

  // Multi-agent context
  if (agentSummaries.length > 0) {
    console.log('### Multi-Agent Context');
    console.log('');

    for (const summary of agentSummaries) {
      const agentName = formatAgentName(summary.agent);

      console.log(`**${agentName}** (${summary.sessions} sessions, ${summary.discovery_tokens} discovery tokens)`);

      if (summary.concepts.length > 0) {
        console.log(`- Concepts: ${summary.concepts.slice(0, 5).join(', ')}${summary.concepts.length > 5 ? '...' : ''}`);
      }

      if (summary.gotchas.length > 0) {
        console.log(`- Gotchas: ${summary.gotchas.length} learned`);
      }

      console.log('');
    }
  }

  // Current workflow state
  if (currentTask.phase) {
    console.log('### Current Workflow State');
    console.log(`- **Phase**: ${currentTask.phase}`);
    console.log(`- **Iteration**: ${currentTask.iteration || 1}`);
    if (currentTask.feature) {
      console.log(`- **Feature**: ${currentTask.feature}`);
    }
    if (currentTask.subtask) {
      console.log(`- **Subtask**: ${currentTask.subtask}`);
    }
    console.log('');
  }

  // Safety context
  try {
    const boundariesFile = path.join(STATE_DIR, 'boundaries.json');
    const boundaries = JSON.parse(await fs.readFile(boundariesFile, 'utf-8'));

    console.log('### Safety Context');
    if (boundaries.modifiable && boundaries.modifiable.length > 0) {
      console.log(`**Modifiable**: ${boundaries.modifiable.slice(0, 3).join(', ')}${boundaries.modifiable.length > 3 ? '...' : ''}`);
    }
    if (boundaries.protected && boundaries.protected.length > 0) {
      console.log(`**Protected**: ${boundaries.protected.slice(0, 3).join(', ')}${boundaries.protected.length > 3 ? '...' : ''}`);
    }
    console.log('');
  } catch {
    // No boundaries set
  }

  // Quality trends
  if (qualityTrends) {
    console.log('### Quality Trends');
    console.log(`- **Format**: ${qualityTrends.format.rate} pass rate`);
    console.log(`- **Lint**: ${qualityTrends.lint.warnings} warnings ${qualityTrends.lint.trend}`);
    console.log(`- **Type Check**: ${qualityTrends.type_check.rate} pass rate`);
    console.log('');
  }

  // Token economics (if available in checkpoint)
  if (recentCheckpoints.length > 0) {
    const latest = recentCheckpoints[0];
    if (latest.token_economics) {
      console.log('### Token Economics');
      console.log(`- **Session**: ${latest.token_economics.session_tokens.toLocaleString()} tokens`);
      console.log(`- **Discovery**: ${latest.token_economics.discovery_tokens.toLocaleString()} tokens (${latest.token_economics.efficiency} efficiency)`);
      console.log('');
    }
  }

  // Resuming from
  if (currentTask.checkpoint) {
    console.log('### Resuming From');
    console.log(`Last checkpoint: \`${currentTask.checkpoint}\``);
    if (currentTask.next_action) {
      console.log(`Next action: ${currentTask.next_action}`);
    }
    console.log('');
  }
}

/**
 * Get time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case 'inject-context':
      injectContext().catch(error => {
        console.error(`Failed to inject context: ${error.message}`);
        process.exit(1);
      });
      break;

    default:
      console.error(`
Usage: context-builder.ts <command>

Commands:
  inject-context              Inject context at session start

Examples:
  node services/context-builder.ts inject-context
      `);
      process.exit(1);
  }
}
