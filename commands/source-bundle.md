---
description: source-bundle workflow — see corresponding skills/docs/source-bundle/SKILL.md
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# /siftcoder:source-bundle

Direct invocation of the `source-bundle` skill. Consolidates a codebase into a
hidden `.source/` folder of AI-ingestion-friendly Markdown bundles (one `.md` per
meaningful folder, file contents verbatim in fenced code blocks). See the skill
body for the full workflow contract.

Run the shipped generator (target dir defaults to the current working directory):

```sh
node ${CLAUDE_PLUGIN_ROOT}/scripts/generate-source-md.mjs $ARGUMENTS
```

`$ARGUMENTS` is the optional target project directory.
