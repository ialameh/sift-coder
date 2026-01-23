---
description: Synchronize knowledge to cloud storage
argument-hint: [push|pull|status|auto|resolve]
allowed-tools: Read, Write, Edit, Bash, Task, AskUserQuestion
---

# /siftcoder:sync - Cloud Knowledge Sync

Synchronize local knowledge base to cloud storage for backup and multi-machine access.

## Usage

```
/siftcoder:sync <subcommand> [args]
```

## Subcommands

### push
Upload local knowledge to cloud.

### pull
Download and merge cloud knowledge to local.

### status
Display sync status and pending changes.

### auto on|off
Enable or disable automatic sync.

### resolve <conflict-id>
Resolve a pending sync conflict.

### conflicts
List all pending conflicts.

### history
Display sync history (recent sync operations).

## Arguments
- `$ARGUMENTS` - Subcommand and any arguments

## Instructions

You manage cloud knowledge sync using the siftcoder-cloud Rust crate.

### Prerequisites
- Cloud must be configured (`/siftcoder:config cloud configure`)
- siftcoder-sync-server must be running (or remote server accessible)
- Valid API key with Pro tier subscription

### For `push`:
Upload local knowledge to cloud:
1. Check cloud configuration exists
2. Execute cloud-sync.sh script:
   ```bash
   siftcoder/scripts/cloud-sync.sh push
   ```
3. The script will:
   - Load local knowledge from `.claude/siftcoder-state/knowledge/`
   - Make API request to sync server
   - Display progress and results
4. Example output:
   ```
   📤 Pushing knowledge to cloud...

   Reading local knowledge...
   - 15 patterns
   - 8 gotchas
   - 3 decisions

   Uploading to https://sync.siftcoder.com...
   [████████████████████] 100% (26 entries)

   ✅ Push complete
   Uploaded: 26 entries
   Skipped: 0 (unchanged)
   Failed: 0
   Took: 2.3s
   ```
6. On conflicts detected:
   ```
   ⚠️  Conflicts detected

   The following entries have newer versions on the server:
   [1] pattern-003: Repository Pattern
       Local: v1 (2026-01-10 10:00)
       Cloud: v2 (2026-01-11 09:30)

   Options:
   - /siftcoder:sync resolve pattern-003 --local    Keep local version
   - /siftcoder:sync resolve pattern-003 --remote   Use cloud version
   - /siftcoder:sync resolve pattern-003 --newest   Use newest (v2)
   - /siftcoder:sync pull                           Merge from cloud first
   ```
7. Update last sync time in state

### For `pull`:
Download and merge cloud knowledge:
1. Check cloud configuration exists
2. Execute cloud-sync.sh script:
   ```bash
   siftcoder/scripts/cloud-sync.sh pull
   ```
3. The script will:
   - Fetch knowledge from sync server
   - Merge with local knowledge
   - Save merged results to `.claude/siftcoder-state/knowledge/`
4. Display progress:
   ```
   📥 Pulling knowledge from cloud...

   Fetching from https://sync.siftcoder.com...
   [████████████████████] 100% (28 entries)

   Merging with local knowledge...
   - 15 patterns (unchanged)
   - +2 new patterns
   - ~1 updated pattern (merged)
   - 8 gotchas (unchanged)
   - 3 decisions (unchanged)

   ✅ Pull complete
   Added: 2 entries
   Updated: 1 entry
   Merged: 0 conflicts
   Took: 1.8s
   ```
5. Write merged knowledge back to local files
6. Show summary of changes

### For `status`:
Display current sync state:
1. Check cloud configuration exists
2. Execute cloud-sync.sh script:
   ```bash
   siftcoder/scripts/cloud-sync.sh status
   ```
3. The script will:
   - Fetch sync status from server
   - Display connection state
   - Show local vs cloud knowledge counts
   - Display pending changes and conflicts
4. Example output:
   ```
   ☁️  Cloud Sync Status

   Connection: ✅ Connected
   Server: https://sync.siftcoder.com
   Last Sync: 5 minutes ago (2026-01-11 16:42:33)

   Local Knowledge:
   - 15 patterns
   - 8 gotchas
   - 3 decisions
   Total: 26 entries

   Cloud Knowledge:
   - 15 patterns
   - 8 gotchas
   - 3 decisions
   Total: 26 entries

   Pending Changes:
   - 0 local modifications to push
   - 0 cloud updates to pull
   - 0 conflicts to resolve

   Offline Queue:
   - 0 pending operations
   Last queue process: 5 minutes ago

   Auto-Sync: ✅ Enabled
   - Interval: every 15 minutes
   - On knowledge changes: yes

   Machine ID: uuid-here
   Machine Name: My MacBook
   ```
4. If offline:
   ```
   ☁️  Cloud Sync Status

   Connection: ⚠️  Offline
   Last successful sync: 2 hours ago

   Offline Queue:
   - 3 pending operations
   Run: /siftcoder:sync push (will queue for later)

   Auto-Sync: ⏸️ Paused (will resume when online)
   ```

