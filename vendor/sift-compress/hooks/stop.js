#!/usr/bin/env node
'use strict';
// sift-compress — Stop hook.
// Receives from Claude Code: { session_id, transcript_path, cwd,
// permission_mode, hook_event_name: "Stop", stop_hook_active }.
//
// The response body lives in transcript_path (JSONL), not in the hook
// payload. We read the tail of the transcript, find the most recent
// assistant turn + preceding user prompt, and record a
// compression_observed event with char counts.
//
// Skipped when stop_hook_active is true — that means we're firing as a
// result of another Stop hook continuing the agent, not a real turn
// boundary, and double-counting would pollute the stats.

const { append } = require('../src/core/eventlog');
const { read: readState } = require('../src/core/flag');
const { timed, log } = require('../src/core/logger');
const { measureLastTurn } = require('../src/core/transcript');

let input = '';
process.stdin.on('data', c => { input += c; });
process.stdin.on('end', () => timed('stop', () => {
  try {
    let data = {};
    try { data = JSON.parse(input); } catch (e) {}

    if (data.stop_hook_active) {
      log({ kind: 'stop_recursive_skip' });
      return;
    }

    const state = readState();
    const mode = state && state.mode;
    const transcriptPath = data.transcript_path || null;

    const measured = transcriptPath ? measureLastTurn(transcriptPath) : null;

    append({
      type: 'compression_observed',
      mode: mode || null,
      promptChars: measured ? measured.promptChars : null,
      responseChars: measured ? measured.responseChars : null,
      promptTokens: (measured && typeof measured.promptTokens === 'number') ? measured.promptTokens : null,
      responseTokens: (measured && typeof measured.responseTokens === 'number') ? measured.responseTokens : null,
      hasPromptPair: measured ? measured.hasPromptPair : null,
      sessionId: data.session_id || null,
    });
  } catch (e) {
    append({ type: 'error', hook: 'stop', error: String((e && e.message) || e) });
  }
}));
