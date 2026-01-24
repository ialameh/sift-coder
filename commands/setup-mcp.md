---
description: Setup MCP servers with auto-detection
argument-hint: [servers...]
allowed-tools: Read, Write, Edit, Bash, Task
---

# /setup-mcp - MCP Server Configuration

Automatically configures Model Context Protocol (MCP) servers based on project detection.

## Usage

```
/setup-mcp [server-names...]

Examples:
  /setup-mcp
  /setup-mcp github filesystem memory
  /setup-mcp --list
  /setup-mcp --detect
```

## Options

- No arguments - Auto-detect and configure recommended servers
- `--list` - List all available MCP servers
- `--detect` - Show detected project capabilities
- `--save` - Save configuration to file

## Pre-configured Servers

**Development:**
- `github` - GitHub operations (PRs, issues, repos)
- `git` - Git operations (commits, branches, history)
- `typescript-eslint` - TypeScript and ESLint analysis

**Database:**
- `supabase` - Supabase database operations
- `postgres` - PostgreSQL operations
- `sqlite` - SQLite operations

**Productivity (Recommended):**
- `memory` - Persistent memory across sessions ⭐
- `sequential-thinking` - Chain-of-thought reasoning ⭐
- `fetch` - HTTP client for API calls

**Filesystem:**
- `filesystem` - Filesystem operations

**Search:**
- `brave-search` - Web search via Brave API
- `exa` - AI-powered web search

**DevOps:**
- `docker` - Docker container management
- `kubernetes` - Kubernetes cluster management

**Cloud:**
- `aws` - AWS services integration

**Communication:**
- `slack` - Slack integration

## Process

### Phase 1: Project Detection
1. Scan project structure
2. Check package.json for dependencies
3. Detect configuration files
4. Identify relevant MCP servers

### Phase 2: Configuration Generation
1. Select servers based on detection
2. Include recommended servers
3. Format configuration for Claude
4. Generate JSON config

### Phase 3: Configuration Display
1. Show detected capabilities
2. Display generated config
3. Provide setup instructions
4. Offer to save config

## Example Output

```
⚙️  MCP Server Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Detecting project capabilities...

Detected:
  ✅ Git repository (.git/config)
  ✅ TypeScript project (tsconfig.json)
  ✅ Node.js project (package.json)
  ✅ ESLint configured (.eslintrc.js)

Recommended servers:
  ⭐ memory - Persistent memory across sessions
  ⭐ sequential-thinking - Chain-of-thought reasoning
  ⭐ fetch - HTTP client for API calls

Selected configuration:
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT_HERE"
      }
    },
    "typescript-eslint": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-typescript-eslint"]
    }
  }
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Setup Instructions:

1. Save configuration to:
   macOS/Linux: ~/.claude/mcp_servers.json
   Windows: %APPDATA%/Claude/mcp_servers.json

2. Set required environment variables:
   → GITHUB_PERSONAL_ACCESS_TOKEN (for github server)

3. Restart Claude to load new MCP servers

4. Verify servers are loaded in Claude settings

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commands:
  /setup-mcp --save    - Save config to file
  /setup-mcp --list    - List all available servers
  /setup-mcp github    - Add specific server
```

## Tips & Hints

```

MCP SERVER BASICS:

What are MCP servers?
  → Extensions that connect Claude to external tools
  → Provide file system access, API calls, database queries
  → Run as separate processes, communicate via stdio

Why use them?
  → Access your files and directories
  → Run commands and scripts
  → Query databases and APIs
  → Remember things across sessions

SELECTION STRATEGY:

✅ Always include (recommended):
  → memory - Remembers facts across sessions
  → sequential-thinking - Breaks down complex problems
  → fetch - Makes HTTP requests

✅ Include for most projects:
  → filesystem - File operations
  → git - Git operations
  → github - GitHub integration (if using GitHub)

✅ Include as needed:
  → Database servers (postgres, sqlite, supabase)
  → DevOps tools (docker, kubernetes)
  → Cloud providers (aws, gcp)
  → Communication (slack)

❌ Rarely needed:
  → Specialized tools (puppeteer, brave-search)
  → Service-specific (unless actively using)

ENVIRONMENT VARIABLES:

Required tokens:
  → GITHUB_PERSONAL_ACCESS_TOKEN - GitHub API
  → SLACK_READ_TOKEN, SLACK_WRITE_TOKEN - Slack
  → AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY - AWS
  → BRAVE_API_KEY - Brave Search
  → SUPABASE_ACCESS_TOKEN - Supabase

Where to set them:
  → In MCP config env section
  → System environment variables
  → .env file (for local development)

TROUBLESHOOTING:

Server not loading?
  → Check npx can run the command
  → Verify all required env vars are set
  → Check Claude logs for errors
  → Try running command manually first

Permission errors?
  → filesystem server needs correct path
  → Use absolute paths when possible
  → Check file/directory permissions

Performance issues?
  → Disable unused servers
  → Limit filesystem server scope
  → Avoid heavy servers (puppeteer)

CONFIGURATION LOCATION:

macOS/Linux:
  ~/.claude/mcp_servers.json

Windows:
  %APPDATA%/Claude/mcp_servers.json

Format:
  {
    "mcpServers": {
      "server-name": {
        "command": "npx",
        "args": ["-y", "@package/name"],
        "env": { "VAR": "value" }
      }
    }
  }
```

---

## Now: Setup MCP

**$ARGUMENTS**

Using MCPConfigService to configure servers...

1. Detecting project capabilities
2. Selecting appropriate servers
3. Generating configuration
4. Providing setup instructions

Starting setup...