### For `auto on`:
Enable automatic synchronization:
1. Execute cloud-sync.sh script:
   ```bash
   siftcoder/scripts/cloud-sync.sh auto on
   ```
2. The script will:
   - Update cloud.toml configuration
   - Enable auto_sync.enabled = true
3. Confirm:
   ```
   ✅ Auto-sync enabled
   - Sync interval: 15 minutes
   - Sync on knowledge changes: yes
   ```
5. Trigger initial sync immediately

### For `auto off`:
Disable automatic synchronization:
1. Execute cloud-sync.sh script:
   ```bash
   siftcoder/scripts/cloud-sync.sh auto off
   ```
2. The script will:
   - Update cloud.toml configuration
   - Disable auto_sync.enabled = false
3. Confirm:
   ```
   ⏸️  Auto-sync disabled
   Sync must be triggered manually with /siftcoder:sync push|pull
   ```

### For `resolve <conflict-id>`:
Resolve a pending sync conflict:
1. Execute cloud-sync.sh script:
   ```bash
   siftcoder/scripts/cloud-sync.sh resolve <conflict-id> [strategy]
   ```
2. The script will:
   - Fetch conflict details
   - Present resolution options if not specified
   - Apply resolution to server
   ```
   ⚠️  Conflict: pattern-003 (Repository Pattern)

   Local version (v1):
   "Always wrap async calls in try/catch..."

   Cloud version (v2):
   "Always wrap async calls in try/catch with specific error types..."

   Metadata:
   - Local: 2026-01-10 10:00:00
   - Cloud: 2026-01-11 09:30:00

   Resolution Strategy:
   [1] Keep local (v1)
   [2] Use cloud (v2) [recommended - newer]
   [3] Keep newest (v2)
   [4] Manual merge
   [5] Skip for now

   Choose resolution [1-5]:
   ```
3. Apply resolution via ConflictResolver:
   - LocalWins: Keep local version, push to cloud
   - RemoteWins: Use cloud version, update local
   - NewestWins: Compare timestamps, use newest
   - Manual: Prompt user to merge content
   - Merge: Attempt automatic 3-way merge
4. Push resolution to server
5. Confirm:
   ```
   ✅ Conflict resolved
   Strategy: RemoteWins
   Pattern updated to cloud version (v2)
   ```

### For `conflicts`:
List all pending conflicts:
1. Execute cloud-sync.sh script:
   ```bash
   siftcoder/scripts/cloud-sync.sh conflicts
   ```
2. The script will:
   - Fetch conflicts from server
   - Display list of pending conflicts
   ```
   ⚠️  Pending Conflicts (2)

   [1] pattern-003: Repository Pattern
       Local v1 vs Cloud v2
       Created: 5 minutes ago
       Resolve: /siftcoder:sync resolve pattern-003

   [2] gotcha-002: Environment Loading
       Local v1 vs Cloud v3
       Created: 1 hour ago
       Resolve: /siftcoder:sync resolve gotcha-002
   ```
3. If no conflicts:
   ```
   ✅ No pending conflicts
   ```

### For `history`:
Display sync history:
1. Execute cloud-sync.sh script:
   ```bash
   siftcoder/scripts/cloud-sync.sh history
   ```
2. The script will:
   - Fetch sync operations from server
   - Display recent history
   ```
   📜 Sync History (last 10 operations)

   [1] 2026-01-11 16:42:33  ✅ Push (26 entries)
       Machine: My MacBook
       Duration: 2.3s

   [2] 2026-01-11 16:27:15  ✅ Pull (+2 entries)
       Machine: My MacBook
       Duration: 1.8s

   [3] 2026-01-11 15:55:00  ✅ Auto-sync (0 changes)
       Machine: My MacBook
       Duration: 0.5s

   [4] 2026-01-11 14:30:22  ⚠️  Push failed (network error)
       Machine: My MacBook
       Error: Connection timeout

   [5] 2026-01-11 13:15:00  ✅ Pull (1 merge, 1 conflict)
       Machine: My MacBook
       Duration: 3.1s
   ```

## Integration with Knowledge Commands

When knowledge is added/modified:
- Check if auto-sync is enabled
- If yes and `on_knowledge_change = true`: queue push operation
- Run push in background after debounce (5 seconds)

Example hooks in `/siftcoder:knowledge`:
```
After add-pattern:
  if auto_sync_enabled:
    queue_sync_operation("push", delay=5s)
```

## Error Handling

Common errors and responses:
- **Not configured**: Prompt to run `/siftcoder:config cloud configure`
- **Network error**: Queue operation, show retry options
- **Auth error**: Verify API key, suggest reconfigure
- **Server error**: Show server message, suggest contact support
- **Conflict**: Offer resolution options
- **Validation error**: Show specific validation failure

## Related Commands
- `/siftcoder:config cloud` - Configure cloud sync
- `/siftcoder:status` - View overall siftcoder status
- `/siftcoder:knowledge` - Manage local knowledge base
