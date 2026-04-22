'use strict';
// @ts-check
// sift-compress — escalation policy, inlined.
//
// Previous versions split this across a Python analyzer + policy.json
// intermediate file. For a plugin that ships Node+skills in one tree, the
// separation was premature abstraction: it added install friction (Python
// 3.11 requirement) and test complexity for ~30 lines of math.
//
// What this does:
//   - Fold compression_observed events into a rolling char-ratio
//   - Apply the compressionFloor from config
//   - Decide whether the next turn should escalate intensity
//
// Lives in Node. Same event log, same config. No intermediate file. No
// staleness window to reason about — the decision is computed at the point
// of use, so it's always fresh.

const { readAll } = require('./eventlog');
const { resolve: resolveConfig } = require('./config');

const MIN_SAMPLES = 5;         // don't escalate on thin data
const WINDOW = 20;             // rolling window for the decision

// lite → full → ultra, ultra saturates
const LADDER = { lite: 'full', full: 'ultra', ultra: 'ultra' };

function bumpUp(mode) {
  if (!mode || !(mode in LADDER)) return null;
  const next = LADDER[mode];
  return next === mode ? null : next;
}

// Pure decision function. Takes samples + floor, returns a decision object.
// No I/O — easy to table-test, easy to reason about.
// Prefers token counts over char counts when both are available (tokens
// are the authoritative measure of model output size).
function sampleRatio(s) {
  if (typeof s.promptTokens === 'number' && typeof s.responseTokens === 'number') {
    const total = s.promptTokens + s.responseTokens;
    return total > 0 ? s.responseTokens / total : null;
  }
  if (typeof s.promptChars === 'number' && typeof s.responseChars === 'number') {
    const total = s.promptChars + s.responseChars;
    return total > 0 ? s.responseChars / total : null;
  }
  return null;
}

function decideFromSamples(samples, floor) {
  const ratios = samples.map(sampleRatio).filter(r => r !== null);

  if (ratios.length < MIN_SAMPLES) {
    return { shouldEscalate: false, reason: 'insufficient_samples', samples: ratios.length };
  }

  const window = ratios.slice(-WINDOW);
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const compression = 1 - mean;

  // Compression below the floor ⇒ model isn't compressing enough ⇒ escalate.
  if (compression < floor) {
    return { shouldEscalate: true, reason: 'floor_breach', meanRatio: mean, compression, floor, samples: ratios.length };
  }
  return { shouldEscalate: false, reason: 'within_floor', meanRatio: mean, compression, floor, samples: ratios.length };
}

// High-level: look at the event log, decide whether the given mode should
// escalate, and if so to what. Returns { next, decision } — `next` is null
// if no change.
function evaluate(currentMode) {
  if (!currentMode) return { next: null, decision: { shouldEscalate: false, reason: 'no_mode' } };
  const floor = resolveConfig('compressionFloor').value;
  const events = readAll().filter(e => e.type === 'compression_observed');
  const decision = decideFromSamples(events, floor);
  if (!decision.shouldEscalate) return { next: null, decision };
  const next = bumpUp(currentMode);
  if (!next) return { next: null, decision: { ...decision, reason: 'saturated' } };
  return { next, decision };
}

module.exports = { decideFromSamples, evaluate, bumpUp, sampleRatio, MIN_SAMPLES, WINDOW };
