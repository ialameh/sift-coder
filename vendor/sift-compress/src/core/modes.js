'use strict';
// @ts-check
// sift-compress — mode registry loader.
// schema/modes.json is the single source of truth. Every whitelist, rule-file
// template, and statusline-case is derived from here via codegen. Drift between
// this module and any generated artifact is a CI failure.

const fs = require('fs');
const { modesSchemaPath } = require('./paths');

let _cache = null;

function loadModeRegistry() {
  if (_cache) return _cache;
  const raw = fs.readFileSync(modesSchemaPath(), 'utf8');
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.modes)) {
    throw new Error('modes.json: missing modes array');
  }
  if (!parsed.defaultMode) {
    throw new Error('modes.json: missing defaultMode');
  }
  _cache = parsed;
  return _cache;
}

function resolveAlias(name) {
  const reg = loadModeRegistry();
  for (const a of reg.aliases || []) {
    if (a.from === name) {
      return {
        canonical: a.to,
        deprecated: !!a.deprecated,
        removeInVersion: a.removeInVersion,
      };
    }
  }
  return { canonical: name, deprecated: false };
}

function getMode(name) {
  if (!name) return null;
  const reg = loadModeRegistry();
  const { canonical } = resolveAlias(name);
  return reg.modes.find(m => m.name === canonical) || null;
}

function defaultMode() {
  return loadModeRegistry().defaultMode;
}

function isIndependent(name) {
  const m = getMode(name);
  return !!(m && m.independent);
}

function modeNames() {
  return loadModeRegistry().modes.map(m => m.name);
}

function allNames() {
  const reg = loadModeRegistry();
  const names = new Set(reg.modes.map(m => m.name));
  for (const a of reg.aliases || []) names.add(a.from);
  return Array.from(names);
}

// Testing hook — clears the module cache without requiring require.cache surgery.
function _reset() { _cache = null; }

module.exports = {
  loadModeRegistry,
  resolveAlias,
  getMode,
  defaultMode,
  isIndependent,
  modeNames,
  allNames,
  _reset,
};
