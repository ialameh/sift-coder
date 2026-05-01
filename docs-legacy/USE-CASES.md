# Use Cases

When to reach for SiftCoder, organised by what you're trying to do.

## "I keep losing context between sessions"

```
/siftcoder:mem setup           # one-time per project
# ...work normally...
mem_search { query: "<topic>" }
mem_why  { kind: "summary", id: "<id>" }
```

Capture is automatic from session 1. After ~50 events, recall noticeably improves.

## "I want to spend less on Anthropic API"

```
brew install ollama
ollama pull llama3.2:3b nomic-embed-text
brew services start ollama
```

Drain auto-detects Ollama and routes summarisation locally. ~50× cost reduction on repeat sessions.

## "I'm onboarding to a new repo"

```
/siftcoder:codemap                # evidence-based codebase doc
/siftcoder:reverse-prompt deep    # what would rebuild this from scratch?
/siftcoder:archaeologist          # why is X this way?
```

## "I want to add a feature without breaking things"

```
/siftcoder:scope add "src/feature/**"
/siftcoder:add-feature "<description>"
/siftcoder:review                 # before merging
/siftcoder:ripple "<file>"        # see what depends on what you changed
```

## "I'm doing Salesforce architecture review"

```
/siftcoder:sf-architect           # read-only org review
/siftcoder:sf-comply              # compliance map
/siftcoder:sf-security            # security audit
```

## "Build me something fresh"

```
/siftcoder:surprise-me            # novel project ideas
/siftcoder:build "<spec>"         # build from spec
```

## "Long-running migration / refactor"

```
/siftcoder:checkpoint save before-migration
/siftcoder:autonomous "<goal>"
# ... if it goes wrong ...
/siftcoder:checkpoint restore before-migration
```

`autonomous` runs unattended; checkpoints give you a panic button.

## "Bug I can't reproduce"

```
/siftcoder:investigate "<symptoms>"
/siftcoder:timewarp "<commit-or-time>"
/siftcoder:duck                   # rubber-duck mode if all else fails
```

## "Explain this code to me"

```
/siftcoder:archaeologist "src/auth/middleware.ts"
/siftcoder:narrator "src/auth/middleware.ts"
/siftcoder:codemap-fast            # quick structural scan first
```

## "Generate documentation"

```
/siftcoder:document architecture
/siftcoder:document user-manual
/siftcoder:codemap-export json     # machine-readable
/siftcoder:update-docs             # sync existing docs with code
```

## "Test coverage gap"

```
/siftcoder:test "<file>" --kind=mutation
/siftcoder:fuzz-mind "<area>"
/siftcoder:invariant               # discover implicit invariants worth testing
```

## "Help me decide between two approaches"

```
/siftcoder:ghost "what if we used X instead"
/siftcoder:fortune                 # which choice creates worse debt?
```

## "I just want to know what siftcoder commands exist"

```
/siftcoder:help
/siftcoder:wizard                  # interactive guided flow
/siftcoder:examples                # browse session traces
```

## See also

- [commands.md](commands.md) — full command reference
- [usage.md](USAGE.md) — daily patterns
