#!/usr/bin/env node
/**
 * SiftCoder Observation Logger
 *
 * Logs structured observations to implementation-log.jsonl
 * with agent attribution, workflow context, and learning extraction.
 *
 * SiftCoder Flavor:
 * - Agent attribution for each observation
 * - Workflow context tracking (feature, subtask, phase)
 * - Learning extraction (concepts, facts, gotchas)
 * - Safety verification (boundaries, blast radius)
 * - Token economics calculation
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = process.env.SIFTCODER_STATE_DIR || '.claude/siftcoder-state';
const LOG_FILE = path.join(STATE_DIR, 'implementation-log.jsonl');
const SCHEMA_PATH = path.join(__dirname, '../schemas/observation.schema.json');
// State tracking
let sessionId = null;
let currentPhase = 'PLANNING';
let currentAgent = 'siftcoder-orchestrator';
let currentFeature = '';
let currentSubtask = '';
let currentIteration = 1;
/**
 * Initialize or load session ID
 */
async function initializeSession() {
    if (sessionId) {
        return sessionId;
    }
    // Try to load existing session
    const sessionFile = path.join(STATE_DIR, 'session.json');
    try {
        const sessionData = JSON.parse(await fs.readFile(sessionFile, 'utf-8'));
        sessionId = sessionData.id;
        currentPhase = sessionData.workflow_phase || 'PLANNING';
        currentAgent = sessionData.agent || 'siftcoder-orchestrator';
        currentFeature = sessionData.feature || '';
        currentSubtask = sessionData.subtask || '';
        currentIteration = sessionData.iteration || 1;
    }
    catch {
        // Create new session
        sessionId = `sess_${Date.now()}`;
        await saveSessionState();
    }
    return sessionId;
}
/**
 * Save session state
 */
async function saveSessionState() {
    const sessionData = {
        id: sessionId,
        workflow_phase: currentPhase,
        agent: currentAgent,
        feature: currentFeature,
        subtask: currentSubtask,
        iteration: currentIteration,
        updated_at: new Date().toISOString()
    };
    const sessionFile = path.join(STATE_DIR, 'session.json');
    await fs.writeFile(sessionFile, JSON.stringify(sessionData, null, 2), 'utf-8');
}
/**
 * Update workflow context
 */
export function updateContext(updates) {
    if (updates.phase)
        currentPhase = updates.phase;
    if (updates.agent)
        currentAgent = updates.agent;
    if (updates.feature)
        currentFeature = updates.feature;
    if (updates.subtask)
        currentSubtask = updates.subtask;
    if (updates.iteration)
        currentIteration = updates.iteration;
    saveSessionState();
}
/**
 * Validate observation entry
 */
