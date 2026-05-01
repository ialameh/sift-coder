# Configuration

SiftCoder reads configuration from three layers, highest priority first:

1. **Environment variables** (per-shell, per-process)
2. **Project config** at `.siftcoder/config.json` (committed with the repo, optional)
3. **User config** at `~/.siftcoder/config.json` (global, optional)
4. **Plugin defaults** in `settings.json` (shipped)

## Environment variables

### Drain (summarization) backend

| Variable | Default | Values |
|---|---|---|
| `SIFTCODER_DRAIN_BACKEND` | auto | `ollama` · `anthropic` · `mcp` · `auto` |
| `SIFTCODER_OLLAMA_HOST` | `http://localhost:11434` | URL |
| `SIFTCODER_OLLAMA_MODEL` | `llama3.2:3b` | any pulled Ollama model |
| `ANTHROPIC_API_KEY` | unset | required for `anthropic` backend |
| `SIFTCODER_ANTHROPIC_API_KEY` | unset | scoped key (preferred over the global) |

Auto-detect order: Ollama (local, free) → Anthropic (paid) → MCP host sampling (currently unsupported by Claude Code).

### Embedder

| Variable | Default | Values |
|---|---|---|
| `SIFTCODER_EMBEDDER` | auto | `ollama` · `cdg` · `deterministic` · `auto` |
| `SIFTCODER_OLLAMA_EMBED_MODEL` | `nomic-embed-text` | any embedding model |
| `SIFTCODER_OLLAMA_EMBED_DIM` | `768` | match the model |
| `SIFTCODER_CDG_URL` | unset | remote CDG service URL |
| `SIFTCODER_CDG_TOKEN` | unset | optional Bearer for CDG |

Auto-detect order: CDG (if `SIFTCODER_CDG_URL` set) → Ollama (`nomic-embed-text` loaded) → DeterministicEmbedder (hash-bucket, fallback only).

### Memory daemon

| Variable | Default | Purpose |
|---|---|---|
| `SIFTCODER_NS` | unset | Optional namespace under `~/.siftcoder/` (lets multiple installs coexist) |
| `SIFTCODER_NO_HTTP` | unset | Set to `1` to disable the web bridge |
| `SIFTCODER_HTTP_PORT` | derived from workspace key | Override the HTTP bridge port |
| `SIFTCODER_RERANK` | unset | Set to `1` to enable Claude cross-encoder rerank in `mem_search` |

### CLI

| Variable | Default | Purpose |
|---|---|---|
| `CLAUDE_PROJECT_DIR` | `pwd` | Workspace cwd resolution; matches the directory Claude Code launched from |

## `settings.json`

Plugin defaults. Override via project's `.claude/settings.json` or user's `~/.claude/settings.json`.

```json
{
  "siftcoder": {
    "hooks": {
      "autoCheckpoint": { "enabled": false }
    },
    "memory": {
      "drain": {
        "batchSize": 16,
        "maxRetries": 3
      },
      "retrieval": {
        "rrfK": 60,
        "decayTauHours": 168
      }
    }
  }
}
```

## Per-project `.siftcoder/`

Optional directory committed with the repo:

```
.siftcoder/
├── config.json        # project-level overrides
├── scope.json         # boundary-enforcer hook allow-globs
└── privacy.json       # custom redaction patterns
```

### `scope.json` example

```json
{
  "allow": ["src/**", "test/**", "docs/**"],
  "deny": ["secrets/**", "**/.env*"]
}
```

The `boundary-enforcer.mjs` hook reads this and blocks Write/Edit outside the allow-globs.

## See also

- [troubleshooting.md](TROUBLESHOOTING.md) — when configuration looks wrong
- [memory.md](MEMORY.md) — what each backend choice does
