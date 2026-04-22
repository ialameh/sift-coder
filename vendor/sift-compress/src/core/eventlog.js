'use strict';
// @ts-check
// sift-compress — append-only event log.
// Events are the source of truth. Current state is a fold over events.
// Replay is deterministic; debugging = `sift-compress doctor` shows tail.
//
// This module is the foundation of the mechanism/policy split: the Node brain
// writes events; the Python analyzer reads them to derive compression ratios
// and escalation policy. Neither side owns "the state" — they both derive it.

const fs = require('fs');
const { eventLogPath, stateDir } = require('./paths');

const MAX_EVENT_BYTES = 4096;

const EVENT_TYPES = new Set([
  'mode_changed',
  'hook_invoked',
  'hook_completed',
  'reinforcement_emitted',
  'compression_observed',
  'deprecation_used',
  'error',
]);

function ensureDir() {
  try { fs.mkdirSync(stateDir(), { recursive: true, mode: 0o700 }); } catch (e) {}
}

function append(event) {
  if (!event || !EVENT_TYPES.has(event.type)) return false;
  try {
    ensureDir();
    const line = JSON.stringify({ ts: new Date().toISOString(), pid: process.pid, ...event });
    if (Buffer.byteLength(line) > MAX_EVENT_BYTES) return false;
    fs.appendFileSync(eventLogPath(), line + '\n', { mode: 0o600 });
    return true;
  } catch (e) {
    return false;
  }
}

// Read last `limit` events. A single corrupted line is skipped, not fatal —
// the log must stay readable even if a crash mid-write left a torn line.
function readAll(limit = 1000) {
  try {
    const content = fs.readFileSync(eventLogPath(), 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const tail = lines.slice(-limit);
    const events = [];
    for (const line of tail) {
      try {
        const e = JSON.parse(line);
        if (e && EVENT_TYPES.has(e.type)) events.push(e);
      } catch (err) {}
    }
    return events;
  } catch (e) {
    return [];
  }
}

// Fold: current mode = last mode_changed event (or null if never set).
function deriveState() {
  const events = readAll();
  let mode = null;
  let lastTransition = null;
  let compressionSamples = 0;
  for (const e of events) {
    if (e.type === 'mode_changed') {
      mode = e.to;
      lastTransition = e;
    }
    if (e.type === 'compression_observed') compressionSamples++;
  }
  return { mode, lastTransition, compressionSamples, eventCount: events.length };
}

// Compute per-mode compression stats from real compression_observed events.
// No API key, no synthetic data. This is the honest answer to "show me my
// numbers" — it folds whatever the plugin actually recorded during real
// Claude Code sessions.
//
// Ratio definition: responseChars / (promptChars + responseChars).
// Lower = more compressed (response is small relative to total conversation).
function compressionStats(opts = {}) {
  const events = readAll(opts.limit || 1000);
  const byMode = new Map();
  let overall = [];

  for (const e of events) {
    if (e.type !== 'compression_observed') continue;
    // Prefer tokens; fall back to chars.
    let total, response;
    if (typeof e.promptTokens === 'number' && typeof e.responseTokens === 'number') {
      total = e.promptTokens + e.responseTokens; response = e.responseTokens;
    } else if (typeof e.promptChars === 'number' && typeof e.responseChars === 'number') {
      total = e.promptChars + e.responseChars; response = e.responseChars;
    } else {
      continue;
    }
    if (total <= 0) continue;
    const ratio = response / total;
    overall.push(ratio);
    const mode = e.mode || 'unknown';
    if (!byMode.has(mode)) byMode.set(mode, []);
    byMode.get(mode).push(ratio);
  }

  function summarize(arr) {
    if (arr.length === 0) return { n: 0 };
    const sorted = [...arr].sort((a, b) => a - b);
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const pct = p => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
    return {
      n: arr.length,
      mean,
      p50: pct(0.5),
      p95: pct(0.95),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  const perMode = {};
  for (const [mode, arr] of byMode) perMode[mode] = summarize(arr);
  return { overall: summarize(overall), byMode: perMode };
}

function truncate() {
  try { fs.unlinkSync(eventLogPath()); return true; } catch (e) { return false; }
}

module.exports = { append, readAll, deriveState, truncate, compressionStats, EVENT_TYPES };
