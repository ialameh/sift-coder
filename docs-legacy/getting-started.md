# Getting Started

Five minutes from zero to a running SiftCoder install with persistent memory.

## Prerequisites

- **Claude Code** (desktop or CLI)
- **Node.js ≥ 20**
- **Ollama** (recommended; required only for local-LLM summarisation and embeddings)

## Step 1: install Ollama

Skip this if you already have Ollama. Without Ollama, drain falls back to the Anthropic API (paid) or stays disabled (raw-only mode).

```bash
brew install ollama
brew services start ollama        # macOS launchd
ollama pull llama3.2:3b           # ~2 GB summarisation model
ollama pull nomic-embed-text      # ~150 MB embedding model (768-dim)
```

Verify:

```bash
curl -s http://localhost:11434/api/tags | jq '.models[].name'
```

## Step 2: install the plugin

In Claude Code:

```
/plugin marketplace add ialameh/sift-coder
/plugin install siftcoder
```

This clones the repo into `~/.claude/plugins/cache/`, runs `npm install` (postinstall builds the daemon), and registers the plugin.

## Step 3: first session

Open Claude Code in any project directory. The SessionStart hook spawns the memory daemon for that workspace automatically.

If this is your first time in a workspace, the hook will print a one-line nudge suggesting `/siftcoder:mem setup`. Run it:

```
/siftcoder:mem setup
```

The orchestrator walks five phases, narrating each step:

1. Daemon health check (auto-spawn if down)
2. Read current capture state
3. Optional backfill from past Claude Code transcripts
4. Drain captured events into summaries
5. Mark workspace onboarded

## Step 4: confirm everything works

```
/siftcoder:mem status
```

You should see capture counts, drain coverage, and current backend choices. Open the dashboard:

```
/siftcoder:mem web
```

A browser window opens at `http://127.0.0.1:<port>?token=<token>` with six tabs (overview, events, summaries, search, provenance, A/B savings).

## What's next

- **Try the Salesforce commands:** `/siftcoder:sf-architect`, `/siftcoder:lwc create`, `/siftcoder:apex-patterns`
- **Read [usage.md](USAGE.md)** for day-to-day patterns
- **Browse [commands.md](commands.md)** for the full command catalog
- **Check [troubleshooting.md](TROUBLESHOOTING.md)** if something didn't work

## Optional: configure backends

SiftCoder auto-detects available backends in this order:

| Component | Auto-detect order | Override env var |
|---|---|---|
| Drain LLM | Ollama → Anthropic → MCP sampling | `SIFTCODER_DRAIN_BACKEND` |
| Embedder | Ollama → CDG (remote) → deterministic | `SIFTCODER_EMBEDDER` |

To force the Anthropic backend:

```bash
export SIFTCODER_DRAIN_BACKEND=anthropic
export ANTHROPIC_API_KEY=sk-...
# restart Claude Code so the MCP server picks up the env
```

Full reference in [configuration.md](CONFIG.md).
