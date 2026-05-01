# Usage

Day-to-day patterns for working with SiftCoder.

> First time? See [getting-started.md](getting-started.md) for install + setup.

## Memory operations

The `/siftcoder:mem` command is the entry point for everything memory-related. Subcommands:

```
/siftcoder:mem setup        # one-time onboarding for a workspace
/siftcoder:mem status       # capture/drain/spend report
/siftcoder:mem check        # 5-point daemon health check
/siftcoder:mem start        # spawn daemon explicitly
/siftcoder:mem drain        # force-summarise pending events
/siftcoder:mem backfill     # import past transcripts
/siftcoder:mem web          # open browser dashboard
```

You can also let Claude call the MCP tools directly during conversation:

```
mem_search { query: "auth middleware decision", k: 5 }
mem_get { ids: [142] }
mem_why { kind: "summary", id: "142", depth: 3 }
mem_timeline { near_id: 142, window: 10 }
```

`mem_search` auto-drains a small batch (4) on every call so the index stays current without manual intervention.

## Coding workflows

```
/siftcoder:build "<spec>"            # build from a spec
/siftcoder:add-feature "<desc>"      # add a feature to existing code
/siftcoder:fix "<issue>"             # bounded fix
/siftcoder:investigate "<question>"  # read-only diagnosis
/siftcoder:tdd "<spec>"              # write tests first, then code
/siftcoder:refactor "<area>"         # behaviour-preserving cleanup
/siftcoder:heal                      # self-healing build/test loop
```

Pair with `/siftcoder:scope` to constrain which files the assistant may touch.

## Quality gates

```
/siftcoder:quality                   # format + lint + type-check + tests
/siftcoder:review                    # memory- + convention-aware code review
/siftcoder:security                  # security review
/siftcoder:ripple "<file>"           # change-impact visualization
/siftcoder:blast-radius "<change>"   # predict downstream effects
```

## Salesforce daily

```
/siftcoder:sf-architect              # org-level review
/siftcoder:lwc create "<name>"       # LWC scaffold w/ tests
/siftcoder:apex-patterns             # FFLib / Selector / Domain / Service / UoW
/siftcoder:schema erd                # entity-relationship diagram
/siftcoder:sf-deploy validate        # validate deployment
/siftcoder:sf-test generate "<file>" # comprehensive tests
```

## Workflow control

```
/siftcoder:autonomous "<goal>"       # long unattended run
/siftcoder:swarm "<tasks>"           # parallel subagent dispatch
/siftcoder:agent "<task>"            # plan → code → review → fix pipeline
/siftcoder:checkpoint save <name>    # save restore point
/siftcoder:checkpoint restore <name> # restore
/siftcoder:handoff                   # persist context for next session
```

## Ideation

```
/siftcoder:ideate "<area>"           # memory-grounded brainstorming
/siftcoder:surprise-me               # novel project ideas
/siftcoder:reverse-prompt deep       # extract a prompt that rebuilds this project
```

## Output compression

```
/siftcoder:compress full             # measured compression on natural-language output
/siftcoder:compress off              # back to normal
```

Useful for long sessions where token output volume matters.

## Discovery

Forgot which command you want?

```
/siftcoder:help                      # browse the command index
/siftcoder:wizard                    # interactive multi-step flow
/siftcoder:prompt                    # craft a precise prompt for a goal
/siftcoder:status                    # show siftcoder progress
```

## See also

- [commands.md](commands.md) — full command reference
- [skills.md](skills.md) — workflow contracts behind each command
- [examples.md](EXAMPLES.md) — real session traces
