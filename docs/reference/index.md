# Reference

This is the catalogue. Every CLI subcommand, every slash command, every skill, every agent, every hook, every config key, every wire frame. Read it like a man page — start with the chapter you need, scan the table, dive in.

If you want to learn how SiftCoder thinks, read [Foundations](../foundations/index.md). If you want to recall the exact name of the flag you forgot, you're in the right place.

## Chapters

| Chapter | What you'll find |
|---|---|
| [CLI](cli.md) | Every `siftcoder <cmd>` subcommand, its signature, sample output, and exit codes. |
| [Slash commands](slash-commands.md) | Every `/siftcoder:*` slash, table-indexed, with deep-dives on the popular ones. |
| [Skills](skills.md) | Exhaustive catalogue of every SKILL.md, grouped by family. |
| [Agents](agents.md) | The fourteen sub-agents — model picks, tool grants, when each one earns its slot. |
| [Hooks](hooks.md) | The hook event matrix — what runs, when, how it fails, where it logs. |
| [Configuration](configuration.md) | The full config schema, env vars, and the four-layer precedence chain. |
| [MCP server](mcp.md) | The `siftcoder-memory` server — tool schemas and the sampling fallback. |
| [Wire protocol](protocol.md) | The length-prefixed JSON over UDS — request/response types, frame layout, hex example. |
| [Layout](layout.md) | The full directory map — runtime state, plugin install, project files, what's safe to delete. |
| [Glossary](glossary.md) | Every load-bearing term, alphabetised. |

The reference is denser than the rest of the guide. That's the point.
