#!/usr/bin/env node
'use strict';
// sift-compress — UserPromptSubmit hook.
// Thin orchestrator: parse → resolve → persist → emit reinforcement.
// All state lives in the event log + state cache. This hook is stateless.

const { parse } = require('../src/services/prompt-parser');
const { decide } = require('../src/services/mode-resolver');
const { build } = require('../src/services/reinforcement-emitter');
const { append, deriveState } = require('../src/core/eventlog');
const { read: readState, write: writeState, clear: clearState } = require('../src/core/flag');
const { resolveAlias, isIndependent } = require('../src/core/modes');
const { resolve: resolveConfig } = require('../src/core/config');
const { evaluate: evaluateEscalation } = require('../src/core/escalation');
const { timed } = require('../src/core/logger');

let input = '';
process.stdin.on('data', c => { input += c; });
process.stdin.on('end', () => timed('user-prompt-submit', () => {
  try {
    let data = {};
    try { data = JSON.parse(input); } catch (e) {}
    const prompt = typeof data.prompt === 'string' ? data.prompt : '';

    const intent = parse(prompt);
    const cached = readState();
    const currentMode = (cached && cached.mode) || deriveState().mode || null;
    const { nextMode, reason } = decide(intent, currentMode);

    if (nextMode !== currentMode) {
      append({ type: 'mode_changed', from: currentMode, to: nextMode, trigger: reason });
      if (nextMode === null) clearState(); else writeState({ mode: nextMode });
    }

    // Closed-loop escalation, computed inline.
    // If metrics enabled AND the user didn't just set a mode AND current
    // mode is an intensity level, fold the event log and decide whether
    // to escalate this turn.
    let activeMode = nextMode;
    const notes = [];
    const metricsEnabled = resolveConfig('enableMetrics').value === true;
    const userDidntTouch = intent.kind === 'none';
    if (metricsEnabled && userDidntTouch && activeMode && !isIndependent(activeMode)) {
      const { next, decision } = evaluateEscalation(activeMode);
      if (next) {
        append({
          type: 'mode_changed',
          from: activeMode,
          to: next,
          trigger: 'auto_escalation',
          meanRatio: decision.meanRatio,
          compression: decision.compression,
          floor: decision.floor,
        });
        writeState({ mode: next });
        notes.push('AUTO-ESCALATION: compression ' + (decision.compression * 100).toFixed(0)
          + '% below floor ' + (decision.floor * 100).toFixed(0) + '%; '
          + activeMode + ' → ' + next + '.');
        activeMode = next;
      }
    }

    if (intent.kind === 'switch' && intent.aliasUsed && intent.aliasFrom) {
      const { deprecated, removeInVersion } = resolveAlias(intent.aliasFrom);
      if (deprecated) {
        append({ type: 'deprecation_used', alias: intent.aliasFrom, canonical: intent.mode });
        notes.push('DEPRECATION: alias `' + intent.aliasFrom + '` removed in '
          + (removeInVersion || 'a future version') + '. Use `' + intent.mode + '`.');
      }
    }

    const reminder = build(activeMode);
    const parts = [reminder, ...notes].filter(Boolean);

    if (parts.length > 0) {
      append({ type: 'reinforcement_emitted', mode: activeMode });
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: parts.join(' '),
        },
      }));
    }
  } catch (e) {
    append({ type: 'error', hook: 'user-prompt-submit', error: String((e && e.message) || e) });
  }
}));
