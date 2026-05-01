# Ghost mode

Most of SiftCoder is built around the assumption that Claude is helping you code — suggestions, refactors, fixes, the works. Ghost mode is the opposite. You write the code. Claude doesn't suggest, doesn't complete, doesn't propose alternatives. SiftCoder still captures what you do, retrieval still works, search still works — but the LLM is in observe-only mode for the session.

This is for the case where you want the memory benefits without the pair-programming overhead. The recipe walks through why anyone would want that and how to actually use it.

(Worth flagging up front: this `ghost` is the *workflow mode*, not to be confused with the `ghost` skill in the reasoning family — that one is for parallel-universe code exploration. Same name, different shapes. The skill family path tells you which: `skills/reasoning/ghost/` is the explore-an-alternative skill; the mode below is the no-LLM-input session mode.)

## Why turn off the LLM input

Three real reasons.

**Focus.** The pair-programming dynamic is great when you want it and exhausting when you don't. Some kinds of work — deep refactoring, careful debugging, writing prose — are better in solitary mode. The LLM volunteering ideas mid-thought breaks the flow. Ghost mode lets you keep the editor environment but turn off the conversation.

**Validating your own thinking.** When Claude is suggesting, it's hard to tell whether your design choices are yours or whether you've been nudged. Solo coding for a feature, then comparing with what you would have done with Claude's help, is a useful calibration exercise. Are you adopting Claude's patterns because they're good, or because they were the first thing offered?

**Learning.** When you're new to a language or a framework, Claude finishing your sentences slows your learning. Type the for-loop yourself. Look up the API yourself. Make the mistakes yourself. Ghost mode is an active choice to do that, while still keeping memory so you can come back later and see what you did.

There's also a fourth, less philosophical reason: **cost control.** No LLM calls means no Anthropic API spend for the session. If you're working on something low-stakes where you don't actually need help, ghost mode is free.

## What ghost mode preserves

The workflow mode turns off LLM-driven assistance. It does not turn off the rest of SiftCoder. Specifically, what continues to work:

- **Capture.** Hooks fire on tool calls. Reads, writes, bash commands all flow into the daemon. Your work is recorded.
- **Summarisation.** The consolidator runs in the background. It uses the local Ollama model (default) so even this isn't calling Anthropic. If you've configured Anthropic for summarisation, you can override per-session to keep ghost mode purely local.
- **Retrieval.** `mem_search` still works. You can ask "did I already think about this?" and get prior memories back. The retrieval is being done by your prompt, not by an LLM analysing your prompt.
- **Search across captured patterns.** `pattern-search` still works. You can pull up your own patterns and apply them yourself.
- **The web UI.** Browse history, look at provenance, prune things. All still works.

What turns off:

- **Suggestions.** Claude doesn't volunteer code. If you're working in an editor with completions, ghost mode disables them for that session.
- **Auto-completions.** No mid-line LLM completion of your typing.
- **Auto-injected memories.** The `UserPromptSubmit` hook stops injecting relevant memories into Claude's context, because there's no Claude to inject into.
- **Slash commands that depend on LLM reasoning.** `/siftcoder:investigate`, `/siftcoder:fix`, `/siftcoder:refactor` and friends don't work in ghost mode. They need the LLM to do the reasoning.

The capture-side hooks still fire because they're not LLM-dependent — they're Node scripts that record what tools were called.

## Turning ghost mode on

Two ways.

**Per-session via slash command.** In a Claude Code session:

```
/siftcoder:ghost on
```

This sets a session flag. Suggestions stop. Capture continues. To turn it off:

```
/siftcoder:ghost off
```

**Per-workspace via config.** Edit `.siftcoder/config.json`:

```json
{
  "version": 1,
  "mode": "ghost"
}
```

Now every session in this workspace starts in ghost mode. Useful if you've decided this project is one where you want to work alone.

You can also bind ghost mode to specific paths. `.siftcoder/scope.json`:

```json
{
  "version": 1,
  "writeAllow": ["**"],
  "modeOverrides": {
    "src/critical/**": "ghost"
  }
}
```

Now files under `src/critical/` are always in ghost mode, regardless of the session-level setting. Useful for code that you want to write only by hand — security-critical paths, regulatory compliance code, anything where "AI-assisted" would be a red flag in a review.

## A worked example: a senior engineer refactoring a critical module

