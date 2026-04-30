const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
function box(title, lines, width) {
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
function truncate(s, max) {
    const visible = stripAnsi(s);
    if (visible.length <= max)
        return s;
    return s.slice(0, max - 1) + '…';
}
function stripAnsi(s) {
    return s.replace(/\x1b\[[0-9;]*m/g, '');
}
function statusColor(status) {
    if (status === 'summarized')
        return GREEN;
    if (status === 'skipped')
        return RED;
    return YELLOW;
}
function ts(ms) {
    return new Date(ms).toISOString().replace('T', ' ').slice(0, 19);
}
export function renderWatchSnapshot(storage, opts = {}) {
    const limit = opts.limit ?? 20;
    const width = opts.width ?? 80;
    const counts = readCounts(storage);
    const events = readEventTail(storage, limit);
    const summaries = readSummaryTail(storage, limit);
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
function readCounts(storage) {
    const db = storage['db'];
    /* c8 ignore next -- count(*) always returns a row; the ?? 0 is a defensive type guard */
    const c = (sql) => db.prepare(sql).get()?.c ?? 0;
    return {
        events: c('SELECT count(*) AS c FROM events'),
        raw: c("SELECT count(*) AS c FROM events WHERE status = 'raw'"),
        summarized: c("SELECT count(*) AS c FROM events WHERE status = 'summarized'"),
        skipped: c("SELECT count(*) AS c FROM events WHERE status = 'skipped'"),
        summaries: c('SELECT count(*) AS c FROM summaries'),
        embeddings: c('SELECT count(*) AS c FROM summary_embeddings'),
        superseded: c('SELECT count(DISTINCT older_id) AS c FROM summary_supersedes'),
    };
}
function readEventTail(storage, limit) {
    const db = storage['db'];
    return db.prepare('SELECT id, ts, tool, status FROM events ORDER BY id DESC LIMIT ?').all(limit);
}
function readSummaryTail(storage, limit) {
    const db = storage['db'];
    return db.prepare('SELECT id, ts, model, substr(text, 1, 200) AS text, confidence FROM summaries ORDER BY id DESC LIMIT ?').all(limit);
}
//# sourceMappingURL=tui.js.map