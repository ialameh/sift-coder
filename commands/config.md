---
description: Configure siftcoder settings and cloud sync
argument-hint: [cloud]
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
---

# /siftcoder:config - Configuration Management

Configure siftcoder settings, including cloud sync credentials.

## Usage

```
/siftcoder:config <subcommand> [args]
```

## Subcommands

### cloud configure
Interactive setup for cloud sync configuration.

### cloud show
Display current cloud configuration (sanitized).

### cloud set <key> <value>
Set a specific configuration value.

### cloud unset <key>
Remove a configuration value.

### cloud test
Test connection to cloud sync server.

### cloud reset
Reset cloud configuration (requires confirmation).

## Arguments
- `$ARGUMENTS` - Subcommand and any arguments

## Instructions

You manage siftcoder configuration stored in `.claude/siftcoder-state/config/`.

### For `cloud configure`:
Launch interactive configuration flow:
1. Check if cloud config exists at `~/.config/siftcoder/cloud.toml` (or equivalent)
2. Prompt user for required settings:
   ```
   🌐 Cloud Sync Configuration

   Sync Server URL: [https://sync.siftcoder.com]
   API Key: [****************]
   Machine Name (optional): [My MacBook]

   Auto-sync on changes? (yes/no): yes
   Sync interval (minutes): [15]
   Conflict resolution: (manual|local|remote|newest): [manual]

   Save configuration? (yes/no):
   ```
3. Validate inputs:
   - URL must be valid HTTPS endpoint
   - API key format validation
   - Sync interval must be >= 1 minute
4. Create/update `cloud.toml`:
   ```toml
   [sync]
   server_url = "https://sync.siftcoder.com"
   api_key = "sk_live_xxxxx"
   machine_name = "My MacBook"
   machine_id = "uuid-from-file-or-generated"

   [sync.auto_sync]
   enabled = true
   interval_minutes = 15
   on_knowledge_change = true

   [sync.conflicts]
   resolution = "manual"  # manual|local|remote|newest|merge

   [sync.advanced]
   timeout_seconds = 30
   retry_attempts = 3
   offline_queue_max = 1000
   ```
5. Store machine_id in separate file if not exists
6. Confirm:
   ```
   ✅ Cloud configuration saved
   📍 Server: https://sync.siftcoder.com
   🔑 API Key: sk_live_...xxxxx
   💻 Machine: My MacBook (id: uuid-here)
   🔄 Auto-sync: enabled
   ```

### For `cloud show`:
1. Read cloud.toml configuration
2. Display sanitized version:
   ```
   ☁️  Cloud Sync Configuration

   Server URL: https://sync.siftcoder.com
   API Key: sk_live_...xxxxx (masked)
   Machine Name: My MacBook
   Machine ID: uuid-here

   Auto-Sync:
     Enabled: yes
     Interval: 15 minutes
     On Knowledge Change: yes

   Conflict Resolution: manual

   Last Sync: [timestamp or "Never"]
   Sync Status: [connected|offline|error]
   ```
3. If not configured:
   ```
   ⚠️  Cloud sync not configured
   Run: /siftcoder:config cloud configure
   ```

### For `cloud set <key> <value>`:
1. Parse key path (e.g., `sync.server_url`, `sync.auto_sync.enabled`)
2. Update configuration value
3. Validate type (bool, int, string)
4. Save updated config
5. Confirm change

### For `cloud unset <key>`:
1. Parse key path
2. Remove from config (if safe)
3. Save updated config
4. Confirm removal

### For `cloud test`:
1. Load cloud configuration
2. If not configured: error with setup prompt
3. Make health check request to sync server:
   ```
   GET /api/v1/health
   Authorization: Bearer <api_key>
   ```
4. Display results:
   ```
   🔌 Testing connection to https://sync.siftcoder.com...

   ✅ Connection successful
   Server version: 1.0.0
   Latency: 45ms
   Authenticated: yes
   User: user@example.com
   Plan: Pro
   ```
5. On error:
   ```
   ❌ Connection failed
   Error: [message]
   Troubleshooting:
   - Check server URL is correct
   - Verify API key is valid
   - Check network connection
   ```

### For `cloud reset`:
1. Use AskUserQuestion to confirm:
   ```
   ⚠️  This will remove all cloud sync configuration
   - Local knowledge will be preserved
   - Cloud data will NOT be deleted
   - Reconfigure to sync again

   Confirm reset? (yes/no):
   ```
2. If confirmed:
   - Backup current config to `cloud.toml.backup`
   - Delete `cloud.toml`
   - Confirm:
     ```
     ✅ Cloud configuration removed
     Backup saved to: cloud.toml.backup
     ```
3. If denied: cancel operation

## Configuration File Locations

- **macOS**: `~/.config/siftcoder/cloud.toml`
- **Linux**: `~/.config/siftcoder/cloud.toml`
- **Windows**: `%APPDATA%\siftcoder\cloud.toml`

## Machine ID Storage

- Stored separately: `~/.config/siftcoder/machine-id`
- Generated once on first configuration
- Used to identify this machine in multi-machine sync

## Security Notes

- API keys are sensitive: mask in display output
- Store config file with appropriate permissions (0600)
- Never log or display full API keys
- Include `.toml` files in `.gitignore`

## Related Commands
- `/siftcoder:sync` - Manual sync operations
- `/siftcoder:status` - View sync status
