# Analysis Workflow

**Sequential file processing with insight extraction and auto-checkpointing**

## Overview

The Analysis workflow enables processing multiple files sequentially to extract insights, identify patterns, and generate summaries. Designed for analyzing transcripts, emails, logs, and other non-code documents.

## Key Features

- **Sequential Processing** - Process files one-by-one with state tracking
- **Auto-Checkpointing** - Automatic progress saves based on file count and token usage
- **Insight Accumulation** - Build knowledge incrementally across files
- **Resumable** - Pause and resume at any point
- **Token-Aware** - Monitors context usage to prevent data loss

## Workflow Phases

### Phase 1: Initialization

1. User invokes `/siftcoder:analyze` with goal and pattern
2. Orchestrator routes to Analyst agent
3. File pattern expands to list of files
4. File iteration state initialized
5. Insights accumulation file created

**State Created:**
- `.claude/siftcoder-state/file-iteration.json`
- `.claude/siftcoder-state/insights.json`

### Phase 2: Sequential Iteration

For each file in the list:

1. **Read** - Load file contents
2. **Extract** - Apply analysis criteria, extract insights
3. **Accumulate** - Add insights to insights.json
4. **Progress** - Update file iteration state
5. **Monitor** - Check token usage
6. **Checkpoint** - Auto-checkpoint if thresholds met

**Checkpointing Triggers:**
- Every N files (default: 10)
- Token threshold (90% = 180k tokens)
- Token critical (95% = 190k tokens) + pause

### Phase 3: Synthesis

After all files processed:

1. **Load** - Read all accumulated insights
2. **Analyze** - Identify patterns, themes, frequencies
3. **Summarize** - Generate summary report
4. **Output** - Present findings to user

## State Management

### File Iteration State

**Location:** `.claude/siftcoder-state/file-iteration.json`

**Purpose:** Tracks progress through file list

**Schema:**
```json
{
  "id": "iter-<timestamp>",
  "status": "in_progress" | "completed" | "paused",
  "pattern": "transcripts/*.txt",
  "goal": "Extract customer pain points",
  "files": {
    "total": 50,
    "processed": ["file-001.txt", ...],
    "remaining": ["file-024.txt", ...],
    "current": "file-023.txt"
  },
  "insights": {
    "file": ".claude/siftcoder-state/insights.json",
    "count": 47
  },
  "checkpoints": ["iter-123-10", "iter-123-20"],
  "started_at": "2026-01-23T10:00:00Z",
  "updated_at": "2026-01-23T10:45:00Z",
  "checkpoint_every_n_files": 10
}
```

### Insights File

**Location:** `.claude/siftcoder-state/insights.json` (or custom)

**Purpose:** Accumulates extracted insights

**Schema:**
```json
{
  "goal": "Extract customer pain points",
  "files_analyzed": 50,
  "insights": [
    {
      "id": "insight-<timestamp>",
      "type": "pain_point",
      "category": "performance",
      "quote": "The dashboard takes forever to load",
      "source": "transcripts/call-012.txt",
      "timestamp": "2026-01-23T10:15:00Z",
      "metadata": {
        "frequency": 7,
        "severity": "high"
      }
    }
  ],
  "patterns": [
    {
      "theme": "Performance complaints",
      "count": 23,
      "files": ["call-012.txt", ...]
    }
  ],
  "summary": "47 pain points identified...",
  "started_at": "2026-01-23T10:00:00Z",
  "completed_at": "2026-01-23T11:30:00Z"
}
```

## Auto-Checkpoint Logic

### File Count Trigger

Checkpoint every N files (configurable):

```typescript
if (filesProcessed % checkpointEvery === 0) {
  await createCheckpoint('periodic');
}
```

**Example:**
```
Processing file 10/50... ✓ Checkpoint created (periodic)
Processing file 20/50... ✓ Checkpoint created (periodic)
Processing file 30/50... ✓ Checkpoint created (periodic)
```

### Token Threshold Trigger

Monitor context usage continuously:

