'use strict';
// @ts-check
// sift-compress — builds the per-turn additionalContext reminder.
// Independent modes (commit/review) own their behavior via their own skill
// files and get no base reinforcement — conflicting instructions cost the
// model's attention budget.

const { getMode, isIndependent } = require('../core/modes');

function build(currentMode) {
  if (!currentMode || currentMode === 'off') return null;
  if (isIndependent(currentMode)) return null;
  const m = getMode(currentMode);
  if (!m || !m.rules) return null;
  return 'SIFT-COMPRESS ACTIVE (' + currentMode + '). ' + m.rules
       + ' Code/commits/security warnings: write normal prose.';
}

module.exports = { build };
