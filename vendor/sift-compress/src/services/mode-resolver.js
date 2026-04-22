'use strict';
// @ts-check
// sift-compress — pure resolver. (Intent, currentMode) → NextMode decision.
// Pure: no side effects, no I/O. The hook orchestrates the effects.

const { resolve: resolveConfig } = require('../core/config');

function decide(intent, currentMode, opts = {}) {
  if (!intent || intent.kind === 'none') {
    return { nextMode: currentMode, reason: 'no_change' };
  }
  if (intent.kind === 'deactivate') {
    return { nextMode: null, reason: 'deactivated' };
  }
  if (intent.kind === 'activate') {
    const def = resolveConfig('defaultMode', opts).value;
    if (def === 'off') return { nextMode: null, reason: 'default_is_off' };
    return { nextMode: def, reason: 'activated_default' };
  }
  if (intent.kind === 'switch' && intent.mode) {
    return { nextMode: intent.mode, reason: 'switched' };
  }
  return { nextMode: currentMode, reason: 'unknown_intent' };
}

module.exports = { decide };