```typescript
const tokenUsage = await calculateSessionTokens();

if (tokenUsage >= 190_000) {  // 95% critical
  await createCheckpoint('token-critical');
  await pauseIteration();
  throw new Error('Context limit approaching');
}

if (tokenUsage >= 180_000) {  // 90% checkpoint
  await createCheckpoint('token-threshold');
  console.log('⚠️  Auto-checkpoint created');
}

if (tokenUsage >= 160_000) {  // 80% warning
  console.log('⚠️  Context usage: 80%');
}
```

**Example:**
```
Processing file 23/50...
⚠️  Context usage: 180,000 tokens (90%)
✓ Auto-checkpoint created (token-threshold)
Continuing...

Processing file 27/50...
⚠️  Context usage: 190,000 tokens (95%)
✓ Critical checkpoint created
🛑 Iteration paused - Resume with /siftcoder:continue
```

## Resuming After Interruption

### Automatic Resume

State is preserved across sessions:

```bash
# Session 1 - Interrupted
/siftcoder:analyze "Extract pain points" --pattern "calls/*.txt"
# Processed 23/50 files... [interrupted]

# Session 2 - Resume
/siftcoder:continue

# Output:
✓ Resuming iteration: iter-1234567890
  Progress: 23/50 files
  Next file: calls/call-024.txt
  Insights: 47 accumulated
```

### Manual Resume

Explicitly resume with command:

```bash
/siftcoder:analyze --resume
```

### Checkpoint Restoration

Restore from specific checkpoint:

```bash
/siftcoder:checkpoint restore iter-1234567890-20
/siftcoder:continue
```

## Use Cases

### Customer Transcript Analysis

**Goal:** Extract pain points, frustrations, feature requests

**Input:** 50 customer call transcripts (*.txt)

**Process:**
1. Initialize: Expand `calls/*.txt` → 50 files
2. Iterate: Process each transcript, extract quotes
3. Checkpoint: Every 10 files + token monitoring
4. Synthesize: Identify top pain points, frequencies
5. Output: Summary report with recommendations

**Output Example:**
```markdown
# Customer Pain Points Analysis

**Files Analyzed:** 50 transcripts
**Total Insights:** 47 pain points

## Top Pain Points

1. **Performance Issues** (23 mentions, 46%)
   - Dashboard load times (12x)
   - Report generation (8x)
   - Search functionality (3x)

2. **Usability Concerns** (15 mentions, 30%)
   - Navigation confusion (9x)
   - Unclear error messages (6x)

3. **Missing Features** (9 mentions, 18%)
   - Bulk operations (5x)
   - Mobile app (4x)
```

### Email Lead Prioritization

**Goal:** Rank emails by conversion likelihood

**Input:** 100 sales emails (*.eml)

**Process:**
1. Iterate through emails
2. Extract: company size, budget signals, urgency
3. Score: 0-10 conversion likelihood
4. Checkpoint: Every 10 emails
5. Output: Ranked list with reasoning

**Output Example:**
```json
{
  "leads": [
    {
      "email": "cto@bigco.com",
      "score": 9.2,
      "reasoning": "Enterprise, budget confirmed, urgent timeline",
      "priority": "HIGH"
    },
    {
      "email": "founder@startup.com",
      "score": 7.5,
      "reasoning": "Early stage, high interest, limited budget",
      "priority": "MEDIUM"
    }
  ]
}
```

### Support Ticket Categorization

**Goal:** Categorize tickets by topic and sentiment

**Input:** 200 support tickets (*.md)

**Process:**
1. Iterate through tickets
2. Extract: topic, sentiment, urgency
3. Categorize: Group by theme
4. Checkpoint: Every 20 tickets
5. Output: Category breakdown

### FAQ Extraction

**Goal:** Identify common questions and answers

**Input:** Chat logs, support transcripts

**Process:**
1. Iterate through logs
2. Detect: Questions (pattern matching)
3. Extract: Context, answer if present
4. Aggregate: By frequency
5. Output: FAQ list ranked by frequency

## Best Practices

### DO ✅

