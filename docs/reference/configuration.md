# Configuration

SiftCoder reads config from four layers, deepest first. Every key has a typed default in `src/core/config.ts`; deep-merge composes the final object.

## Resolution precedence

1. **Plugin defaults** — `settings.json` at the plugin root, key `siftcoder`.
2. **User-global** — `~/.siftcoder/<ns>/config.json`.
3. **Project** — `<repo>/.siftcoder/config.json`.
4. **Environment** — selected env vars override matching keys.

Each layer is a partial; later layers override earlier ones key-by-key (deep merge for nested objects). Arrays replace whole — they don't concatenate.

`<ns>` is the namespace, set via `SIFTCODER_NS` (default `default`).

The merge implementation: `src/core/config.ts → loadConfig() → layers.reduce(deepMerge, DEFAULTS)`.

## Schema

The full type is `SiftcoderConfig`:

```ts
interface SiftcoderConfig {
  namespace: string;
  memory: {
    drainBackend: 'ollama' | 'anthropic' | 'sampling' | 'auto';
    drainBackendCascade: Array<'ollama' | 'anthropic' | 'sampling'>;
    embedder: 'ollama' | 'cdg' | 'deterministic' | 'auto';
    embedderCascade: Array<'ollama' | 'cdg' | 'deterministic'>;
    decay: { tauMs: number; halfLifeDays: number };
    retrieval: { rrfK: number; topK: number; candidateK: number };
    consolidator: { tickMs: number; batchSize: number };
    summarizer: { modelHaiku: string; modelSonnet: string; confidenceThreshold: number };
  };
  hooks: {
    captureObservationBudgetMs: number;
    injectMemoriesBudgetMs: number;
    boundaryEnforcerTimeoutMs: number;
  };
  ollama: { endpoint: string; embedModel: string; summarizeModel: string };
}
```

## Defaults

The full default object — what you'd get with no config files anywhere:

| Key | Default | Type | What it controls |
|---|---|---|---|
| `namespace` | `"default"` | string | Top-level isolation. Maps to `~/.siftcoder/<namespace>/`. |
| `memory.drainBackend` | `"auto"` | enum | Which backend the daemon uses to summarise raw events. `auto` cascades through `drainBackendCascade`. |
| `memory.drainBackendCascade` | `["ollama","anthropic","sampling"]` | array | Order to try in `auto` mode. First-available wins. |
| `memory.embedder` | `"auto"` | enum | Which embedder produces vectors. |
| `memory.embedderCascade` | `["ollama","cdg","deterministic"]` | array | Order to try in `auto` mode. `deterministic` is the always-available 384-d fallback. |
| `memory.decay.tauMs` | `604_800_000` (7 days) | number | Time decay constant. Lower → faster decay. |
| `memory.decay.halfLifeDays` | `7` | number | Convenience expression of `tauMs`. |
| `memory.retrieval.rrfK` | `60` | number | Reciprocal rank fusion constant. Larger → flatter blend. |
| `memory.retrieval.topK` | `10` | number | How many results retrieval returns by default. |
| `memory.retrieval.candidateK` | `50` | number | Per-leg candidate pool before fusion. |
| `memory.consolidator.tickMs` | `30_000` | number | Daemon's drain tick interval. |
| `memory.consolidator.batchSize` | `16` | number | Raw events per drain pass. |
| `memory.summarizer.modelHaiku` | `"claude-haiku-4-5-20251001"` | string | Anthropic model for short/cheap summaries. |
| `memory.summarizer.modelSonnet` | `"claude-sonnet-4-6"` | string | Anthropic model for harder summaries. |
| `memory.summarizer.confidenceThreshold` | `0.6` | number | Below this, a Haiku summary triggers a Sonnet rerun. |
| `hooks.captureObservationBudgetMs` | `250` | number | Capture hook's max wall time. |
| `hooks.injectMemoriesBudgetMs` | `1500` | number | PreCompact memory injection budget. |
| `hooks.boundaryEnforcerTimeoutMs` | `5000` | number | Boundary enforcer max wall time. |
| `ollama.endpoint` | `"http://localhost:11434"` | string | Ollama base URL. |
| `ollama.embedModel` | `"nomic-embed-text"` | string | Ollama model used for embeddings. |
| `ollama.summarizeModel` | `"llama3.2:3b"` | string | Ollama model used for summaries. |

