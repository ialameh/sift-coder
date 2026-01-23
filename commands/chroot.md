---
description: Create a chroot jail for safe file operations - works with build, fix, investigate, document
argument-hint: <set [patterns...] | show | clear | add [patterns...] | remove [patterns...]>
allowed-tools: Read, Write, Bash, Glob, Grep
---

# /siftcoder:chroot - File Access Jail

Create a strict chroot jail that limits file access to an explicit allow-list. Works seamlessly with other siftcoder commands.

## Usage

```
/siftcoder:chroot set <patterns...>    - Set chroot jail with glob patterns
/siftcoder:chroot show                 - Show current chroot jail
/siftcoder:chroot clear                - Remove chroot jail
/siftcoder:chroot add <patterns...>    - Add patterns to existing jail
/siftcoder:chroot remove <patterns...> - Remove patterns from jail
/siftcoder:chroot status               - Quick status check
```

## Pattern Syntax

Supports glob patterns:
- `src/**/*.ts`           - All TypeScript files in src/
- `./Server/src/*.rs`     - Rust files in Server/src/
- `Admin/components/*.tsx` - TSX components
- `**/*.test.ts`          - All test files
- `config/*.toml`         - Config files
- `docs/**/*.md`          - Documentation

Multiple patterns:
```bash
/siftcoder:chroot set "src/**/*.ts" "tests/**/*.test.ts" "config/*.json"
```

## How It Works

### 1. Pattern Expansion
When you set chroot, patterns are expanded to file lists:

```bash
/siftcoder:chroot set "Admin/src/**/*.ts" "Server/src/**/*.rs"
```

Expands to:
```json
{
  "patterns": ["Admin/src/**/*.ts", "Server/src/**/*.rs"],
  "files": [
    "Admin/src/types/index.ts",
    "Admin/src/lib/apiClient.ts",
    "Server/src/lib.rs",
    "Server/src/main.rs",
    // ... all matching files
  ]
}
```

### 2. Access Enforcement
- ✅ Files in the allow-list → ACCESS GRANTED
- ❌ Files not in the list → ACCESS BLOCKED (with helpful error)
- 🔒 Common exceptions automatically allowed:
  - `node_modules/`
  - `.git/`
  - `target/`
  - `dist/`
  - `build/`
  - `.claude/`

### 3. Works With Other Commands

```bash
# Set up chroot for TypeScript files only
/siftcoder:chroot set "Admin/src/**/*.ts" "Admin/src/**/*.tsx"

# Now run any command - it will be jailed
/siftcoder:fix "bug in API client"        # Only sees Admin TS files
/siftcoder:build                          # Builds Admin app only
/siftcoder:gap-analysis                   # Analyzes Admin TS files only
/siftcoder:document                       - Docs Admin TS files only

# Clear chroot when done
/siftcoder:chroot clear
```

## Instructions

### If `$ARGUMENTS` is "show":

Read and display current chroot jail from `.claude/siftcoder-state/chroot.json`:

```bash
if [ -f .claude/siftcoder-state/chroot.json ]; then
  echo "🔒 CHROOT JAIL ACTIVE"
  echo ""
  echo "Patterns: $(jq -r '.patterns | length' .claude/siftcoder-state/chroot.json)"
  jq -r '.patterns[]' .claude/siftcoder-state/chroot.json | nl
  echo ""
  echo "Files: $(jq -r '.files | length' .claude/siftcoder-state/chroot.json)"
  echo "Set at: $(jq -r '.setAt' .claude/siftcoder-state/chroot.json)"
else
  echo "No chroot jail active. All files accessible."
fi
```

### If `$ARGUMENTS` is "status":

Quick status line:

```bash
if [ -f .claude/siftcoder-state/chroot.json ]; then
  patterns=$(jq -r '.patterns | length' .claude/siftcoder-state/chroot.json)
  files=$(jq -r '.files | length' .claude/siftcoder-state/chroot.json)
  echo "🔒 Chroot active: $patterns patterns, $files files"
else
  echo "No chroot (full access)"
fi
```

