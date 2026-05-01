# Namespaces and workspaces

SiftCoder has two levels of isolation. The naming is unfortunately easy to confuse, so this chapter is mostly about pinning each of them down precisely. They sit on top of each other:

```
~/.siftcoder/<namespace>/workspaces/<workspaceKey>/db.sqlite
```

Namespace is the outer ring. Workspace is the inner ring. They do different jobs. You will almost never touch namespace; you will use one workspace per project and never think about it.

## Workspace = per-project

A workspace is what you'd intuitively call "this codebase." It's the unit at which there's a daemon, a SQLite file, a WAL, a socket, and a memory.

The workspace key is computed in `src/memory/workspace.ts`:

```ts
export function workspaceKey(cwd: string): string {
  const top = gitToplevel(cwd) ?? cwd;
  let real: string;
  try {
    real = realpathSync(top);
  } catch {
    real = resolve(top);
  }
  return createHash('sha256').update(real).digest('hex').slice(0, 12);
}
```

The recipe:

1. Find the git toplevel of the current directory (`git -C <cwd> rev-parse --show-toplevel`). If you aren't inside a repo, fall back to `cwd`.
2. Resolve symlinks via `realpathSync`. This is what stops a symlinked clone from getting a different key.
3. SHA-256 the resulting absolute path. Take the first 12 hex chars.

That's it. The key is stable across terminals, across shells, across reboots, as long as the path on disk doesn't move. Two terminals open in the same repo share a workspace key, share a daemon, share memory. Two repositories at different paths produce different keys, get different daemons, never see each other.

