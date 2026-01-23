# /siftcoder:analyze

**Analyze multiple files for insights without writing code.**

## Purpose

The `/siftcoder:analyze` command processes multiple files sequentially to extract insights, identify patterns, and generate summaries. Perfect for analyzing transcripts, emails, logs, or any non-code documents.

## Syntax

```bash
/siftcoder:analyze "<goal>" --pattern "<glob>" [options]
```

## Parameters

### Required

- **`goal`** - What to extract/analyze (e.g., "Extract pain points and feature requests")
- **`--pattern`** - Glob pattern for files to analyze (e.g., "transcripts/*.txt")

### Optional

- **`--output`** - Output file for insights (default: `.claude/siftcoder-state/insights.json`)
- **`--format`** - Output format: `json`, `markdown`, `csv` (default: `json`)
- **`--checkpoint-every`** - Auto-checkpoint every N files (default: `10`)
- **`--resume`** - Resume paused iteration (ignores other arguments)

## How It Works

### 1. Setup Phase

- Expands glob pattern to file list
- Creates file-iteration state
- Initializes insights accumulation file
- Determines checkpoint frequency

### 2. Iteration Phase

For each file:
- Read file contents
- Extract insights per goal
- Accumulate to insights.json
- Update progress state
- Check token usage
- Auto-checkpoint if needed

### 3. Synthesis Phase

After all files processed:
- Identify patterns and themes
- Calculate frequencies and trends
- Generate summary report
- Output findings to user

## Auto-Checkpointing

The analyzer automatically saves progress to prevent data loss:

### File Count Checkpoints

Creates checkpoint every N files (default: 10):

```
Processing file 10/50... ✓ Checkpoint created
Processing file 20/50... ✓ Checkpoint created
Processing file 30/50... ✓ Checkpoint created
```

### Token Threshold Checkpoints

Monitors context usage and checkpoints before limits:

```
⚠️  Context usage: 180,000 tokens (90%)
✓ Auto-checkpoint created (token threshold)

⚠️  Context usage: 190,000 tokens (95%)
✓ Critical checkpoint created
🛑 Iteration paused - Resume with /siftcoder:continue
```

## Resuming After Interruption

If analysis is interrupted:

```bash
# Resume from where you left off
/siftcoder:analyze --resume

# Or use continue command
/siftcoder:continue
```

Progress is automatically restored:
```
✓ Resuming iteration: iter-1234567890
  Progress: 23/50 files
  Current: transcripts/call-024.txt
  Insights: 47
```

## Examples

### Customer Language Analysis

Extract pain points from customer call transcripts:

```bash
/siftcoder:analyze "Extract pain points, frustrations, and feature requests" \\
  --pattern "transcripts/*.txt"
```

**Output:**
```json
{
  "goal": "Extract pain points, frustrations, and feature requests",
  "files_analyzed": 50,
  "insights": [
    {
      "type": "pain_point",
      "category": "performance",
      "quote": "The dashboard takes forever to load",
      "source": "transcripts/call-012.txt",
      "metadata": { "frequency": 7, "severity": "high" }
    }
  ],
  "patterns": [
    { "theme": "Performance complaints", "count": 23 }
  ]
}
```

### Email Prioritization

Rank emails by conversion likelihood:

```bash
/siftcoder:analyze "Rank by conversion likelihood with reasoning" \\
  --pattern "inbox/*.eml" \\
  --output "lead-priority.json"
```

**Output:**
```json
{
  "goal": "Rank by conversion likelihood",
  "insights": [
    {
      "type": "lead_score",
      "email": "prospect@company.com",
      "score": 8.5,
      "reasoning": "Enterprise company, urgent pain point, budget confirmed",
      "source": "inbox/prospect-001.eml"
    }
  ]
}
```

### Support Ticket Categorization

Categorize tickets by topic and sentiment:

```bash
/siftcoder:analyze "Categorize by topic and sentiment" \\
  --pattern "tickets/**/*.md" \\
  --format markdown
```

**Output (Markdown):**
```markdown
# Support Ticket Analysis

## Categories

### Billing Issues (32 tickets)
- High urgency: 12
- Medium urgency: 15
- Low urgency: 5

### Technical Support (28 tickets)
- Bug reports: 15
- Feature requests: 8
- How-to questions: 5
```

### FAQ Extraction

Identify common questions and answers:

```bash
/siftcoder:analyze "Identify common questions and extract answers" \\
  --pattern "support-logs/*.txt" \\
  --checkpoint-every 20
```

### Research Synthesis

Synthesize insights from research papers:

```bash
/siftcoder:analyze "Extract key findings, methodologies, and conclusions" \\
  --pattern "papers/*.pdf" \\
  --output "research-synthesis.json"
```

## Output Formats

### JSON (default)

```json
{
  "goal": "string",
  "files_analyzed": number,
  "insights": [...],
  "patterns": [...],
  "summary": "string"
}
```

### Markdown

```markdown
# Analysis Summary
## Key Findings
## Patterns Detected
## Recommendations
```

