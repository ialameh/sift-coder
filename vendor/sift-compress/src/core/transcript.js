'use strict';
// @ts-check
// sift-compress — transcript reader.
//
// Claude Code's Stop hook receives { transcript_path } (NOT the response
// body). The transcript is JSONL where each line is a conversation event.
// To measure "did this response compress well?" we read the tail of the
// transcript, find the most recent assistant message, find the user prompt
// that preceded it, and return char counts.
//
// What counts as "response" for compression purposes:
//   - Natural-language text emitted by the assistant
//   - NOT tool_use blocks (the model can't compress those)
//   - NOT tool_result blocks (not assistant output)
//
// Defensive parsing: the transcript format is documented as JSONL but
// the per-line shape isn't part of Claude Code's stable ABI. We handle
// multiple common shapes and fail-soft (return null char counts) if a
// line is unparseable. Every silent skip logged when SIFT_DEBUG=1.

const fs = require('fs');
const { log } = require('./logger');

const MAX_TAIL_BYTES = 256 * 1024;  // read at most 256KB from the end
const MAX_LINES_SCAN = 500;

// Tail-read a file: return at most N bytes from the end, plus a flag
// indicating whether the read started mid-file (meaning the first line
// may be truncated and should be discarded).
function tailRead(filePath, maxBytes) {
  const fd = fs.openSync(filePath, 'r');
  try {
    const { size } = fs.fstatSync(fd);
    const bytesToRead = Math.min(size, maxBytes);
    const buf = Buffer.alloc(bytesToRead);
    const startOffset = Math.max(0, size - bytesToRead);
    fs.readSync(fd, buf, 0, bytesToRead, startOffset);
    return { text: buf.toString('utf8'), truncatedStart: startOffset > 0 };
  } finally {
    fs.closeSync(fd);
  }
}

// Extract plain text from a message's content field. Handles:
//   - content: "string"
//   - content: [{type:"text", text:"..."}, {type:"tool_use", ...}]
// Ignores tool_use / tool_result blocks — they aren't prose the model
// could compress.
function extractText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  let out = '';
  for (const block of content) {
    if (!block || typeof block !== 'object') continue;
    if (block.type === 'text' && typeof block.text === 'string') out += block.text;
  }
  return out;
}

// Extract {input_tokens, output_tokens} from an Anthropic usage object if
// one is present. The assistant messages in the transcript often carry the
// API's usage field — when they do, we prefer it over char counts because
// it's the authoritative measure.
function extractUsage(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const u = obj.usage;
  if (!u || typeof u !== 'object') return null;
  const out = {};
  if (typeof u.input_tokens === 'number') out.inputTokens = u.input_tokens;
  if (typeof u.output_tokens === 'number') out.outputTokens = u.output_tokens;
  if (typeof u.cache_read_input_tokens === 'number') out.cacheReadTokens = u.cache_read_input_tokens;
  if (typeof u.cache_creation_input_tokens === 'number') out.cacheCreationTokens = u.cache_creation_input_tokens;
  return Object.keys(out).length > 0 ? out : null;
}

// Normalize a transcript line to a { role, text, usage? } shape, or null
// if the line isn't a message. Handles several observed envelope shapes:
//   - {type:"user"|"assistant", message:{role, content, usage?}}
//   - {role:"user"|"assistant", content:..., usage?}
//   - {type:"user"|"assistant", content:...}
function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;

  // Shape A: {type:"assistant", message:{role, content, usage?}}
  if (entry.message && typeof entry.message === 'object') {
    const role = entry.message.role || entry.type;
    if (role === 'user' || role === 'assistant') {
      const out = { role, text: extractText(entry.message.content) };
      const u = extractUsage(entry.message);
      if (u) out.usage = u;
      return out;
    }
  }

  // Shape B: {role, content, usage?}
  if (entry.role === 'user' || entry.role === 'assistant') {
    const out = { role: entry.role, text: extractText(entry.content) };
    const u = extractUsage(entry);
    if (u) out.usage = u;
    return out;
  }

  // Shape C: {type:"user"|"assistant", content}
  if (entry.type === 'user' || entry.type === 'assistant') {
    return { role: entry.type, text: extractText(entry.content) };
  }

  return null;
}

// Find the most recent assistant turn + the user prompt preceding it.
// Returns { promptChars, responseChars } or null if the transcript doesn't
// contain a well-formed turn pair.
function measureLastTurn(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    log({ kind: 'transcript_missing', path: transcriptPath });
    return null;
  }

  let read;
  try {
    read = tailRead(transcriptPath, MAX_TAIL_BYTES);
  } catch (e) {
    log({ kind: 'transcript_read_failed', path: transcriptPath, error: String(e.message || e) });
    return null;
  }

  // Only drop the first line if our read actually started mid-file;
  // otherwise a short transcript would lose its user prompt.
  const lines = read.text.split('\n').filter(Boolean);
  if (read.truncatedStart && lines.length > 1) lines.shift();

  const entries = [];
  for (const line of lines.slice(-MAX_LINES_SCAN)) {
    let e;
    try { e = JSON.parse(line); } catch (err) { continue; }
    const n = normalizeEntry(e);
    if (n && n.text) entries.push(n);
  }

  // Scan backwards: first assistant found is the response, the closest
  // preceding user is the prompt.
  let response = null;
  let prompt = null;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (!response && entries[i].role === 'assistant') {
      response = entries[i];
      continue;
    }
    if (response && entries[i].role === 'user') {
      prompt = entries[i];
      break;
    }
  }

  if (!response) {
    log({ kind: 'transcript_no_assistant', entriesScanned: entries.length });
    return null;
  }

  const out = {
    promptChars: prompt ? prompt.text.length : 0,
    responseChars: response.text.length,
    hasPromptPair: !!prompt,
  };
  if (response.usage) {
    if (typeof response.usage.outputTokens === 'number') out.responseTokens = response.usage.outputTokens;
    if (typeof response.usage.inputTokens === 'number') out.promptTokens = response.usage.inputTokens;
  }
  return out;
}

module.exports = { measureLastTurn, normalizeEntry, extractText, extractUsage };