You're a senior engineer. You're refactoring the auth middleware in a security-sensitive product. You've done auth middleware refactors before; you don't need a co-pilot. You also don't want any plausible AI involvement in the diff log if a security audit looks at it later.

You set up ghost mode for the path:

```json
{
  "modeOverrides": {
    "src/auth/**": "ghost"
  }
}
```

You start a Claude Code session. You navigate to `src/auth/middleware.ts`. You start typing. No completions appear. You write the refactor yourself. Twenty minutes of focused work. Tests pass. Commit.

Capture happened the whole time. Every file you read, every test you ran, the diff you eventually wrote — all in memory. A week later, looking back:

```
mem_search { query: "auth middleware refactor" }
```

…returns the session. You can see what you read, when you ran tests, what the final shape was. Without ghost mode, the same memory plus a record of Claude's suggestions. With ghost mode, just the record of what you did.

If you ever need to defend the work — "no LLM involvement in the security-critical path" — the memory log is your evidence. The hooks recorded that no Claude calls were made during that file's edits.

## What ghost mode is not for

A few cases where it's the wrong tool.

**You actually want help, you just don't want the wrong help.** Ghost mode is binary — LLM on or off. If you want help on architecture but not on syntax, that's not ghost mode; that's better prompt discipline.

**You're worried about specific data leaving the laptop.** Ghost mode doesn't change the LLM backend; it just disables LLM calls for the active session. If your concern is data handling, configure Ollama as the only backend (no Anthropic fallback) and the LLM calls that *do* happen stay local. That's a different lever.

**You're learning and don't want any LLM involvement at all.** Maybe — but consider: you can also just *not call Claude*. Ghost mode is for the case where the editor is wired up with completions and you want to suppress them for a session. If you're already in vim with no LSP, you don't need ghost mode.

## What gets captured looks different

A subtle but real consequence of ghost mode: the memory captured during ghost sessions has a different shape than memory captured during pair-programming sessions.

In a pair-programming session, the memory store has things like:

- "User asked about caching strategy; Claude suggested LRU; user adopted."
- "Investigation by Claude: bug was in middleware line 42; fix applied."
- "Claude proposed three implementations of the parser; user picked option 2."

In a ghost session, the same kind of work produces:

- "User read 4 files in src/auth/."
- "User edited middleware.ts."
- "Tests run, 23 passed."

The captures are *thinner*. There's no Claude reasoning to consolidate. The summaries are more like git history than like a working journal. That's fine — it's the right shape for solo work — but it changes what retrieval surfaces. If you ask "why did we choose X over Y" later, ghost-mode sessions don't have the answer because the reasoning was in your head, not in the captured stream.

If you want the reasoning preserved in ghost sessions, write a `dig-note` periodically:

```
/siftcoder:dig-note "decided to use HMAC instead of signed cookie because we need to verify in non-Node services too"
```

That's a manual capture of your reasoning, scoped to ghost mode where automatic capture has nothing to grab.

## The senior-engineer use case

The user this recipe is shaped for is roughly: senior engineer, fifteen years in, knows what they're doing, has worked with various pair-programming tools (Copilot, Cursor, Claude Code) and likes parts of them but not all. Wants the memory benefit (because forgetting your own past decisions is the actual time sink) but doesn't want the suggestion firehose.

For that user, ghost mode is occasional rather than default. They turn it on for deep refactoring, security work, prose-heavy commits, and learning new languages. They turn it off for everything else.

The lighter version of this idea — "selective use of suggestions" — is also possible without ghost mode. Just don't take the suggestion. But the suggestion still appears, takes up screen real estate, costs an Anthropic call to generate, and arguably nudges your thinking even when ignored. Ghost mode removes the noise entirely.

## Cross-references

- `ghost` skill (the alternative-implementation explorer, different from this mode): `skills/reasoning/ghost/SKILL.md`
- The session-mode flag: handled by the `siftcoder` workflow skill at session start.
- Scope and mode overrides: `.siftcoder/scope.json` and `.siftcoder/config.json` schemas in the [reference](../reference/configuration.md).

The recipe is short because the workflow is genuinely simple: turn it on when you want quiet, turn it off when you want help. The reason the recipe exists at all is that most users don't realise the option is there, and the few who do appreciate that it's a real, functional mode rather than a marketing flourish.
