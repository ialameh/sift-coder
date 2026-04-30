# Configuration

SiftCoder reads config in this order (highest priority first):

1. Environment variables
2. `.siftcoder/config.json` in the current project
3. `~/.siftcoder/v3/config.json` (user-global)
4. Plugin-shipped `settings.json` defaults

## Environment variables

| Var | Default | Effect |
|---|---|---|
| `SIFTCODER_NS` | `v3` | Namespace under `~/.siftcoder/` (lets V1/V2/V3 coexist) |
| `SIFTCODER_DRAIN_BACKEND` | `auto` | `ollama` / `anthropic` / `sampling` / `auto` |
| `SIFTCODER_EMBEDDER` | `auto` | `ollama` / `cdg` / `deterministic` / `auto` |
| `ANTHROPIC_API_KEY` | (unset) | Required for Anthropic fallback |
| `SIFTCODER_OLLAMA_HOST` / `OLLAMA_HOST` | `http://localhost:11434` | Ollama endpoint |
| `SIFTCODER_OLLAMA_EMBED_MODEL` | `nomic-embed-text` | Ollama embed model |
| `SIFTCODER_OLLAMA_MODEL` | `llama3.2:3b` | Ollama summarise model |

## Settings.json schema

Plugin defaults at `settings.json` in the plugin root. User config files use the same shape. Top-level key is `siftcoder`.

```json
{
  "siftcoder": {
    "namespace": "v3",
    "memory": {
      "drainBackend": "auto",
      "drainBackendCascade": ["ollama", "anthropic", "sampling"],
      "embedder": "auto",
      "embedderCascade": ["ollama", "cdg", "deterministic"],
      "decay": {
        "tauMs": 604800000,
        "halfLifeDays": 7
      },
      "retrieval": {
        "rrfK": 60,
        "topK": 10,
        "candidateK": 50
      },
      "consolidator": {
        "tickMs": 30000,
        "batchSize": 16
      },
      "summarizer": {
        "modelHaiku": "claude-haiku-4-5-20251001",
        "modelSonnet": "claude-sonnet-4-6",
        "confidenceThreshold": 0.6
      }
    },
    "hooks": {
      "captureObservationBudgetMs": 250,
      "injectMemoriesBudgetMs": 1500,
      "boundaryEnforcerTimeoutMs": 5000
    },
    "ollama": {
      "endpoint": "http://localhost:11434",
      "embedModel": "nomic-embed-text",
      "summarizeModel": "llama3.2:3b"
    }
  }
}
```

## Project scope (`.siftcoder/scope.json`)

Used by the boundary enforcer hook to limit Write/Edit to certain paths.

```json
{
  "allow": [
    "src/**",
    "tests/**",
    "*.md"
  ],
  "deny": [
    "src/secrets/**",
    ".env*"
  ]
}
```

If `scope.json` is absent, all writes are permitted (only the boundary enforcer hook is bypassed; Claude Code's own permissions still apply).

## Backends — what gets chosen

### Drain (summarisation)

`auto` cascade: try in order, first available wins.

1. **Ollama** if `OLLAMA_HOST` is reachable and `summarizeModel` is pulled
2. **Anthropic** if `ANTHROPIC_API_KEY` is set
3. **MCP host sampling** if Claude Code supports `sampling/createMessage` (currently stubbed)

To force one: `SIFTCODER_DRAIN_BACKEND=ollama`.

### Embeddings

`auto` cascade:

1. **Ollama** with `nomic-embed-text` (or configured embed model)
2. **CDG** (Code Dependency Graph remote, if configured)
3. **Deterministic** hash-bucket fallback (always works; lower quality)

Switching embedders mid-corpus produces dim-mismatch errors. Run `siftcoder mem reset-vectors` after a change.

## Verifying config

```bash
node bin/siftcoder.mjs status
```

Reports:
- daemon health
- pending event count
- chosen backends
- memory totals