The plugin's `settings.json` ships these same values explicitly — that's the layer-1 baseline. You can overwrite any of them in your project or user config.

## Opt-in hook keys

Some hooks read additional keys not in the typed schema. They're written in user/project config:

```json
{
  "siftcoder": {
    "hooks": {
      "autoCheckpoint": {
        "enabled": false,
        "everyEdits": 25,
        "everyMs": 1800000
      }
    }
  }
}
```

| Key | Default | Effect |
|---|---|---|
| `hooks.autoCheckpoint.enabled` | `false` | Enable the `auto-checkpoint` PostToolUse hook. |
| `hooks.autoCheckpoint.everyEdits` | `25` | Take a snapshot every N Write/Edit calls. |
| `hooks.autoCheckpoint.everyMs` | `1_800_000` (30 min) | Snapshot every M ms (whichever fires first). |

## Environment variables

Env vars are the last word. They override the merged config object on a per-key basis.

| Variable | Maps to | Effect |
|---|---|---|
| `SIFTCODER_NS` | `namespace` | Namespace under `~/.siftcoder/`. Affects every path. |
| `SIFTCODER_DRAIN_BACKEND` | `memory.drainBackend` | Force backend choice (`ollama` / `anthropic` / `sampling` / `mcp` / `auto`). |
| `SIFTCODER_DRAIN_FALLBACK` | (runtime flag) | If `1`, wraps the primary client in a sampling fallback for transient errors. |
| `SIFTCODER_EMBEDDER` | `memory.embedder` | Force embedder. `deterministic` is always available. |
| `SIFTCODER_OLLAMA_MODEL` | (runtime override) | Override `ollama.summarizeModel` from env. |
| `SIFTCODER_NO_HTTP` | (daemon flag) | If `1`, daemon does not start the web bridge. |
| `SIFTCODER_WORKSPACE_CWD` | (workspace key) | Override the cwd used to derive workspace key (used by hooks). |
| `OLLAMA_HOST` | `ollama.endpoint` | Ollama base URL. |
| `ANTHROPIC_API_KEY` | (backend gate) | Enables the Anthropic backend in cascades. |
| `CLAUDE_PROJECT_DIR` | (workspace key) | Set by the harness; used as cwd for workspace identification. |

## Example overlays

**Per-project, force Anthropic-only**: write `<repo>/.siftcoder/config.json`:

```json
{
  "memory": {
    "drainBackend": "anthropic",
    "drainBackendCascade": ["anthropic"]
  }
}
```

**User-global, use a heavier local model**: write `~/.siftcoder/default/config.json`:

```json
{
  "ollama": {
    "summarizeModel": "qwen2.5-coder:7b"
  }
}
```

**Crank up retrieval**: in either user or project config:

```json
{
  "memory": {
    "retrieval": { "topK": 20, "candidateK": 100 }
  }
}
```

**One-off env override** for a CI run:

```bash
SIFTCODER_DRAIN_BACKEND=anthropic ANTHROPIC_API_KEY=sk-... npx siftcoder drain 64
```

## Validation

The loader is permissive — unknown keys are passed through without error, missing nested objects fall back to defaults via deep merge. Type errors at runtime (e.g. `tickMs: "soon"`) will throw when the daemon reads the value. There's no separate validate-then-load pass — first read is the validator.

If you want to confirm what's actually live, run:

```
siftcoder info --json
```

The merged paths and namespace appear at the top of the output; values are reflected in daemon logs at startup.
