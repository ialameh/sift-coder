# Layout

Where every SiftCoder file lives, what owns it, and what's safe to delete or git-ignore.

There are four distinct trees:

1. Runtime state — `~/.siftcoder/<ns>/`.
2. Installed plugin — `~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>/`.
3. Per-project config — `<repo>/.siftcoder/`.
4. Claude Code config — `<repo>/.claude/` and `~/.claude/`.

## 1. Runtime state — `~/.siftcoder/<ns>/`

Per-namespace; defaults to `default`. This is where the daemon writes everything.

```
~/.siftcoder/default/
├── config.json                        # user-global config (see configuration.md)
├── scope.json                         # optional global scope (boundary-enforcer fallback)
├── install-error.flag                 # set by ensure-built on build failure; cleared next run
├── run/
│   ├── <wsKey>.sock                   # Unix socket — one per workspace
│   └── <wsKey>.pid                    # daemon pid file (some installs put pid in workspaces/ instead)
├── workspaces/
│   └── <wsKey>/                       # one dir per repo (12-hex SHA-256 of git toplevel realpath)
│       ├── db.sqlite                  # the memory store (events, summaries, embeddings, FTS)
│       ├── db.sqlite-wal              # SQLite WAL — appears at runtime
│       ├── db.sqlite-shm              # SQLite shared memory file
│       ├── wal.ndjson                 # SiftCoder's own write-ahead log (per-event JSON line)
│       ├── run.pid                    # daemon pid (alternate location)
│       └── http.port                  # web UI port (random; written when bridge is up)
└── logs/
    ├── <wsKey>.ndjson                 # daemon log stream (capture, drain, retrieval)
    ├── install.ndjson                 # ensure-built attempts
    └── spawn.ndjson                   # spawn-daemon attempts
```

- **Safe to delete**: everything in this tree. Worst case you re-run `siftcoder setup` and re-capture from `/siftcoder:mem backfill`. Memory will be empty until then.
- **Safe to git-ignore**: irrelevant — this is under `~`, not in your repo.
- **What you'd actually delete**: `logs/<wsKey>.ndjson` if it gets large (the daemon doesn't rotate it for you). `db.sqlite` if you want a clean slate for one workspace.

The workspace key derivation:

```
sha256(realpath(git toplevel of cwd))[0:12]
```

Two terminals in the same repo share a workspace. A symlinked checkout doesn't accidentally fork because `realpath` resolves it.

## 2. Installed plugin — `~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>/`

Where the marketplace cache puts the plugin. Hooks invoke from here.

```
~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/1.0.8/
├── package.json
├── settings.json                      # baseline siftcoder config (layer 1)
├── .claude-plugin/
│   ├── plugin.json                    # MCP server + hooks registration
│   └── marketplace.json
├── bin/
│   └── siftcoder.mjs                  # CLI entrypoint
├── dist/                              # compiled TypeScript (output of `npm run build`)
│   ├── core/                          # config, paths, errors, logger
│   ├── memory/
│   │   ├── daemon/                    # daemon + summarizer + consolidator
│   │   ├── mcp/                       # MCP server
│   │   ├── storage/                   # SQLite + wasm fallback
│   │   └── *.js                       # everything else
│   └── ...
├── src/                               # TypeScript source (used for `npm run build`)
├── hooks/
│   ├── pre-tool-use/boundary-enforcer.mjs
│   ├── post-tool-use/{capture-observation,detect-console-logs,auto-checkpoint}.mjs
│   ├── pre-compact/inject-memories.mjs
│   ├── notification/pin-incident.mjs
│   ├── session-start/{ensure-built,spawn-daemon,install-error-banner}.mjs
│   └── stop/should-continue.mjs
├── skills/                            # workflow contracts (SKILL.md per skill)
│   ├── coding/, salesforce/, knowledge/, ...
├── agents/                            # sub-agent personas
│   └── *.md
├── commands/                          # slash command files
│   └── *.md
├── monitors/                          # health-monitor scripts
├── scripts/                           # setup, postinstall, sync-version
├── node_modules/                      # deps (better-sqlite3 prebuilt binary lives here)
├── README.md, CHANGELOG.md, ARCHITECTURE.md, ...
```

