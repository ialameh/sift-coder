#!/usr/bin/env node
'use strict';
// sift-compress — doctor. The ops story.
// Prints: mode registry, resolved config stack with provenance, current
// state (cached vs derived + drift flag), event-log tail. Every time a user
// has a "why isn't caveman active?" moment, the answer is in this output.

const fs = require('fs');
const { resolveAll } = require('../core/config');
const { read: readState } = require('../core/flag');
const { deriveState, readAll, compressionStats } = require('../core/eventlog');
const { loadModeRegistry, modeNames } = require('../core/modes');
const { evaluate: evaluateEscalation } = require('../core/escalation');
const {
  eventLogPath, stateCachePath, debugLogPath, modesSchemaPath,
} = require('../core/paths');

function section(title) {
  console.log('\n\x1b[1m' + title + '\x1b[0m');
  console.log('─'.repeat(title.length));
}

function main() {
  let version = 'unknown';
  try { version = require('../../.claude-plugin/plugin.json').version; }
  catch (e) { try { version = require('../../package.json').version; } catch (e2) {} }
  console.log('\x1b[1msift-compress doctor\x1b[0m  v' + version);

  section('Mode registry');
  try {
    const reg = loadModeRegistry();
    console.log('  schema:        ' + modesSchemaPath());
    console.log('  schemaVersion: ' + reg.schemaVersion);
    console.log('  modes:         ' + modeNames().join(', '));
    console.log('  default:       ' + reg.defaultMode);
  } catch (e) {
    console.log('  \x1b[31mERROR\x1b[0m loading mode registry: ' + e.message);
  }

  section('Config stack (resolved)');
  try {
    const resolved = resolveAll();
    for (const [key, r] of Object.entries(resolved)) {
      console.log('  ' + key.padEnd(22) + String(r.value).padEnd(14)
        + '  ← ' + r.source + ' (' + r.layer + ')');
    }
  } catch (e) {
    console.log('  \x1b[31mERROR\x1b[0m resolving config: ' + e.message);
  }

  section('Current state');
  const cached = readState();
  const derived = deriveState();
  console.log('  cached:   ' + JSON.stringify(cached));
  console.log('  derived:  mode=' + derived.mode
    + ' events=' + derived.eventCount
    + ' compressionSamples=' + derived.compressionSamples);
  const drift = ((cached && cached.mode) || null) !== derived.mode;
  console.log('  drift:    ' + (drift
    ? '\x1b[31mYES — cache disagrees with event log\x1b[0m'
    : 'no'));

  section('Escalation decision (this turn, computed inline)');
  try {
    const { next, decision } = evaluateEscalation(cached ? cached.mode : derived.mode);
    const fmt = (v, d = 3) => typeof v === 'number' ? v.toFixed(d) : '—';
    console.log('  samples:     ' + (decision.samples ?? 0));
    console.log('  mean ratio:  ' + fmt(decision.meanRatio));
    console.log('  compression: ' + fmt(decision.compression));
    console.log('  floor:       ' + fmt(decision.floor));
    console.log('  reason:      ' + decision.reason);
    if (next) {
      console.log('  action:      \x1b[33mwould escalate → ' + next + '\x1b[0m');
    } else {
      console.log('  action:      stay (no escalation this turn)');
    }
  } catch (e) {
    console.log('  ERROR: ' + e.message);
  }

  section('Compression stats (from real sessions)');
  const stats = compressionStats();
  if (stats.overall.n === 0) {
    console.log('  no samples yet — use the plugin and stats will appear here.');
    console.log('  (every Stop hook appends a compression_observed event.)');
  } else {
    const ov = stats.overall;
    console.log('  samples:         ' + ov.n);
    console.log('  response/total:  p50=' + ov.p50.toFixed(3) + '  mean=' + ov.mean.toFixed(3) + '  p95=' + ov.p95.toFixed(3));
    console.log('  (lower = more compressed; 0.5 = response matches prompt length)');
    console.log('  per mode:');
    for (const [mode, s] of Object.entries(stats.byMode)) {
      console.log('    ' + mode.padEnd(10)
        + 'n=' + String(s.n).padEnd(5)
        + 'p50=' + s.p50.toFixed(3)
        + '  mean=' + s.mean.toFixed(3));
    }
  }

  section('Event log');
  console.log('  path: ' + eventLogPath());
  try {
    const st = fs.statSync(eventLogPath());
    console.log('  size: ' + st.size + ' bytes');
    console.log('  mtime: ' + st.mtime.toISOString());
  } catch (e) {
    console.log('  status: not present (no events yet)');
  }
  const events = readAll(10);
  console.log('  last ' + events.length + ' events:');
  for (const e of events) {
    const transition = e.to !== undefined ? ' ' + e.from + ' → ' + e.to : '';
    const trigger = e.trigger ? ' (' + e.trigger + ')' : '';
    console.log('    ' + e.ts + '  ' + e.type + transition + trigger);
  }

  section('Paths');
  console.log('  state.json:   ' + stateCachePath());
  console.log('  events.jsonl: ' + eventLogPath());
  console.log('  debug.jsonl:  ' + debugLogPath()
    + '  [' + (process.env.SIFT_DEBUG === '1' ? 'enabled' : 'disabled — set SIFT_DEBUG=1')
    + ']');
}

main();
