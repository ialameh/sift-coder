'use strict';
// @ts-check
// sift-compress — state cache (state.json) I/O.
// The cache is a performance optimization over the event log: statusline and
// hook reinforcement need "current mode" on every keystroke and shouldn't
// fold 1000 events each time. Truth lives in events.jsonl; this file is a
// memoized fold that's rebuilt on drift.
//
// Hardened against:
//   - symlink redirection at target or parent dir
//   - TOCTOU race (symlink appears between lstat and open): O_NOFOLLOW
//   - oversized payloads (log poisoning)
//   - corrupted JSON (torn write from a crashed process)
//   - invalid mode values (downstream injection into model context)

const fs = require('fs');
const path = require('path');
const { stateCachePath, stateDir } = require('./paths');
const { allNames } = require('./modes');

const MAX_STATE_BYTES = 1024;

function validModeSet() {
  try {
    return new Set(allNames());
  } catch (e) {
    return new Set(['lite', 'full', 'ultra', 'commit', 'review', 'off']);
  }
}

function write(state) {
  try {
    const dir = stateDir();
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

    try {
      if (fs.lstatSync(dir).isSymbolicLink()) return false;
    } catch (e) { return false; }

    const target = stateCachePath();

    try {
      if (fs.lstatSync(target).isSymbolicLink()) return false;
    } catch (e) {
      if (e.code !== 'ENOENT') return false;
    }

    const tempPath = path.join(dir, `.state.${process.pid}.${Date.now()}.tmp`);
    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | O_NOFOLLOW;

    const payload = JSON.stringify(state);
    if (Buffer.byteLength(payload) > MAX_STATE_BYTES) return false;

    let fd;
    try {
      fd = fs.openSync(tempPath, flags, 0o600);
      fs.writeSync(fd, payload);
      try { fs.fchmodSync(fd, 0o600); } catch (e) {}
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
    fs.renameSync(tempPath, target);
    return true;
  } catch (e) {
    return false;
  }
}

function read() {
  try {
    const target = stateCachePath();
    let st;
    try { st = fs.lstatSync(target); } catch (e) { return null; }
    if (st.isSymbolicLink() || !st.isFile()) return null;
    if (st.size > MAX_STATE_BYTES) return null;

    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_RDONLY | O_NOFOLLOW;
    let fd;
    let raw;
    try {
      fd = fs.openSync(target, flags);
      const buf = Buffer.alloc(MAX_STATE_BYTES);
      const n = fs.readSync(fd, buf, 0, MAX_STATE_BYTES, 0);
      raw = buf.slice(0, n).toString('utf8');
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }

    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return null; }
    if (!parsed || typeof parsed !== 'object') return null;
    const modes = validModeSet();
    if (parsed.mode !== null && parsed.mode !== undefined && !modes.has(parsed.mode)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function clear() {
  try { fs.unlinkSync(stateCachePath()); return true; } catch (e) { return false; }
}

module.exports = { read, write, clear };