### If `$ARGUMENTS` is "clear":

```bash
rm -f .claude/siftcoder-state/chroot.json
echo "✅ Chroot jail cleared. Full file access restored."
```

### If `$ARGUMENTS` starts with "set":

1. Extract patterns after "set"
2. Expand glob patterns to file list
3. Store in `.claude/siftcoder-state/chroot.json`

```bash
# Extract patterns (everything after "set")
patterns=$(echo "$ARGUMENTS" | sed 's/^set //')

# Create temporary script to expand patterns
cat > /tmp/chroot-expand.sh << 'EXPAND_SCRIPT'
#!/bin/bash
patterns_json="$1"
project_root="$2"

# Use Python for reliable glob expansion
python3 << 'PYTHON_SCRIPT'
import sys
import json
import glob
from pathlib import Path

patterns = json.loads(sys.argv[1])
project_root = sys.argv[2]

all_files = set()

for pattern in patterns:
    # Handle both relative and absolute patterns
    if not pattern.startswith('/') and not pattern.startswith('./'):
        pattern = f"./{pattern}"

    # Expand glob
    expanded = glob.glob(pattern, recursive=True)

    for f in expanded:
        # Only include files, not directories
        if Path(f).is_file():
            # Resolve to absolute path
            abs_path = str(Path(f).resolve())
            all_files.add(abs_path)

# Sort and output
result = {
    "patterns": patterns,
    "files": sorted(list(all_files)),
    "fileCount": len(all_files)
}

print(json.dumps(result, indent=2))
PYTHON_SCRIPT
EXPAND_SCRIPT

chmod +x /tmp/chroot-expand.sh

# Get patterns as JSON array
patterns_array=$(echo "$patterns" | jq -R -s -c 'split(" ") | map(select(length > 0))')

# Expand patterns
expanded=$(bash /tmp/chroot-expand.sh "$patterns_array" "$CLAUDE_PROJECT_DIR")

# Add metadata and save
echo "$expanded" | jq --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '
  . + {
    "setAt": $timestamp,
    "exceptions": [
      "*/node_modules/*",
      "*/.git/*",
      "*/target/*",
      "*/dist/*",
      "*/build/*",
      "*/.claude/*",
      "*/package-lock.json",
      "*/yarn.lock",
      "*/Cargo.lock"
    ]
  }
' > .claude/siftcoder-state/chroot.json

# Display result
pattern_count=$(jq '.patterns | length' .claude/siftcoder-state/chroot.json)
file_count=$(jq '.fileCount' .claude/siftcoder-state/chroot.json)

echo "🔒 Chroot jail set!"
echo "   Patterns: $pattern_count"
echo "   Files: $file_count"
echo ""
echo "All file operations now limited to these files."
echo "Use /siftcoder:chroot show to view details."
echo "Use /siftcoder:chroot clear to remove jail."
```

### If `$ARGUMENTS` starts with "add":

Similar to set, but merges with existing jail:

```bash
if [ ! -f .claude/siftcoder-state/chroot.json ]; then
  echo "No chroot jail exists. Use /siftcoder:chroot set to create one first."
  exit 1
fi

# Extract patterns after "add"
new_patterns=$(echo "$ARGUMENTS" | sed 's/^add //')

# Merge with existing patterns
current_patterns=$(jq -c '.patterns' .claude/siftcoder-state/chroot.json)
merged_patterns=$(echo "$current_patterns $new_patterns" | jq -s -c 'add | unique')

# Re-expand and save
./siftcoder/scripts/chroot-manager.sh expand-and-save "$merged_patterns"
```

### If `$ARGUMENTS` starts with "remove":

Remove patterns and re-expand:

```bash
if [ ! -f .claude/siftcoder-state/chroot.json ]; then
  echo "No chroot jail exists."
  exit 1
fi

# Extract patterns after "remove"
patterns_to_remove=$(echo "$ARGUMENTS" | sed 's/^remove //')

# Remove patterns from list
current_patterns=$(jq -c '.patterns' .claude/siftcoder-state/chroot.json)
new_patterns=$(echo "$current_patterns" | jq -c --argjson to_remove "[$patterns_to_remove]" 'map(select(. as $p | $to_remove | index($p) | not))')

# Re-expand and save
./siftcoder/scripts/chroot-manager.sh expand-and-save "$new_patterns"
```

