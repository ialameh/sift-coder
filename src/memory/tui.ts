/**
 * Snapshot-style TUI renderer for the memory store.
 * Pure function: takes a Storage handle, returns an ANSI-rendered string.
 * No interactive event loop — invokers wrap this in setInterval if they want a live dashboard.
 */
import type { Storage } from './storage/storage.js';

export interface WatchOptions {
  limit?: number;
  width?: number;
}

interface EventTailRow { id: number; ts: number; tool: string; status: string }
interface SummaryTailRow { id: number; ts: number; model: string; text: string; confidence: number | null }

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

function box(title: string, lines: string[], width: number): string {
  const top = `╔${'═'.repeat(width - 2)}╗`;
  const bottom = `╚${'═'.repeat(width - 2)}╝`;
  const titleBar = `║ ${BOLD}${title}${RESET}${' '.repeat(Math.max(0, width - 4 - stripAnsi(title).length))} ║`;
  const sep = `╟${'─'.repeat(width - 2)}╢`;
  const body = lines.map(l => {
    const truncated = truncate(l, width - 4);
    return `║ ${truncated}${' '.repeat(Math.max(0, width - 4 - stripAnsi(truncated).length))} ║`;
  });
  return [top, titleBar, sep, ...body, bottom].join('\n') + '\n';
}

function truncate(s: string, max: number): string {
  const visible = stripAnsi(s);
  if (visible.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

function statusColor(status: string): string {
  if (status === 'summarized') return GREEN;
  if (status === 'skipped') return RED;
  return YELLOW;
}

function ts(ms: number): string {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19);
}

export async function renderWatchSnapshot(storage: Storage, opts: WatchOptions = {}): Promise<string> {
  const limit = opts.limit ?? 20;
  const width = opts.width ?? 80;

  const counts = await readCounts(storage);
  const events = await readEventTail(storage, limit);
  const summaries = await readSummaryTail(storage, limit);

  const header = box('SiftCoder Memory — Snapshot', [
    `${DIM}Captured at${RESET} ${ts(Date.now())}`,
    `${CYAN}events${RESET} ${counts.events}   ${CYAN}raw${RESET} ${counts.raw}   ${CYAN}summarized${RESET} ${counts.summarized}   ${CYAN}skipped${RESET} ${counts.skipped}`,
    `${CYAN}summaries${RESET} ${counts.summaries}   ${CYAN}embeddings${RESET} ${counts.embeddings}   ${CYAN}superseded${RESET} ${counts.superseded}`,
  ], width);

  const evLines = events.length === 0
    ? [`${DIM}no events yet${RESET}`]
    : events.map(e => `${ts(e.ts)}  ${e.tool.padEnd(8)} ${statusColor(e.status)}${e.status.padEnd(11)}${RESET} #${e.id}`);

  const sumLines = summaries.length === 0
    ? [`${DIM}no summaries yet${RESET}`]
    : summaries.map(s => `#${String(s.id).padStart(3)}  ${(s.confidence ?? 0).toFixed(2)}  ${s.text}`);

  return [
    header,
    box(`Recent events (last ${events.length})`, evLines, width),
    box(`Recent summaries (last ${summaries.length})`, sumLines, width),
  ].join('');
}

async function readCounts(storage: Storage): Promise<{
  events: number; raw: number; summarized: number; skipped: number;
  summaries: number; embeddings: number; superseded: number;
}> {
  return {
    events:      await storage.countAll('events'),
    raw:         await storage.countByStatus('raw'),
    summarized:  await storage.countByStatus('summarized'),
    skipped:     await storage.countByStatus('skipped'),
    summaries:   await storage.countAll('summaries'),
    embeddings:  await storage.countAll('summary_embeddings'),
    superseded:  await storage.countSupersededDistinct(),
  };
}

async function readEventTail(storage: Storage, limit: number): Promise<EventTailRow[]> {
  const rows = await storage.eventTail(limit);
  return rows.map(r => ({ id: r.id, ts: r.ts, tool: r.tool, status: r.status }));
}

async function readSummaryTail(storage: Storage, limit: number): Promise<SummaryTailRow[]> {
  return await storage.summaryTail(limit) as SummaryTailRow[];
}
