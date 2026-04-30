---
name: local-llm-setup
description: Use when the user wants to set up Ollama for SiftCoder, reduce token costs, or troubleshoot local-LLM drain/embedding issues. Covers install, model selection, env wiring, and verification.
---

# Setting up local LLM for SiftCoder

SiftCoder uses a cascade — **Ollama (local) → Anthropic API → MCP host sampling** — for both summarisation and embeddings. Local LLM cuts steady-state token cost by ~50× on repeat sessions.

## Install Ollama

```bash
# macOS
brew install ollama
brew services start ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
systemctl --user enable --now ollama
```

## Pull recommended models

```bash
ollama pull nomic-embed-text   # 137M params, embeddings
ollama pull llama3.2:3b        # summarisation (small, fast)
# or, for higher quality:
ollama pull llama3.1:8b
```

## Verify

```bash
curl -s http://localhost:11434/api/tags | jq '.models[].name'
siftcoder setup       # writes ~/.siftcoder/v3/config.json with detected backends
siftcoder status      # shows daemon health
```

## Override via env

```bash
export SIFTCODER_DRAIN_BACKEND=ollama
export SIFTCODER_EMBEDDER=ollama
export OLLAMA_HOST=http://localhost:11434
```

Or edit plugin `settings.json`:

```json
{
  "siftcoder": {
    "memory": { "drainBackend": "ollama", "embedder": "ollama" },
    "ollama": { "summarizeModel": "llama3.1:8b" }
  }
}
```

## Troubleshooting

- **Daemon not picking up Ollama:** restart `siftcoder stop && siftcoder start` — backend cascade is resolved at boot.
- **Drain confidence low → escalates to Sonnet:** small models (3b) often score under threshold. Switch to `llama3.1:8b` or raise threshold in settings.
- **Embedding dim mismatch:** if you change embedder mid-stream, run `siftcoder drain --reset-vectors`.
- **Windows + WSL:** Ollama on host is reachable from WSL via `http://host.docker.internal:11434`.

## When NOT to use local LLM

- One-shot critical reasoning (use Sonnet directly via Anthropic).
- Reranking final retrieval (Claude reranker is materially better; cost is small).
