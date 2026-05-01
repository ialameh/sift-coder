# Foundations

This tab is the conceptual core of the guide. By the end of it, you should be able to explain to a colleague what SiftCoder does, why it does it that way, and what the consequences are when something goes wrong.

The chapters are ordered from most to least essential. If you only have time for two, read [Mental model](mental-model.md) and [Architecture overview](architecture.md). The rest fill in detail.

- [Mental model](mental-model.md) — the four moving parts and how they relate.
- [Architecture overview](architecture.md) — the components on disk, the processes at runtime, the data flowing between them.
- [The memory model](memory-model.md) — events, summaries, embeddings, sessions, and how they fit in SQLite.
- [Retrieval and ranking](retrieval.md) — how a query becomes a list of relevant memories.
- [Namespaces and workspaces](namespaces.md) — what isolation looks like and how it's keyed.
- [Backends](backends.md) — Ollama, Anthropic, deterministic, sampling. When each one runs.
- [Hooks lifecycle](hooks.md) — what fires when, and how the hooks integrate with Claude Code.
