#!/usr/bin/env node
'use strict';
// sift-compress — SessionStart hook.
// Emits the full ruleset for the current mode as stdout (Claude Code injects
// SessionStart stdout as system context). Appends lifecycle events. Repairs
// the state cache if it has drifted from the event log.

const { deriveState, append } = require('../src/core/eventlog');
const { read: readState, write: writeState } = require('../src/core/flag');
const { resolve: resolveConfig } = require('../src/core/config');
const { getMode, isIndependent } = require('../src/core/modes');
const { timed } = require('../src/core/logger');

timed('session-start', () => {
  try {
    const derived = deriveState();
    const cached = readState();
    if (!cached || cached.mode !== derived.mode) {
      writeState({ mode: derived.mode });
    }

    let mode = derived.mode;
    if (mode === null || mode === undefined) {
      const def = resolveConfig('defaultMode').value;
      if (def && def !== 'off') {
        mode = def;
        append({ type: 'mode_changed', from: null, to: mode, trigger: 'session_default' });
        writeState({ mode });
      }
    }

    append({ type: 'hook_invoked', hook: 'session-start', mode: mode || null });

    if (!mode || mode === 'off') {
      process.stdout.write('OK');
      return;
    }

    const m = getMode(mode);
    if (!m) { process.stdout.write('OK'); return; }

    if (isIndependent(mode)) {
      process.stdout.write('SIFT-COMPRESS MODE: ' + mode + '. ' + (m.rules || ''));
      return;
    }

    const body = [
      'SIFT-COMPRESS ACTIVE — mode: ' + mode,
      '',
      'Respond compressed but technically exact. Only fluff dies. All substance stays.',
      '',
      '## Persistence',
      'Active every response. No drift after many turns. Off only: "stop sift-compress" / "normal mode".',
      '',
      '## Rules',
      m.rules,
      '',
      '## Auto-clarity',
      'Drop compression for: security warnings, irreversible actions, multi-step sequences where fragment order risks misread, user confusion or repeat-question. Resume compression after the clear part is done.',
      '',
      '## Boundaries',
      'Code, commits, PR descriptions: write normal prose. Compression applies to natural-language explanation only. Mode persists until changed or session end.',
    ].join('\n');

    process.stdout.write(body);
  } catch (e) {
    append({ type: 'error', hook: 'session-start', error: String((e && e.message) || e) });
    process.stdout.write('OK');
  }
});