## Integration with Other Commands

When chroot is active, these commands automatically respect it:

| Command | Behavior with Chroot |
|---------|---------------------|
| `/siftcoder:build` | Only builds files in jail |
| `/siftcoder:fix` | Only modifies files in jail |
| `/siftcoder:gap-analysis` | Only analyzes files in jail |
| `/siftcoder:missing` | Only checks files in jail |
| `/siftcoder:document` | Only docs files in jail |
| `/siftcoder:investigate` | Only reads files in jail |
| `/siftcoder:tdd` | Only tests files in jail |

## Examples

### Safe Bug Fix

```bash
# Restrict to authentication module only
/siftcoder:chroot set "src/auth/**/*.ts"

# Fix bug - can't accidentally touch other files
/siftcoder:fix "login validation fails when email has dots"

# Clear when done
/siftcoder:chroot clear
```

### Feature Build

```bash
# Focus on Admin app
/siftcoder:chroot set "Admin/**/*" "!Admin/node_modules/*"

# Build Admin app only
/siftcoder:build

# Check for gaps
/siftcoder:gap-analysis
```

### Test-Driven Development

```bash
# Jail test and source files
/siftcoder:chroot set "src/utils/**/*.ts" "tests/utils/**/*.test.ts"

# Write tests first
/siftcoder:tdd "add validation to parseInput function"

# Verify implementation stays within bounds
/siftcoder:chroot show
```

### Multi-Project Monorepo

```bash
# Work on Server crate only
/siftcoder:chroot set "Server/**/*.rs" "Server/Cargo.toml"

# Investigate issue - won't see Admin or other projects
/siftcoder:investigate "memory leak in job queue"
```

## Chroot vs Focus vs Boundaries

| Feature | Chroot | Focus | Boundaries |
|---------|--------|-------|------------|
| **Purpose** | File access jail | Attention area | Modifiable scope |
| **Scope** | Read + Write | Read + Write | Write only |
| **Granularity** | File list with globs | Directory or feature | File list |
| **Enforcement** | Strict (block exceptions) | Soft (prioritize) | Medium (block modifications) |
| **Best for** | Safe operations, bug fixes | Feature work, context | Fix/optimize workflows |

## Error Messages

When trying to access files outside chroot:

```
❌ BLOCKED: File 'src/config/api.ts' is outside chroot jail.

🔒 Current chroot: 3 patterns, 47 files
   - src/auth/**/*.ts
   - src/auth/**/*.tsx
   - tests/auth/**/*.test.ts

💡 To access this file:
   1. Add pattern: /siftcoder:chroot add "src/config/**/*.ts"
   2. Or clear jail: /siftcoder:chroot clear
```

## Chroot State File

Stored in `.claude/siftcoder-state/chroot.json`:

```json
{
  "patterns": ["src/**/*.ts", "tests/**/*.test.ts"],
  "files": [
    "/absolute/path/src/auth/login.ts",
    "/absolute/path/src/auth/session.ts"
  ],
  "fileCount": 47,
  "exceptions": ["*/node_modules/*", "*/.git/*"],
  "setAt": "2025-01-15T10:30:00Z"
}
```

## Tips

```
CHROOT TIPS

Start with broad patterns:
  /siftcoder:chroot set "src/**/*.ts"

Then refine:
  /siftcoder:chroot add "tests/**/*.test.ts"
  /siftcoder:chroot remove "src/deprecated/**/*"

Combine with focus for super-strict mode:
  /siftcoder:focus src/auth
  /siftcoder:chroot set "src/auth/**/*.ts"
  Now you're both focused AND jailed!

Use with documentation:
  /siftcoder:chroot set "src/**/*.ts" "README.md"
  /siftcoder:document --api
```

## Now: Execute Chroot Command

Processing: `$ARGUMENTS`...
