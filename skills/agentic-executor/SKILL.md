---
name: agentic-executor
description: Reusable capabilities for autonomous multi-file operations
version: 1.0.0
---

# Agentic Executor Skill

**Reusable capabilities for autonomous multi-file operations.**

## Purpose

This skill provides reusable agentic capabilities for:
- Multi-file refactoring
- Parallel execution coordination
- Impact analysis
- Safe rollback mechanisms

## When to Use This Skill

Invoke this skill when you need:
1. Autonomous multi-file operations
2. Parallel processing with conflict detection
3. Safe refactoring with rollback
4. Impact analysis and preview

## Core Capabilities

### 1. Impact Analysis

**Analyze affected files before making changes:**

```bash
# Function: analyze_impact
# Input: Task description, transformation type
# Output: List of affected files, dependency graph

analyze_impact() {
  local task="$1"
  local type="$2"  # RENAME, EXTRACT, RESTRUCTURE

  echo "🔍 Analyzing impact for: $task"

  # Discover affected files
  case "$type" in
    RENAME)
      grep -r "class $old_name" --include="*.ts" --include="*.js" -l
      ;;
    EXTRACT)
      grep -r "$pattern" --include="*.ts" -l
      ;;
    RESTRUCTURE)
      find "$target_dir" -type f -name "*.ts"
      ;;
  esac
}
```

**Returns:**
- List of affected files
- Dependency relationships
- Risk assessment (LOW/MEDIUM/HIGH)

### 2. Dependency Resolution

**Build dependency graph and determine execution order:**

```python
# Function: resolve_dependencies
# Input: List of files, their imports
# Output: Execution levels (batches)

def resolve_dependencies(files):
    levels = {}
    visited = set()

    def get_level(file):
        if file in visited:
            return levels.get(file, 0)

        visited.add(file)
        max_dep_level = 0

        for dep in get_imports(file):
            dep_level = get_level(dep)
            max_dep_level = max(max_dep_level, dep_level + 1)

        levels[file] = max_dep_level
        return max_dep_level

    for file in files:
        get_level(file)

    return levels
```

**Example Output:**
```
Level 0: [User.ts]  # No dependencies
Level 1: [UserService.ts, UserRepository.ts]  # Depend on User.ts
Level 2: [UserController.ts, UserRoutes.ts]  # Depend on Level 1
```

### 3. Parallel Execution

**Execute independent files in parallel:**

```bash
# Function: execute_parallel
# Input: List of files, transformation function
# Output: Success/failure for each file

execute_parallel() {
  local files=("$@")
  local pids=()

  # Spawn workers in parallel
  for file in "${files[@]}"; do
    (
      apply_transformation "$file"
      echo "$?" > "${file}.status"
    ) &
    pids+=($!)
  done

  # Wait for all workers
  for pid in "${pids[@]}"; do
    wait $pid
  done

  # Collect results
  for file in "${files[@]}"; do
    status=$(cat "${file}.status")
    echo "$file: $status"
    rm "${file}.status"
  done
}
```

### 4. Conflict Detection

**Detect and resolve concurrent modification conflicts:**

```bash
# Function: detect_conflict
# Input: File path
# Output: True if conflict detected, false otherwise

detect_conflict() {
  local file="$1"
  local lock_file="${file}.lock"
  local version_file="${file}.version"

  # Check if file is locked
  if [ -f "$lock_file" ]; then
    return 0  # Conflict detected
  fi

  # Check version (detect modification during operation)
  if [ -f "$version_file" ]; then
    current_hash=$(md5sum "$file" | awk '{print $1}')
    stored_hash=$(cat "$version_file")

    if [ "$current_hash" != "$stored_hash" ]; then
      return 0  # File was modified
    fi
  fi

  return 1  # No conflict
}
```

### 5. Safe Rollback

**Automatic rollback on failure:**

```bash
# Function: safe_execute
# Input: File, transformation function, rollback function
# Output: Success/failure

safe_execute() {
  local file="$1"
  local transform_func="$2"
  local rollback_func="$3"

  # Create backup
  cp "$file" "${file}.backup"

  # Apply transformation
  if $transform_func "$file"; then
    # Success - remove backup
    rm "${file}.backup"
    return 0
  else
    # Failure - rollback
    echo "❌ Transformation failed for $file"
    echo "🔄 Rolling back..."

    if $rollback_func "${file}.backup" "$file"; then
      echo "✅ Rollback successful"
    else
      echo "❌ Rollback failed - manual intervention required"
    fi

    return 1
  fi
}
```

### 6. Preview Mode

**Show changes before applying:**

```bash
# Function: preview_changes
# Input: File, transformation
# Output: Diff preview

preview_changes() {
  local file="$1"
  local temp_file="${file}.tmp"

  # Apply transformation to temp file
  apply_transformation "$file" > "$temp_file"

  # Show diff
  echo "📋 Preview: $file"
  echo ""
  diff -u "$file" "$temp_file" || true

  # Clean up
  rm "$temp_file"

  # Ask user
  read -p "Apply these changes? (yes/no): " choice
  [ "$choice" = "yes" ]
}
```

## Usage Examples

### Example 1: Simple Rename

```bash
# Analyze impact
files=$(analyze_impact "Rename User to Account" "RENAME")

# Resolve dependencies
levels=$(resolve_dependencies "$files")

# Execute level by level
for level in {0..2}; do
  level_files=$(get_level_files "$level")

  if [ "$level" -eq 0 ]; then
    # Sequential for critical path
    for file in $level_files; do
      safe_execute "$file" transform_name rollback_name
    done
  else
    # Parallel for independent files
    execute_parallel "${level_files[@]}"
  fi
done
```

### Example 2: Complex Extraction

