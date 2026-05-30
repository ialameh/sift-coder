// Pure helper: from a session digest (newline-joined `[tool] (NN%) text` lines), pick the lines
// that read like durable conventions/decisions worth folding into CLAUDE.md. The Stop hook uses
// the count to decide whether to surface an advisory hint. Heuristic by design — the real
// classification + diff happens on demand in /siftcoder:knowledge.
const MARK = /\b(convention|always|never|must|prefer|pattern:|decision:|gotcha|invariant)\b/i;

export function pickConventionLearnings(text, minConf = 60) {
  if (!text) return [];
  return text.split('\n').filter((line) => {
    const m = line.match(/\((\d+)%\)/);
    const conf = m ? Number(m[1]) : 100;
    return conf >= minConf && MARK.test(line);
  });
}