(There's a second `workspaceKey` in `src/core/paths.ts` that uses SHA-1 over `CLAUDE_PROJECT_DIR || cwd` and a different truncation. The two functions exist because parts of the codebase converged at different times. The runtime path that matters — daemon spawn, hook capture, retrieval — uses the SHA-256 / git-toplevel / realpath one consistently. The SHA-1 variant is used by some legacy paths in the CLI bindings; it's effectively dormant. If you're debugging a key mismatch, the SHA-256 path is the source of truth.)

### Why per-workspace, not per-session

The whole point of SiftCoder is to fix the problem of re-explaining your project at the start of every session. Per-session memory is exactly the problem we're trying to solve, so it can't be the storage unit. Per-user is too broad — you don't want hobby code to pollute work code, and you don't want secrets from one repository's `.env` accidentally surfacing in suggestions for a different repository.

Per-project is the right unit because that's the unit at which "what we figured out" coheres. The thing you remember about a project — the fact that it uses Pydantic v2, the fact that the auth layer eats malformed JWTs, the fact that the test runner needs `--max-old-space-size` — those are project facts, not session facts and not user facts.

The ergonomic reason: it matches what you already do. You `cd` into a project to work on it. Each project gets its own memory. Switching projects in another terminal doesn't disturb the first.

### "I have two clones of the same repo"

This case actually happens — main checkout in one place, worktree in another, or you cloned the repo twice for some reason. The two clones produce *different* workspace keys because their absolute paths differ. They do not share memory.

That's usually the right behaviour: the two checkouts probably represent different lines of work. If you want them to share memory, the simplest fix is symlink one to the other and rely on `realpathSync` collapsing them to the same canonical path. If you want them to *not* share, you already have what you want.

Note that `git worktree` produces a subdirectory inside the main checkout, so its toplevel resolves to the worktree's own path — different key from the main checkout. Each worktree is its own workspace. That's intentional; worktrees usually represent parallel feature branches and you probably don't want one branch's memory leaking into another.

## Namespace = top-level isolation tag

A namespace is a hard wall. Everything below `~/.siftcoder/<namespace>/` is one universe. Workspaces in different namespaces don't share daemons, sockets, configs, logs, or anything. You can think of a namespace as "an instance of SiftCoder."

The default namespace is `default`. You override it by setting `SIFTCODER_NS` in your environment:

```bash
export SIFTCODER_NS=work
claude   # this session sees ~/.siftcoder/work/
```

```bash
export SIFTCODER_NS=personal
claude   # this session sees ~/.siftcoder/personal/
```

Namespace selection happens at every boundary:

- `src/core/paths.ts:resolvePaths` — root path resolution
- `src/memory/workspace.ts:workspacePaths` — daemon paths
- `src/core/config.ts:loadConfig` — config file lookup
- Every hook script — independently reads `process.env.SIFTCODER_NS || 'default'`

Because each hook reads it independently, setting `SIFTCODER_NS` in one terminal genuinely is per-shell. There's no global daemon that decides namespace once at startup.

### Why namespaces exist at all

Three real reasons.

**Work versus personal.** You probably don't want your client work and your weekend projects sharing summarisation budgets, retrieval surfaces, or the same Anthropic API key. `SIFTCODER_NS=work` for one shell, `SIFTCODER_NS=personal` for the other. The two daemons run side by side; neither knows about the other.

**CI / disposable environments.** A CI runner that starts Claude Code on a clean machine should not be writing into the same memory store as your laptop session. Setting `SIFTCODER_NS=ci` in the runner's env keeps captures from contaminating real memory. Namespace + ephemeral filesystem = fresh memory every run.

**Experimentation.** You want to try a new embedder, or a different summariser model, without disturbing the memory you've built up. `SIFTCODER_NS=experiment` gives you a clean slate. Tear it down by `rm -rf ~/.siftcoder/experiment` when you're done.

You'd specifically reach for namespaces when the answer to "do I want this captured into the same store as before?" is clearly no. If the answer is "I'm not sure," leave the namespace alone — `default` is fine for almost everything, and the per-workspace isolation already handles the common cases.

### "I want a clean memory for one project without nuking the others"

Two paths.

The cheap path: just delete that workspace. Find its key with `/siftcoder:mem info` (workspace line), then `rm -rf ~/.siftcoder/default/workspaces/<key>` and `rm ~/.siftcoder/default/run/<key>.sock`. The next session in that directory will start a fresh daemon with an empty database. Other workspaces are untouched because they have different keys.

The heavier path: switch that project to a different namespace. Set `SIFTCODER_NS=clean` in a `.envrc` or shell rc for that project. The daemon, paths, configs are all isolated from `default`. Useful if you not only want to start fresh but also want to try a different config (different backend, different decay) without touching the global config.

## The legacy `v3` migration

This is a small thing but easy to trip on if you've been running SiftCoder since before v1.0.6.

`hooks/session-start/ensure-built.mjs` runs a one-shot migration every session start:

```js
function migrateLegacyNamespace() {
  if (NS !== 'default' || process.env.SIFTCODER_NS) return;
  try {
    const root = join(homedir(), '.siftcoder');
    const oldDir = join(root, 'v3');
    const newDir = join(root, 'default');
    if (existsSync(oldDir) && !existsSync(newDir)) {
      renameSync(oldDir, newDir);
      logEvent({ kind: 'namespace-migrated', from: 'v3', to: 'default' });
    }
  } catch { /* never throw from a hook */ }
}
```

Versions 1.0.0 through 1.0.5 used `v3` as the namespace name (an internal "third generation" marker that leaked out). 1.0.6+ uses `default`. The migration:

1. Only runs if `SIFTCODER_NS` is unset (i.e. you're on the implicit default).
2. Only runs if `~/.siftcoder/v3/` exists and `~/.siftcoder/default/` does *not*.
3. Atomic `renameSync` — fast, single filesystem operation, can't half-finish.
4. Logs the event to `~/.siftcoder/default/logs/install.ndjson`.
5. Swallows any error. Hooks must never throw.

After the rename, your daemons, workspaces, configs, and SQLite databases are all under `default` and the migration is done. Subsequent sessions skip the function in the first line. If you had `SIFTCODER_NS` explicitly set to something else, the migration won't fire and your data stays where you put it.

There's no migration in the other direction. If you somehow ended up with both `v3/` and `default/` directories (for example, you ran v1.0.5 and v1.0.6 alternately), the migration won't merge them — it just bails. You'd have to merge by hand: pick one, copy `workspaces/<key>/db.sqlite` files across, accept that there's no automatic dedupe across the two databases.

## Inspecting which workspace you're in

Three sources of truth, and they should all agree.

```bash
$ /siftcoder:mem info
namespace   default
workspace   91a0a425c157  cwd=/Users/you/Documents/your-project
```

The CLI computes the key the same way the daemon does, and reports the result.

```bash
$ ls ~/.siftcoder/default/workspaces/
91a0a425c157  4f8e2a7c0b1e
```

Each subdirectory is a workspace you've ever booted a daemon for. Stale ones are harmless — the daemon for that workspace just won't be running until you `cd` into the corresponding project.

```bash
$ ls ~/.siftcoder/default/run/
91a0a425c157.sock
```

Active sockets — one per *currently running* daemon. If your workspace key shows up here, the daemon is up. If it doesn't, nothing has booted it yet, or it shut down (idle timeout, manual stop, crash).

When the three disagree — say, `info` reports key `91a0a425c157` but `~/.siftcoder/default/workspaces/` doesn't have that subdirectory — you've almost certainly got a `SIFTCODER_NS` set in one of the contexts and not the other. That's the first thing to check.
