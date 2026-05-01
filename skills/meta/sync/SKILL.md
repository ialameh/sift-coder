---
name: sync
description: Use to sync local SiftCoder state to a remote backup or team federation target. Memory snapshots, captured patterns, checkpoints. Privacy-aware (PII redaction).
---

# sync

Local → remote sync. Backup or federation. PII redacted in transit.

## Targets

- **Local backup** — tarball to `~/Backups/siftcoder/<ts>.tar.gz`
- **Cloud bucket** — S3/GCS/Azure/Wasabi (user-supplied creds)
- **Team federation peer** — another SiftCoder install (per `/siftcoder:team` setup)

## Method

1. **Pick target.**
2. **Pre-flight:**
   - Snapshot memory store (consistent point-in-time)
   - Apply privacy redaction (`src/memory/privacy.ts`)
   - Compute size + hash
3. **Transfer.** With progress + retry on transient failure.
4. **Verify.** Hash match on remote.
5. **Log** the sync to memory + a `~/.siftcoder/sync.ndjson` ledger.
6. **Schedule next.** Optional: cron-shaped recurrence (via `/schedule` skill).

## Output shape

```
Sync target:    <path / URL / peer>
Source:         ~/.siftcoder/

Pre-flight:
  Memory snapshot:    ✓ point-in-time captured
  Privacy redaction:  ✓ N PII items redacted
  Size:               <bytes>
  Hash:               <sha256>

Transfer:           ✓ uploaded in <sec>
Verify:             ✓ hash matches
Log:                <path to ledger>

Last sync:          <ts>
Next:               <if scheduled>
```

## Rules

- **Privacy redaction always.** Even for local backup.
- **Verify hash post-transfer.** Silent corruption is real.
- **Retry transient.** Network blips ≠ failure.
- **Ledger every sync.** Audit trail.

## Anti-patterns

- Skipping redaction "for speed"
- Ignoring hash mismatch
- Re-syncing without delta detection
- Cloud creds in command line (use env vars / managed creds)

## When NOT to use

- Memory store empty — nothing to sync
- Pre-setup — `/siftcoder:onboard` first

## Subagent dispatch

- `Bash` for the transfer
- Memory MCP for snapshot + privacy
- `/schedule` skill (or ScheduleWakeup) for recurrence

## Value over native CC

CC has no native sync. SiftCoder owns its state; this skill provides the controlled cross-environment movement. The discipline (redaction, verify, ledger) IS the value.
