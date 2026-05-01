# Mental model

SiftCoder has four moving parts. Once you can name them, the rest of the documentation makes sense as detail rather than as new ideas.

## The four parts

**1. Hooks.** Small Node scripts that Claude Code runs around your tool calls. Before a `Write` they check whether the path is in scope. After every interesting tool call they push a record of what happened to the daemon. They are the *eyes and ears* — without hooks, nothing is captured.

**2. The daemon.** A long-running Node process per workspace, listening on a Unix domain socket. It receives capture events from the hooks, redacts secrets, writes them to a WAL, persists them in SQLite, and (in the background) summarises them and computes embeddings. It is the *brain* — the thing that holds memory.

**3. The store.** A SQLite database per workspace under `~/.siftcoder/<namespace>/workspaces/<key>/db.sqlite`, plus a WAL alongside it for crash safety. Three main tables: `events` (raw captures), `summaries` (LLM-condensed versions), and `summary_embeddings` (vectors for semantic search). It is the *body* — durable, inspectable, exportable.

**4. Retrieval.** When Claude needs context, the hooks ask the daemon for the most relevant memories given a query. The daemon does a hybrid search — BM25 over text plus cosine similarity over embeddings, fused with reciprocal rank fusion, then reweighted by a time-decay factor — and returns the top hits. It is the *recall* — the only path through which memory affects what Claude sees.

That's it. Four parts. Hooks → daemon → store → retrieval, in a loop.

## Why a daemon?

The honest reason: **summarisation and embedding are slow, and we don't want to block your editing**. If every `Write` synchronously called an LLM to summarise itself, your CLI would feel laggy. The daemon decouples capture (fast — write to WAL, queue in SQLite) from consolidation (slow — call Ollama, compute embeddings, update tables). The hook returns in a few milliseconds. The daemon catches up in the background.

The secondary reason: **multiple Claude Code sessions can be running at once** (one project in one terminal, another project in another). Each gets its own daemon, keyed by workspace. They never see each other's memory. There's no cross-talk.

## Why per-workspace?

Memory has to be scoped to *something*. Per-user is too broad — your work codebase shouldn't surface in your hobby project. Per-session is too narrow — that's the problem we're trying to fix in the first place. Per-workspace is the right unit: a directory with code in it, the thing you `cd` into to work on. SiftCoder keys workspaces by the SHA-256 of the absolute path of the git toplevel (or the directory itself if there's no git repo), truncated to 12 hex chars. Two terminals open in the same project share the same daemon and the same memory. Two projects in different directories don't.

## Why SQLite?

Three reasons.

**It's a file.** You can `cp` it, back it up, inspect it with `sqlite3`. Nothing magic. If SiftCoder ever annoys you, you can read your own memory directly with SQL.

**It's local.** No server to run, no cloud bill, no GDPR question about where your captured code is sitting. The data is on your laptop, in your home directory, owned by your user.

**It's enough.** A real-world workspace generates somewhere between 100 and 5000 events per day. SQLite handles that effortlessly — the database stays under 100 MiB even after a year of heavy use. We have benchmarks showing reads under a millisecond on a 50,000-row event table.

## Why Ollama by default?

Because the cost of *not having* memory is paying Anthropic to re-explain your project every morning, and the cost of *having* memory through the Anthropic API is paying Anthropic to summarise everything you do. Ollama lets you skip both bills. A laptop with 16 GB of RAM can run `llama3.2:3b` for summarisation and `nomic-embed-text` for embeddings comfortably in the background. The summarisation model doesn't need to be brilliant — it's compressing tool-call payloads into searchable text, which is well within the capabilities of a 3B parameter model.

Anthropic remains available as a fallback, and for high-stakes summarisation (code review, architectural reasoning) some of the skills explicitly ask for Sonnet via the sampling API. But the *default path* is Ollama, and it should stay that way unless you have a reason to change it.

## Why hooks instead of just MCP?

SiftCoder also exposes an MCP server, so Claude can directly call `mem_search`, `mem_get`, `mem_timeline`. But the *capture* side runs through hooks, not MCP. Why?

Because **capture should be invisible**. If memory required Claude to explicitly call a `capture_this` tool, the LLM would forget. Some sessions would be remembered, some wouldn't, and you'd never know which. By hooking `PostToolUse` we guarantee that every tool call is captured *whether or not Claude thinks about memory*. The capture path doesn't depend on the LLM's attention.

Retrieval is different. Claude *should* be the one deciding when to ask for context, because only Claude knows what the user's question is about. So retrieval is exposed as MCP tools, called explicitly when relevant, and capture is wired automatically through hooks. The asymmetry is deliberate.

## A worked example

You ask Claude: "fix the TypeError in `auth/middleware.ts`."

1. Claude reads the file. The `Read` tool fires; the `PostToolUse` hook captures the read with a hash of the file content; the daemon writes it to the events table.
2. Claude greps for callers of the broken function. The `Grep` tool fires; another event captured.
3. Claude writes the fix. `PreToolUse` checks the path against the scope file (allowed). `Write` runs. `PostToolUse` captures the change with a diff.
4. The daemon's consolidator wakes up thirty seconds later, sees four raw events, and asks Ollama to summarise them. The summary reads roughly: "Fixed null-deref in `auth/middleware.ts:42` where `req.user` was assumed non-null after a malformed token. Added a guard that returns 401 instead of throwing."
5. The embedder turns that summary into a 384-dimension vector and stores it.

A week later you ask Claude: "didn't we fix something around malformed auth tokens?"

1. Claude calls `mem_search` with the query.
2. Hybrid retrieval ranks the summary highly (matches "auth" lexically, "malformed token" semantically, recency factor still strong).
3. The summary comes back into Claude's context.
4. Claude reminds you of the fix and points at the file and line. You go look. The fix is there.

That is the whole loop. Capture in the background, consolidate in the background, retrieve on demand, and Claude treats the result as additional context in its prompt.

## What this is not

**It is not a vector database for your whole filesystem.** SiftCoder remembers what you and Claude did *together*. It does not crawl, index, or watch files outside of tool calls. If you want full-codebase semantic search, you want a different tool.

**It is not a replacement for git.** The store is durable, but it's a record of *interactions*, not a system of record for your code. Don't lose your repository because you trust the capture log to recover it.

**It is not a multi-user system.** Each user has their own daemon, their own database, their own memory. Sharing is currently a manual export-and-import path; team-shared memory is on the roadmap but not in the box.

With those four parts named and the boundaries clear, the rest of the guide is mostly *how each part is implemented* and *what knobs are exposed.* That's where we go next.
