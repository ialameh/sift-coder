/**
 * Auto-edge inference for captured events.
 *
 * Without this, the provenance graph stays empty until a human (or CDG ingest) calls
 * `addEdge` directly — meaning `mem_graph_subgraph` and `mem_graph_hubs` are useless on a
 * fresh workspace. Inference here is intentionally cheap and conservative: only structural
 * relationships that fall out of the event payload itself, no NLP or model calls.
 *
 * Three patterns produce edges:
 *
 *   1. Edit / Write / Read / MultiEdit / NotebookEdit — payload typically contains
 *      `file_path` (Claude Code's tool input shape). Adds `event:<id> --edits--> file:<path>`.
 *
 *   2. Bash — extract path-like tokens from the command string (slash-separated tokens
 *      ending in a recognizable extension or starting with /, ./, ../, ~/). Adds
 *      `event:<id> --references--> file:<path>` for each.
 *
 *   3. Sequential events in the same session: every captured event gains a
 *      `event:<newId> --derives_from--> event:<prevId>` edge to the immediately preceding
 *      event in that session. Builds a chronological chain that BFS can traverse.
 *
 * All edges are written with `source = 'auto'` so callers can distinguish inferred edges
 * from human-curated or CDG-imported ones.
 */
import type { Storage } from './storage/storage.js';
import type { ProvenanceStore } from './provenance.js';

const FILE_TOOLS = new Set(['Edit', 'Write', 'Read', 'MultiEdit', 'NotebookEdit']);

const PATH_LIKE = /(?:^|[\s'"`(])((?:~\/|\.{1,2}\/|\/)[A-Za-z0-9._\-/]+)/g;
const EXT_LIKE = /(?:^|[\s'"`(])([A-Za-z0-9._\-/]+\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|rb|java|kt|swift|cs|cpp|c|h|hpp|md|yaml|yml|json|sql|sh|toml|html|css))(?=[\s'"`)]|$)/g;

export interface AutoEdgeOptions {
  /** Skip the chronological-chain edge. Useful when the caller knows the prior event is
   *  unrelated (e.g. session resumes after a long break). */
  skipChain?: boolean;
}

export async function inferEdgesForEvent(
  storage: Storage,
  prov: ProvenanceStore,
  eventId: number,
  sessionId: string,
  tool: string,
  payload: unknown,
  ts: number,
  opts: AutoEdgeOptions = {},
): Promise<number> {
  let written = 0;
  const eventNode = { kind: 'event', id: String(eventId) };

  // 1. file-tool → file edits edge
  if (FILE_TOOLS.has(tool) && isObject(payload)) {
    const filePath = pickString(payload, 'file_path') ?? pickString(payload, 'path') ?? pickString(payload, 'notebook_path');
    if (filePath) {
      await prov.addEdge({
        from: eventNode,
        to: { kind: 'file', id: filePath },
        edgeType: 'edits',
        source: 'auto',
        ts,
      });
      written++;
    }
  }

  // 2. Bash → references edges for every path-like token in the command
  if (tool === 'Bash' && isObject(payload)) {
    const command = pickString(payload, 'command');
    if (command) {
      const seen = new Set<string>();
      for (const re of [PATH_LIKE, EXT_LIKE]) {
        re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(command)) !== null) {
          const cap = match[1];
          if (cap && !seen.has(cap)) {
            seen.add(cap);
          }
        }
      }
      for (const path of seen) {
        await prov.addEdge({
          from: eventNode,
          to: { kind: 'file', id: path },
          edgeType: 'references',
          source: 'auto',
          ts,
        });
        written++;
      }
    }
  }

  // 3. derives_from chain to the previous event in the session
  if (!opts.skipChain) {
    const prevId = await storage.previousEventInSession(sessionId, eventId);
    if (prevId !== null) {
      await prov.addEdge({
        from: eventNode,
        to: { kind: 'event', id: String(prevId) },
        edgeType: 'derives_from',
        source: 'auto',
        ts,
      });
      written++;
    }
  }

  return written;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pickString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}