```bash
# Analyze what to extract
files=$(analyze_impact "Extract validation logic" "EXTRACT")

# Create new service file
create_validation_service

# Update all files that use validation
for file in $files; do
  # Preview first
  if preview_changes "$file"; then
    # Apply safely
    safe_execute "$file" extract_validation rollback_extract
  fi
done
```

### Example 3: Parallel Refactoring

```bash
# Large-scale refactoring with parallel execution
files=$(get_all_files "src/")

# Group by dependency
levels=$(resolve_dependencies "$files")

# Execute with MAX_WORKERS parallelism
MAX_WORKERS=5

for level in $(seq 0 $(max_level "$levels")); do
  level_files=$(get_level_files "$level" "$levels")

  # Process in waves
  while [ ${#level_files[@]} -gt 0 ]; do
    # Take up to MAX_WORKERS files
    batch=("${level_files[@]:0:$MAX_WORKERS}")
    level_files=("${level_files[@]:$MAX_WORKERS}")

    # Execute in parallel
    execute_parallel "${batch[@]}"
  done
done
```

## Best Practices

### DO ✅

1. **Always analyze impact first** - Know what will change
2. **Create backups** - Enable rollback capability
3. **Use preview mode** - Show changes before applying
4. **Resolve dependencies** - Execute in correct order
5. **Detect conflicts** - Prevent concurrent modification issues
6. **Validate after** - Run tests and quality checks

### DON'T ❌

1. **Don't skip preview** - Always show what will change
2. **Don't ignore dependencies** - Respect execution order
3. **Don't skip rollback** - Always have recovery mechanism
4. **Don't exceed worker limits** - Avoid overwhelming system
5. **Don't forget validation** - Always verify changes

## Performance Tips

### Optimize File Discovery

```bash
# Use ripgrep (faster than grep)
if command -v rg &> /dev/null; then
  files=$(rg "class User" --type ts -l)
else
  files=$(grep -r "class User" --include="*.ts" -l)
fi
```

### Cache Dependency Graph

```bash
# Cache for reuse
cache_file=".claude/siftcoder-state/deps-cache.json"

if [ -f "$cache_file" ]; then
  levels=$(cat "$cache_file")
else
  levels=$(resolve_dependencies "$files")
  echo "$levels" > "$cache_file"
fi
```

### Batch Similar Operations

```bash
# Group by file size for better load balancing
small_files=()
medium_files=()
large_files=()

for file in $files; do
  size=$(wc -c < "$file")
  if [ $size -lt 1000 ]; then
    small_files+=("$file")
  elif [ $size -lt 10000 ]; then
    medium_files+=("$file")
  else
    large_files+=("$file")
  fi
done

# Process differently by size
execute_parallel "${small_files[@]}"  # Many small files
execute_sequential "${large_files[@]}"  # Few large files
```

## Error Recovery

### Retry Logic

```bash
# Function: retry_with_backoff
# Input: Function, max retries, backoff seconds

retry_with_backoff() {
  local func="$1"
  local max_retries="$2"
  local backoff="$3"
  local attempt=0

  while [ $attempt -lt $max_retries ]; do
    if $func; then
      return 0  # Success
    fi

    ((attempt++))
    if [ $attempt -lt $max_retries ]; then
      echo "⚠️  Retry $attempt/$max_retries in ${backoff}s..."
      sleep $backoff
      ((backoff*=2))  # Exponential backoff
    fi
  done

  return 1  # All retries failed
}
```

### Partial Recovery

```bash
# If execution fails partway through, recover
if [ -f ".claude/siftcoder-state/agent-progress.json" ]; then
  completed=$(jq '.completed[]' .claude/siftcoder-state/agent-progress.json)
  remaining=$(filter_unprocessed "$all_files" "$completed")

  echo "🔄 Resuming from where we left off..."
  echo "Completed: $(echo $completed | wc -l)"
  echo "Remaining: $(echo $remaining | wc -l)"

  execute_parallel "${remaining[@]}"
fi
```

## Integration

**Used by:**
- `/siftcoder:agent` - Primary use case
- `/siftcoder:swarm` - Parallel task execution

**Integrates with:**
- Orchestrator agent - Coordination
- Boundary system - Safety
- Checkpoint system - Rollback
- Quality gates - Validation

## Testing

```bash
# Test with small, safe operation
/siftcoder:agent "Rename helper.ts to utils.ts"

# Test with medium complexity
/siftcoder:agent "Extract validation into validator.ts"

# Test with high complexity (after low-risk tests pass)
/siftcoder:agent "Apply repository pattern to data layer"
```

## Monitoring

### Progress Display

```
📊 Agentic Execution Progress

Analyzing impact... ✅
  Files affected: 45

Resolving dependencies... ✅
  Level 0: 1 file
  Level 1: 15 files
  Level 2: 29 files

Executing:
  Level 0: ████████████████████ 100% (1/1)
  Level 1: ████████████░░░░░░░░  60% (9/15)
  Level 2: ░░░░░░░░░░░░░░░░░░░░   0% (0/29)

Overall: ████████░░░░░░░░░░░░  37% (17/45)

Current: Processing src/services/auth.ts...
```

### Status Tracking

```json
{
  "task": "Rename User to Account",
  "status": "in_progress",
  "progress": {
    "total": 45,
    "completed": 17,
    "failed": 0,
    "in_progress": 1
  },
  "current_level": 1,
  "current_file": "src/services/auth.ts",
  "estimated_remaining_seconds": 582
}
```

---

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Usage patterns
- Best practices
- Integration guidelines
- Examples

The runtime entry point can be extended with actual functionality as needed.

## Allowed Tools

Bash, Read, Write, Edit, Grep, Glob

## Dependencies

- Orchestrator agent
- Boundary system
- Checkpoint system
- Quality gates
