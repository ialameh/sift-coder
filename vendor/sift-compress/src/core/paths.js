'use strict';
// @ts-check
// sift-compress — centralized path resolution.
// One answer to "where does X live." Every other module asks this one.
// Honors CLAUDE_CONFIG_DIR + XDG for test isolation and multi-profile setups.

const path = require('path');
const os = require('os');

function homeDir() {
  return process.env.HOME || os.homedir();
}

function claudeConfigDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(homeDir(), '.claude');
}

function stateDir() {
  return path.join(claudeConfigDir(), '.sift-compress');
}

function eventLogPath() {
  return path.join(stateDir(), 'events.jsonl');
}

function stateCachePath() {
  return path.join(stateDir(), 'state.json');
}

function debugLogPath() {
  return path.join(stateDir(), 'debug.jsonl');
}

function metricsDbPath() {
  return path.join(stateDir(), 'metrics.duckdb');
}

function userConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'sift-compress');
  }
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(homeDir(), 'AppData', 'Roaming'), 'sift-compress');
  }
  return path.join(homeDir(), '.config', 'sift-compress');
}

function userConfigPath() {
  return path.join(userConfigDir(), 'config.json');
}

function projectConfigDirName() {
  return '.sift-compress';
}

function pluginRoot() {
  return path.resolve(__dirname, '..', '..');
}

function modesSchemaPath() {
  return path.join(pluginRoot(), 'schema', 'modes.json');
}

module.exports = {
  homeDir,
  claudeConfigDir,
  stateDir,
  eventLogPath,
  stateCachePath,
  debugLogPath,
  metricsDbPath,
  userConfigDir,
  userConfigPath,
  projectConfigDirName,
  pluginRoot,
  modesSchemaPath,
};