- **Specific goals** - "Extract pain points and feature requests" not "Analyze"
- **Reasonable batches** - Process 20-100 files at a time for best results
- **Monitor progress** - Use `/siftcoder:status` to check progress
- **Resume interrupted** - Always resume with `/siftcoder:continue`
- **Review insights** - Check insights.json after completion

### DON'T ❌

- **Too many files** - Processing >200 files may require multiple sessions
- **Ignore warnings** - Token warnings indicate checkpoint needed
- **Delete state** - Never delete file-iteration.json during active analysis
- **Run parallel** - Only one analysis at a time (state collision)
- **Expect code** - Analysis workflow is read-only, no code modifications

## Performance

### Small Datasets (<20 files)

- **Duration:** 10-20 minutes
- **Checkpoints:** 1-2 automatic
- **Token usage:** 50k-80k
- **Sessions:** Single session

### Medium Datasets (20-100 files)

- **Duration:** 30-60 minutes
- **Checkpoints:** 3-5 automatic
- **Token usage:** 120k-170k
- **Sessions:** Single session with warnings

### Large Datasets (>100 files)

- **Duration:** Multiple hours
- **Checkpoints:** 10+ automatic
- **Token usage:** Multiple session cycles
- **Sessions:** 2-3 resume cycles expected

**Recommendation:** For >100 files, reduce checkpoint interval:
```bash
/siftcoder:analyze "goal" --pattern "*.txt" --checkpoint-every 5
```

## Error Handling

### File Read Errors

**Scenario:** Permission denied, file not found

**Behavior:**
- Log error
- Skip file
- Continue to next file
- Include in error report

### Context Limit Reached

**Scenario:** Token usage exceeds 95%

**Behavior:**
- Create critical checkpoint
- Pause iteration
- Notify user
- Resume with `/siftcoder:continue`

### Checkpoint Failures

**Scenario:** Checkpoint save fails (disk full)

**Behavior:**
- Log warning
- Continue processing
- Retry at next checkpoint interval

### Corrupted State

**Scenario:** file-iteration.json invalid

**Behavior:**
- Attempt recovery from last checkpoint
- If recovery fails, restart from beginning
- Preserve insights.json (accumulated data)

## Troubleshooting

### "No files found matching pattern"

**Cause:** Invalid glob pattern or no matching files

**Solution:**
- Verify pattern syntax
- Use absolute paths if needed
- Test with `ls` command first
- Check file permissions

### "Context limit approaching"

**Cause:** Token usage exceeds 95%

**Solution:**
- Analysis auto-paused
- Resume with `/siftcoder:continue`
- Reduce checkpoint interval for next run

### "Cannot resume - no active iteration"

**Cause:** file-iteration.json missing or status=completed

**Solution:**
- Check `/siftcoder:status`
- If completed, insights.json contains results
- Start new analysis if needed

### Missing insights after completion

**Cause:** insights.json not written or cleared

**Solution:**
- Check last checkpoint
- Restore from checkpoint if needed
- Verify output path in command

## Integration with Other Workflows

### Analysis → Documentation

```bash
# Extract requirements from user research
/siftcoder:analyze "Extract user needs" --pattern "research/*.txt"

# Generate user manual based on insights
/siftcoder:document user-manual
```

### Analysis → Feature Planning

```bash
# Analyze customer requests
/siftcoder:analyze "Feature requests" --pattern "feedback/*.md"

# Build most requested features
/siftcoder:build
# (Planner can reference insights.json)
```

### Analysis → Decision Making

```bash
# Analyze support tickets
/siftcoder:analyze "Bug severity" --pattern "tickets/*.md"

# Use insights to prioritize fixes
/siftcoder:fix <high-priority-issue>
```

## See Also

- [Token Management](../architecture/token-management.md)
- [Checkpoint System](../architecture/checkpoints.md)
- [File Iterator Service](../../services/file-iterator.ts)
- [Analyst Agent](../../agents/analyst.md)
- [`/siftcoder:analyze` Command](../../commands/analyze.md)