function validateObservation(entry) {
    const errors = [];
    if (!entry.agent) {
        errors.push('agent is required');
    }
    if (!entry.workflow?.feature) {
        errors.push('workflow.feature is required');
    }
    if (!entry.workflow?.subtask) {
        errors.push('workflow.subtask is required');
    }
    if (!entry.workflow?.phase) {
        errors.push('workflow.phase is required');
    }
    if (!entry.observation?.type) {
        errors.push('observation.type is required');
    }
    if (!entry.safety?.boundary_check) {
        errors.push('safety.boundary_check is required');
    }
    if (!entry.safety?.files_in_scope === undefined) {
        errors.push('safety.files_in_scope is required');
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Extract learning from observation (simplified version)
 * In production, this would call an AI model to extract concepts, facts, gotchas
 */
function extractLearning(observation) {
    const learning = {
        concepts: [],
        facts: [],
        gotchas: [],
        discovery_tokens: 0
    };
    // Extract concepts from narrative
    if (observation.observation.narrative) {
        const narrative = observation.observation.narrative.toLowerCase();
        // Common programming concepts
        const conceptPatterns = [
            'authentication', 'jwt', 'oauth', 'database', 'api', 'rest',
            'frontend', 'backend', 'component', 'service', 'controller',
            'validation', 'testing', 'deployment', 'git', 'hook', 'middleware'
        ];
        conceptPatterns.forEach(concept => {
            if (narrative.includes(concept) && !learning.concepts.includes(concept)) {
                learning.concepts.push(concept);
            }
        });
    }
    // Simple fact extraction from narrative
    if (observation.observation.narrative) {
        const sentences = observation.observation.narrative.split('.').filter(s => s.trim());
        sentences.forEach(sentence => {
            if (sentence.includes('requires') || sentence.includes('must') || sentence.includes('should')) {
                learning.facts.push(sentence.trim());
            }
        });
    }
    // Simple gotcha detection
    if (observation.observation.narrative) {
        const gotchaPatterns = ['not', 'but', 'except', 'however', 'warning', 'caution'];
        const narrative = observation.observation.narrative.toLowerCase();
        gotchaPatterns.forEach(pattern => {
            if (narrative.includes(pattern) && !learning.gotchas.some(g => g.includes(pattern))) {
                const gotcha = observation.observation.narrative;
                learning.gotchas.push(gotcha.substring(0, 100));
            }
        });
    }
    // Calculate discovery tokens (simple heuristic)
    learning.discovery_tokens = (learning.concepts.length * 10) + (learning.facts.length * 15) + (learning.gotchas.length * 20);
    return learning;
}
/**
 * Log observation to implementation-log.jsonl
 */
export async function logObservation(observation) {
    try {
        // Ensure state directory exists
        await fs.mkdir(STATE_DIR, { recursive: true });
        // Initialize session
        observation.session_id = await initializeSession();
        // Auto-populate workflow context if not provided
        if (!observation.workflow) {
            observation.workflow = {
                feature: currentFeature || 'unknown',
                subtask: currentSubtask || 'unknown',
                phase: currentPhase,
                iteration: currentIteration
            };
        }
        // Auto-populate agent if not provided
        if (!observation.agent) {
            observation.agent = currentAgent;
        }
        // Add timestamp if not provided
        if (!observation.timestamp) {
            observation.timestamp = new Date().toISOString();
        }
        // Validate observation
        const validation = validateObservation(observation);
        if (!validation.valid) {
            throw new Error(`Invalid observation: ${validation.errors.join(', ')}`);
        }
        // Extract learning if not provided
        if (!observation.learning) {
            observation.learning = extractLearning(observation);
        }
        // Ensure safety fields
        if (!observation.safety) {
            observation.safety = {
                boundary_check: 'skipped',
                files_in_scope: true
            };
        }
        // Write to log file
        const logEntry = JSON.stringify(observation);
        await fs.appendFile(LOG_FILE, logEntry + '\n', 'utf-8');
        // Console output (stderr to not interfere with tool results)
        console.error(`📝 Observation logged: ${observation.observation.type} by ${observation.agent}`);
    }
    catch (error) {
        console.error(`✗ Failed to log observation: ${error.message}`);
        throw error;
    }
}
/**
 * Query observations with filters
 */
export async function queryObservations(filters) {
    try {
        const content = await fs.readFile(LOG_FILE, 'utf-8');
        const lines = content.trim().split('\n').filter(l => l.trim());
        let observations = lines.map(line => JSON.parse(line));
        // Apply filters
        if (filters?.agent) {
            observations = observations.filter(obs => obs.agent === filters.agent);
        }
        if (filters?.phase) {
            observations = observations.filter(obs => obs.workflow?.phase === filters.phase);
        }
        if (filters?.concept) {
            observations = observations.filter(obs => obs.learning?.concepts?.includes(filters.concept));
        }
        if (filters?.limit) {
            observations = observations.slice(-filters.limit);
        }
        return observations;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}
// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const command = process.argv[2];
    switch (command) {
        case 'log': {
            // Quick log from command line
            const type = process.argv[3];
            const narrative = process.argv[4] || '';
            // Try to load workflow context from current-task.json
            try {
                const taskFile = path.join(STATE_DIR, 'current-task.json');
                const taskData = JSON.parse(await fs.readFile(taskFile, 'utf-8'));
                currentPhase = taskData.workflow_phase || currentPhase;
                currentAgent = taskData.agent || currentAgent;
                currentFeature = taskData.feature || currentFeature || 'unknown';
                currentSubtask = taskData.subtask || currentSubtask || 'unknown';
                currentIteration = taskData.iteration || currentIteration;
            }
            catch {
                // Use defaults if no task file
                currentFeature = currentFeature || 'unknown';
                currentSubtask = currentSubtask || 'unknown';
            }
            logObservation({
                timestamp: new Date().toISOString(),
                agent: currentAgent,
                workflow: {
                    feature: currentFeature,
                    subtask: currentSubtask,
                    phase: currentPhase,
                    iteration: currentIteration
                },
                observation: {
                    type: type,
                    tool: type,
                    narrative: narrative
                },
                safety: {
                    boundary_check: 'skipped',
                    files_in_scope: true
                }
            });
            break;
        }
        case 'query': {
            const filters = {};
            if (process.argv[3] === '--agent')
                filters.agent = process.argv[4];
            if (process.argv[3] === '--phase')
                filters.phase = process.argv[4];
            if (process.argv[3] === '--concept')
                filters.concept = process.argv[4];
            const observations = await queryObservations(filters);
            console.error(`\n📋 Observations (${observations.length}):\n`);
            observations.forEach(obs => {
                console.error(`[${obs.timestamp}]`);
                console.error(`  Agent: ${obs.agent}`);
                console.error(`  ${obs.workflow.phase} - ${obs.workflow.feature} / ${obs.workflow.subtask}`);
                if (obs.observation.narrative) {
                    console.error(`  ${obs.observation.narrative.substring(0, 80)}...`);
                }
                if (obs.learning && obs.learning.concepts.length > 0) {
                    console.error(`  Concepts: ${obs.learning.concepts.join(', ')}`);
                }
                console.error('');
            });
            break;
        }
        default:
            console.error(`
Usage: observation-logger.ts <command> [arguments]

Commands:
  log <type> <narrative>       Log a quick observation
  query [--agent X] [--phase P]  Query observations (optional filters)

Examples:
  node services/observation-logger.ts log Edit "Fixed JWT validation bug"
  node services/observation-logger.ts query --agent siftcoder-coder --limit 10
      `);
            process.exit(1);
    }
}
//# sourceMappingURL=observation-logger.js.map