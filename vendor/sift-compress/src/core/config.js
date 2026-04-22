'use strict';
// @ts-check
// sift-compress — 4-layer config resolution with provenance.
// Precedence: env var > project (.sift-compress/config.json walking up from
// cwd) > user (~/.config/sift-compress/config.json) > built-in default.
// Every resolved key carries { value, source, layer } so `doctor` can explain
// WHY a given mode is active, not just THAT it is.

const fs = require('fs');
const path = require('path');
const { userConfigPath, projectConfigDirName } = require('./paths');
const { defaultMode, allNames } = require('./modes');

const BUILTIN = {
  defaultMode: () => defaultMode(),
  compressionFloor: 0.45,    // analyzer escalates when observed ratio < this
  escalationWindow: 3,       // consecutive drifting turns before escalation
  enableMetrics: false,
};

const KEY_ORDER = Object.keys(BUILTIN);

function envKey(key) {
  return 'SIFT_COMPRESS_' + key.replace(/([A-Z])/g, '_$1').toUpperCase();
}

function readJsonSafe(p) {
  try {
    const raw = fs.readFileSync(p, 'utf8');
    if (Buffer.byteLength(raw) > 64 * 1024) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function findProjectConfig(startDir) {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, projectConfigDirName(), 'config.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function validate(key, value) {
  if (key === 'defaultMode') {
    if (typeof value !== 'string') return false;
    try { return new Set(allNames()).has(value); } catch (e) { return false; }
  }
  if (key === 'compressionFloor') {
    return typeof value === 'number' && value > 0 && value < 1;
  }
  if (key === 'escalationWindow') {
    return Number.isInteger(value) && value >= 1 && value <= 100;
  }
  if (key === 'enableMetrics') {
    return typeof value === 'boolean';
  }
  return false;
}

function coerce(key, raw) {
  if (key === 'defaultMode') return raw;
  if (key === 'compressionFloor') {
    const n = Number(raw); return Number.isFinite(n) ? n : undefined;
  }
  if (key === 'escalationWindow') {
    const n = parseInt(raw, 10); return Number.isFinite(n) ? n : undefined;
  }
  if (key === 'enableMetrics') {
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    return undefined;
  }
  return undefined;
}

function resolve(key, opts = {}) {
  const cwd = opts.cwd || process.cwd();

  const envV = process.env[envKey(key)];
  if (envV !== undefined) {
    const coerced = coerce(key, envV);
    if (coerced !== undefined && validate(key, coerced)) {
      return { value: coerced, source: 'env', layer: envKey(key) };
    }
  }

  const projectPath = findProjectConfig(cwd);
  if (projectPath) {
    const cfg = readJsonSafe(projectPath);
    if (cfg && key in cfg && validate(key, cfg[key])) {
      return { value: cfg[key], source: 'project', layer: projectPath };
    }
  }

  const userPath = userConfigPath();
  if (fs.existsSync(userPath)) {
    const cfg = readJsonSafe(userPath);
    if (cfg && key in cfg && validate(key, cfg[key])) {
      return { value: cfg[key], source: 'user', layer: userPath };
    }
  }

  const d = BUILTIN[key];
  const value = typeof d === 'function' ? d() : d;
  return { value, source: 'default', layer: 'builtin' };
}

function resolveAll(opts = {}) {
  const out = {};
  for (const k of KEY_ORDER) out[k] = resolve(k, opts);
  return out;
}

module.exports = { resolve, resolveAll, BUILTIN, KEY_ORDER };