- **Safe to delete**: nothing if you want SiftCoder to keep working. To uninstall use `/plugin uninstall siftcoder` from Claude Code.
- **Replaceable**: `dist/` and `node_modules/` — the `ensure-built` hook will regenerate them on next session start. You can also manually run `npm install && npm run build` from this directory.
- **Don't git-ignore**: not in your repo.

The marketplace registry (separate from the cache) lives at `~/.claude/plugins/marketplaces/siftcoder-marketplace/` and only carries `marketplace.json` + version pointers — Claude Code reads new versions from there.

## 3. Per-project — `<repo>/.siftcoder/`

Optional. Anything here overrides user-global config for this repo.

```
<your-repo>/.siftcoder/
├── config.json                        # project config overlay (layer 3)
├── scope.json                         # boundary-enforcer allow-globs
├── checkpoints/                       # named checkpoints (savepoint metadata + memory pin)
│   └── cp-<id>.json
└── chroot.json                        # (optional) explicit-file allowlist for /siftcoder:chroot
```

- **Safe to delete**: yes. You'll lose project-specific config (rare) and named checkpoints (recreatable from git tags).
- **git-ignore**: usually `.siftcoder/checkpoints/` and `.siftcoder/chroot.json`. **Track** `.siftcoder/config.json` and `.siftcoder/scope.json` if you want everyone on the team to share them.

A reasonable `.gitignore`:

```
.siftcoder/checkpoints/
.siftcoder/chroot.json
```

## 4. Claude Code config — `<repo>/.claude/` and `~/.claude/`

Not SiftCoder-specific, but the boundary between SiftCoder and the harness.

```
<your-repo>/.claude/
├── settings.json                      # project-level settings (permissions, hooks overlay)
├── settings.local.json                # local-only project settings (don't commit secrets)
└── ...

~/.claude/
├── settings.json                      # user-level settings
├── projects/
│   └── <encoded-cwd>/                 # Claude Code's transcript directory per project
│       └── *.jsonl                    # transcript files (input to `siftcoder backfill`)
├── plugins/
│   ├── cache/                         # installed plugin payloads (see §2)
│   └── marketplaces/                  # marketplace registries
└── keybindings.json
```

`~/.claude/projects/<encoded-cwd>/*.jsonl` is what `siftcoder backfill` walks — every Claude Code conversation in that project, in order. Don't delete it if you want to backfill later.

## tree-style summary

```
$HOME
├── .siftcoder/
│   └── default/
│       ├── config.json
│       ├── scope.json
│       ├── run/<wsKey>.sock
│       ├── workspaces/<wsKey>/{db.sqlite, wal.ndjson, run.pid, http.port}
│       └── logs/{<wsKey>.ndjson, install.ndjson, spawn.ndjson}
└── .claude/
    ├── projects/<encoded-cwd>/*.jsonl
    ├── plugins/
    │   ├── cache/siftcoder-marketplace/siftcoder/<version>/
    │   │   ├── bin/siftcoder.mjs
    │   │   ├── dist/
    │   │   ├── hooks/
    │   │   ├── skills/
    │   │   ├── agents/
    │   │   └── commands/
    │   └── marketplaces/siftcoder-marketplace/
    └── settings.json

<your-repo>/
├── .siftcoder/
│   ├── config.json     ← optional overlay
│   ├── scope.json      ← optional boundary
│   └── checkpoints/
└── .claude/
    └── settings.json
```

## Cleanup recipes

**Reset one workspace's memory** (keep config, lose history):
```bash
rm -rf ~/.siftcoder/default/workspaces/<wsKey>
rm -f  ~/.siftcoder/default/run/<wsKey>.sock
```

**Reset everything** (config + memory across all namespaces):
```bash
rm -rf ~/.siftcoder
```

**Force a plugin rebuild** (when the install looks broken):
```bash
cd ~/.claude/plugins/cache/siftcoder-marketplace/siftcoder/<version>
npm install && npm run build
```

**Find your workspace key** without running anything:
```bash
node -e 'const c=require("crypto");const{execSync}=require("child_process");const fs=require("fs");const t=execSync("git rev-parse --show-toplevel").toString().trim();console.log(c.createHash("sha256").update(fs.realpathSync(t)).digest("hex").slice(0,12))'
```

Or simply: `siftcoder info | grep workspace`.