### CSV

```csv
type,category,quote,source,timestamp
pain_point,performance,"Dashboard slow",call-012.txt,2026-01-23T10:15:00Z
```

## Progress Tracking

Check analysis progress:

```bash
/siftcoder:status
```

**Output:**
```
📄 File Iteration: IN_PROGRESS

Goal: Extract customer pain points
Pattern: transcripts/*.txt

Progress: 23/50 files (46%)
████████████████████░░░░░░░░░░░░░░░░░░░░ 46%

Current: transcripts/call-024.txt
Insights: 47
Checkpoints: 2

Started: 2026-01-23 10:00:00
Updated: 2026-01-23 10:45:00
```

## Pause and Resume

### Pause Current Analysis

```bash
/siftcoder:pause
```

**Output:**
```
✓ Iteration paused
  Progress: 23/50 files
  State saved to: .claude/siftcoder-state/file-iteration.json
```

### Resume Paused Analysis

```bash
/siftcoder:continue
```

**Output:**
```
✓ Resuming iteration: iter-1234567890
  Progress: 23/50 files
  Next file: transcripts/call-024.txt
  Insights: 47
```

## State Files

### File Iteration State

Location: `.claude/siftcoder-state/file-iteration.json`

Tracks:
- Total files and progress
- Current file being processed
- Accumulated insights count
- Checkpoint history
- Timestamps

### Insights File

Location: `.claude/siftcoder-state/insights.json` (or custom path)

Contains:
- Extracted insights with metadata
- Identified patterns and themes
- Summary and recommendations
- Analysis timestamps

### Checkpoints

Location: `.claude/siftcoder-state/checkpoints/iter-<id>-<count>.json`

Each checkpoint contains:
- File iteration state
- Accumulated insights snapshot
- Token usage at checkpoint time
- Workflow context

## Best Practices

### DO ✅

- Use specific analysis goals ("Extract X and Y" not just "Analyze")
- Set reasonable checkpoint frequency (10-20 files)
- Monitor progress with `/siftcoder:status`
- Resume interrupted analyses with `/siftcoder:continue`
- Review insights.json after completion

### DON'T ❌

- Don't analyze too many files at once (>100) without checkpoints
- Don't ignore token warnings
- Don't delete state files during active iteration
- Don't run multiple analyses simultaneously (state collision)
- Don't expect code output (this is analysis-only)

## Troubleshooting

### No Files Found

**Error:** `No files found matching pattern: transcripts/*.txt`

**Solution:**
- Verify glob pattern is correct
- Use absolute paths if needed
- Check file permissions
- Try simpler pattern first (e.g., `*.txt`)

### Context Limit Reached

**Message:** `Context limit approaching - checkpoint created`

**Solution:**
- Iteration auto-paused
- Resume with `/siftcoder:continue`
- Consider shorter checkpoint intervals (`--checkpoint-every 5`)

### Interrupted Analysis

**Scenario:** Claude session ended mid-analysis

**Solution:**
```bash
# Resume from last checkpoint
/siftcoder:continue

# Or check progress first
/siftcoder:status
```

### Missing Insights

**Issue:** Not extracting expected insights

**Solution:**
- Refine analysis goal (be more specific)
- Check sample file to verify content matches goal
- Review insights.json to see what's being extracted
- Adjust prompt in goal parameter

## Performance

### Small Datasets (<20 files)

- No special configuration needed
- Checkpoints optional
- Completes in single session

### Medium Datasets (20-100 files)

- Use default checkpoint interval (10)
- Expected time: 30-60 minutes
- 1-2 checkpoints likely

### Large Datasets (>100 files)

- Reduce checkpoint interval (`--checkpoint-every 5`)
- Expect multiple resume cycles
- Monitor token usage closely
- Consider breaking into batches

## Integration

### With Other Commands

```bash
# Analyze, then document findings
/siftcoder:analyze "Extract pain points" --pattern "calls/*.txt"
/siftcoder:document user-manual

# Analyze support tickets, then build feature
/siftcoder:analyze "Common feature requests" --pattern "tickets/*.md"
/siftcoder:build
```

### With Workflows

```bash
# Discovery workflow
/siftcoder:analyze "Customer needs" --pattern "research/*.txt"
# Use insights to inform planning
/siftcoder --plan "Build features based on customer needs"
```

## Safety

- **Read-only** - Never modifies input files
- **Bounded** - Only processes specified pattern
- **Resumable** - Safe to interrupt and resume
- **Checkpointed** - Progress automatically saved
- **No side effects** - Analysis doesn't change system state

## See Also

- `/siftcoder:investigate` - Code investigation (different from analysis)
- `/siftcoder:document` - Generate documentation
- `/siftcoder:status` - Check progress
- `/siftcoder:continue` - Resume paused work
- `/siftcoder:checkpoint` - Manual checkpoint management

---

**Invokes:** `siftcoder-analyst` agent
**Uses:** `file-iterator`, `token-monitor`, `checkpoint-service`
**Output:** `.claude/siftcoder-state/insights.json`
