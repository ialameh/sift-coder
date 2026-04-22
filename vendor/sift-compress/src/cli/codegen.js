#!/usr/bin/env node
'use strict';
// sift-compress — codegen. Regenerates every downstream surface from
// schema/modes.json. Running `npm run codegen` rebuilds:
//   - skills/sift-compress/SKILL.md             (Claude Code / Codex)
//   - .cursor/rules/sift-compress.mdc           (Cursor)
//   - .windsurf/rules/sift-compress.md          (Windsurf)
//   - .clinerules/sift-compress.md              (Cline)
//   - .github/copilot-instructions.md           (Copilot)
//   - GEMINI.md                                 (Gemini CLI)
//   - AGENTS.md                                 (generic AI agent target)
//
// CI runs `npm run codegen:check` which regenerates and fails on git diff.
// Every surface fans out from the same body — no hand-maintained duplicates.

const fs = require('fs');
const path = require('path');
const { loadModeRegistry } = require('../core/modes');
const { pluginRoot } = require('../core/paths');

// ---------------------------------------------------------------------------
// The canonical body. Every surface renders this with surface-specific
// frontmatter (or a prose wrapper) on top.
// ---------------------------------------------------------------------------
function canonicalBody(reg) {
  const visible = reg.modes.filter(m => !m.sentinel);
  const intensity = visible.filter(m => !m.independent);
  const independent = visible.filter(m => m.independent);

  const lines = [];
  lines.push('# sift-compress');
  lines.push('');
  lines.push('Respond compressed but technically exact. Fluff dies; substance stays. Drop articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries (sure/certainly/of course/happy to), hedging (possibly/likely/might). Fragments OK. Short synonyms. Technical terms exact. Code blocks unchanged. Errors quoted exact.');
  lines.push('');
  lines.push('## Intensity modes');
  lines.push('');
  lines.push('| Mode | Behavior |');
  lines.push('|------|----------|');
  for (const m of intensity) {
    lines.push('| **' + m.name + '** | ' + m.description + ' |');
  }
  lines.push('');
  if (independent.length > 0) {
    lines.push('## Independent modes');
    lines.push('');
    for (const m of independent) {
      lines.push('- **' + m.name + '** — ' + m.description);
    }
    lines.push('');
  }
  lines.push('## Rules per mode');
  lines.push('');
  for (const m of visible) {
    if (!m.rules) continue;
    lines.push('### ' + m.name);
    lines.push('');
    lines.push(m.rules);
    lines.push('');
  }
  lines.push('## Activation');
  lines.push('');
  lines.push('- `/sift-compress` — default (' + reg.defaultMode + ')');
  for (const m of intensity) {
    if (m.name === reg.defaultMode) continue;
    lines.push('- `/sift-compress ' + m.name + '` — ' + m.description.toLowerCase());
  }
  lines.push('- `/sift-compress off` or "stop sift-compress" or "normal mode" — deactivate');
  lines.push('');
  lines.push('## Persistence');
  lines.push('');
  lines.push('Active every response once set. No drift after many turns. Off only with explicit deactivation.');
  lines.push('');
  lines.push('## Auto-clarity (drop compression for)');
  lines.push('');
  lines.push('- Security warnings and irreversible actions');
  lines.push('- Multi-step sequences where fragment order risks misread');
  lines.push('- User confusion or repeat-questions');
  lines.push('');
  lines.push('Resume compression after the clear part is done.');
  lines.push('');
  lines.push('## Boundaries');
  lines.push('');
  lines.push('Code, commits, PR descriptions: write normal prose. Compression applies to natural-language explanation only.');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Surface renderers. Each returns final file contents.
// ---------------------------------------------------------------------------

function renderSkillMd(reg, body) {
  const visible = reg.modes.filter(m => !m.sentinel).map(m => m.name).join(', ');
  const fm = [
    '---',
    'name: sift-compress',
    'description: >',
    '  Measured output compression for AI coding agents. Drops articles, filler,',
    '  hedging; keeps technical substance exact. Modes: ' + visible + '.',
    '  Active via `/sift-compress [mode]` or "activate sift-compress".',
    '  Off via "stop sift-compress" or `/sift-compress off`.',
    '---',
    '',
  ].join('\n');
  return fm + body + '\n';
}

function renderCursorRule(body) {
  const fm = [
    '---',
    'description: sift-compress output compression for coding agents',
    'alwaysApply: true',
    '---',
    '',
  ].join('\n');
  return fm + body + '\n';
}

function renderWindsurfRule(body) {
  const fm = [
    '---',
    'trigger: always_on',
    'description: sift-compress output compression',
    '---',
    '',
  ].join('\n');
  return fm + body + '\n';
}

function renderClineRule(body) {
  return body + '\n';  // plain markdown, Cline auto-discovers .clinerules/
}

function renderCopilotInstructions(body) {
  // Copilot loads .github/copilot-instructions.md repo-wide. Prefix a one-line
  // context marker so it's obvious what this file controls when someone opens it.
  return '# Copilot instructions (sift-compress)\n\n' + body + '\n';
}

function renderGeminiMd(body) {
  return body + '\n';
}

function renderAgentsMd(body) {
  return '# AGENTS.md\n\n' + body + '\n';
}

// ---------------------------------------------------------------------------
// Generator driver.
// ---------------------------------------------------------------------------

function write(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
  console.log('wrote ' + path.relative(pluginRoot(), filePath));
}

function main() {
  const reg = loadModeRegistry();
  const root = pluginRoot();
  const body = canonicalBody(reg);

  write(path.join(root, 'skills', 'sift-compress', 'SKILL.md'),  renderSkillMd(reg, body));
  write(path.join(root, '.cursor', 'rules', 'sift-compress.mdc'), renderCursorRule(body));
  write(path.join(root, '.windsurf', 'rules', 'sift-compress.md'), renderWindsurfRule(body));
  write(path.join(root, '.clinerules', 'sift-compress.md'),       renderClineRule(body));
  write(path.join(root, '.github', 'copilot-instructions.md'),    renderCopilotInstructions(body));
  write(path.join(root, 'GEMINI.md'),                             renderGeminiMd(body));
  write(path.join(root, 'AGENTS.md'),                             renderAgentsMd(body));
}

main();
