---
description: Quick SiftCoder status — daemon, memory, focus, scope. Wraps siftcoder mem status
allowed-tools: Bash, Read
---

# /siftcoder:status

Quick status snapshot:

- Daemon: running / unreachable
- Memory counts: events, summaries, embeddings, pending
- Active scope (if any)
- Active focus (if any)
- Workspace key + namespace

For deeper inspection: `/siftcoder:mem status`, `/siftcoder:focus status`, `/siftcoder:scope`.
