# When to reach for SiftCoder

There is a temptation, with any tool that ships with this much surface area, to install it everywhere and use it for everything. Don't. Memory is genuinely useful in some situations and pure overhead in others. This page is honest about which is which.

## Reach for it when…

### You work on the same project for weeks or months

This is the canonical case. Memory pays for itself when you have *recurring context* — files you keep returning to, design decisions that shape the next decision, bugs you've half-fixed before. The longer you spend in a codebase, the more SiftCoder helps, because each session has more shared state to draw from. By month three of a project, the difference between "Claude knows the codebase" and "Claude is meeting it for the first time every morning" is night-and-day.

### Your project has heavy domain context

A vanilla Express API doesn't really need memory. The framework is well-known, the patterns are conventional, Claude can pick it up from a few file reads. But a Salesforce org with 200 custom objects, a financial trading system with weird domain primitives, a research codebase where the math matters — these are projects where a fresh Claude session takes ten minutes to spin up to useful, every time. SiftCoder collapses that ramp.

### You hand work back and forth between sessions

If you start a feature on Monday, leave it half-done, and come back Wednesday — that's where memory wins. You don't have to re-explain what you decided, what you tried, what you ruled out. The retrieval system pulls the relevant Monday work back into context the moment you ask about it.

### You want a real audit trail

Every tool call Claude makes is captured to a SQLite database with timestamps, hashes, and full payloads. That's a forensic record of what was done in your repo and when. For regulated environments, paranoid debugging, or just "what did Claude touch yesterday," this is real value even if you never use the retrieval features.

### You're paying attention to LLM costs

The local-LLM offload path means summarisation and embeddings run on Ollama for free instead of going through the Anthropic API. On a busy week of pair-programming, that can be the difference between $3 and $30 of inference. The first-class Ollama integration is one of the main reasons the project exists.

### You work in Salesforce

The domain skills — Apex patterns, Flow conversion, schema migrations, deploy/rollback, security review, LWC debugging — are real expertise baked into the plugin. If you're a Salesforce developer using Claude Code, the Salesforce tab is worth the install on its own, separately from the memory features.

## Don't bother when…

### You're doing one-off scripting

Throwaway scripts, weekend hacks, "just clean up this CSV for me." There's nothing to remember and nothing to retrieve. The capture overhead is small, but the value is zero.

### You're learning a brand new technology

Memory is a *recall* tool, not a *learning* tool. If you're working with a stack you don't yet understand, you want vanilla Claude with strong web search, not a memory system that recalls your half-formed misunderstandings from three days ago. Come back to SiftCoder once you know what you're doing.

### Privacy concerns trump convenience

SiftCoder runs locally. The memory database is on your machine. The Ollama backend is on your machine. None of this leaves your laptop unless you explicitly opt into the Anthropic backend for summarisation. **However:** captured tool calls include file paths, code snippets, and shell command output. That's all on your local disk in a SQLite file. If you're working under an NDA that bans cached AI artefacts, or in an environment with strict residency rules, treat the SiftCoder database the same way you'd treat your shell history — useful but a thing to think about.

### Your project changes shape weekly

If the codebase is being radically rewritten, refactored, or reorganised every few days, captured memory rots fast. You'll spend more time pruning bad context than you save retrieving good context. SiftCoder rewards stability.

### You hate background processes

There is a daemon running per workspace. It's small (~50MB RSS in steady state), it does almost nothing when idle, and it's restartable. But it's there. If you have a strong philosophical objection to long-running helper processes, this isn't the tool for you.

## A reasonable adoption pattern

Install it. Run `/siftcoder:mem backfill` once to seed memory from your existing transcripts. Use Claude Code as you normally would for two weeks. Watch the `info` output every few days and notice whether retrieval is pulling useful things back.

If after two weeks you can think of three concrete moments where memory saved you re-explanation, keep it. If you can't, uninstall. The plugin isn't load-bearing — Claude Code works fine without it, and removing the plugin removes the daemon.

This is, candidly, the test we'd recommend for any persistent infrastructure. Don't install it because it's interesting. Install it, use it for a sprint, and decide whether it earned its keep.
