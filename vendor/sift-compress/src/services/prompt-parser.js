'use strict';
// @ts-check
// sift-compress — pure prompt parser: string → Intent. No I/O; exhaustively
// table-testable.
//
// Intent kinds:
//   - activate    : "turn on with default mode"
//   - deactivate  : "turn off"
//   - switch      : "change to mode X"
//   - none        : no sift-compress-relevant content

const { allNames, resolveAlias } = require('../core/modes');

function parse(prompt) {
  if (typeof prompt !== 'string') return { kind: 'none' };
  const p = prompt.trim().toLowerCase();
  if (!p) return { kind: 'none' };

  // Deactivation wins over activation when both shapes match the same sentence.
  if (/\b(stop|disable|deactivate|turn\s+off)\b.*\bsift[\s-]?compress\b/i.test(p)
   || /\bsift[\s-]?compress\b.*\b(stop|disable|deactivate|turn\s+off)\b/i.test(p)
   || /\bnormal\s+mode\b/i.test(p)) {
    return { kind: 'deactivate' };
  }

  // Slash command: /sift-compress [mode] or /siftcoder:compress [mode]
  const slashMatch = p.match(/^\/(?:sift[- ]compress|siftcoder:compress)(?:\s+(\S+))?/);
  if (slashMatch) {
    const arg = slashMatch[1];
    if (!arg) return { kind: 'activate' };

    const known = new Set(allNames());
    if (!known.has(arg)) return { kind: 'none' };
    if (arg === 'off') return { kind: 'deactivate' };

    const { canonical } = resolveAlias(arg);
    return {
      kind: 'switch',
      mode: canonical,
      aliasUsed: arg !== canonical,
      aliasFrom: arg !== canonical ? arg : undefined,
    };
  }

  // Natural language activation.
  if (/\b(activate|enable|turn\s+on|start|use|talk\s+like)\b.*\bsift[\s-]?compress\b/i.test(p)
   || /\bsift[\s-]?compress\b.*\b(mode|on)\b/i.test(p)) {
    return { kind: 'activate' };
  }

  return { kind: 'none' };
}

module.exports = { parse };
