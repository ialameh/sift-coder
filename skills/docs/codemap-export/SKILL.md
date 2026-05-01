---
name: codemap-export
description: Use to export the codemap as machine-readable JSON for downstream tooling. Same data as /codemap, different format. "Export the codemap", "give me the codemap as JSON".
---

# codemap-export

Machine-readable codemap. JSON output. Same data as `/codemap` text rendering, different format.

## Schema

```typescript
interface CodemapExport {
  version: '1';
  generatedAt: string;          // ISO 8601
  repo: { name: string; root: string; commit?: string };
  modules: Array<{
    name: string;
    path: string;
    loc: number;
    coverage?: { lines: number; branches: number; functions: number };
    lastTouched?: string;       // ISO 8601
    publicApi: string[];
    importsFrom: string[];      // module names
    importedBy: string[];
    externalDeps: string[];
    confidence: 'high' | 'med' | 'low';
    confidenceReason?: string;
  }>;
  graph: Array<{ from: string; to: string; weight?: number }>;
  hotspots: Array<{ module: string; reason: string }>;
}
```

## Method

1. Run `/codemap` internally to gather signals.
2. Serialise to the schema above.
3. Write to `codemap.json` (default) or path supplied.
4. Optionally pretty-print.

## Output

JSON file at the chosen path. Stdout summary:

```
Wrote codemap.json
Modules:    5
Edges:      8
Hotspots:   0
Size:       3.2 KB
```

## Rules

- **Schema versioned** — `"version": "1"`. Future changes bump.
- **Stable field names** — downstream consumers depend on them.
- **Optional fields are explicit.** Don't conflate "missing" with "empty".
- **No prose.** This is data, not narrative.

## Anti-patterns

- Adding fields without bumping schema version
- Including LLM-generated commentary in the export
- Inconsistent module naming between graph edges and module list

## When NOT to use

- Human reading — use `/codemap` (text/markdown)
- Tiny repo — manual JSON faster
- Tool-specific format requested (e.g. dependency-cruiser) — use that tool

## Subagent dispatch

- Same as `/codemap` — chain it

## Value over native CC

CC won't naturally produce a stable, versioned, machine-readable schema for codebase metadata. The schema IS the value — feeds dashboards, drift monitors, CI checks.
