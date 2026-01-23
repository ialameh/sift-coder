# Token Management Architecture

**Automatic context monitoring and checkpoint triggering to prevent data loss**

## Overview

SiftCoder's token management system monitors context usage in real-time and automatically triggers checkpoints before reaching context limits. This prevents losing accumulated work during long-running sessions.

## Key Features

- **Real-time Monitoring** - Continuous token usage tracking
- **Auto-Checkpointing** - Automatic saves at configurable thresholds
- **Multi-Level Alerts** - Warning, checkpoint, and critical thresholds
- **Accurate Counting** - Uses gpt-tokenizer library for precise token counts
- **Fast Estimation** - Fallback approximation for performance

## Architecture

### Components

```
┌─────────────────────────────────────────────────┐
│                  User Agent                     │
│  (Planner, Coder, Analyst, etc.)                │
└──────────────────┬──────────────────────────────┘
                   │
                   │ monitors
                   ▼
┌─────────────────────────────────────────────────┐
│            Token Monitor Service                │
│  - Calculate session tokens                     │
│  - Check thresholds                             │
│  - Trigger checkpoints                          │
└──────────────────┬──────────────────────────────┘
                   │
                   ├─────────────────────┐
                   │                     │
                   ▼                     ▼
        ┌──────────────────┐  ┌──────────────┐
        │   gpt-tokenizer  │  │  Checkpoint  │
        │    (Node.js)     │  │   Service    │
        └──────────────────┘  └──────────────┘
                   │                     │
                   ▼                     ▼
        ┌──────────────────┐  ┌──────────────┐
        │ cl100k_base      │  │  State Files │
        │ Encoding         │  │  Checkpoints │
        └──────────────────┘  └──────────────┘
```

### Token Monitor Service

**Location:** `services/token-monitor.ts`

**Responsibilities:**
- Calculate total session tokens
- Check against thresholds
- Recommend actions (continue, warn, checkpoint, pause)
- Format usage for display

**API:**
```typescript
// Calculate current session token usage
calculateSessionTokens(): Promise<TokenUsage>

// Check if tokens exceed threshold
checkTokenStatus(tokens: number): TokenStatus

// Determine if checkpoint needed
shouldCheckpoint(): Promise<{ needed: boolean, reason: string, usage: TokenUsage }>

// Format usage for display
formatTokenUsage(usage: TokenUsage): string
```

### Token Counter Implementation

**Location:** `services/token-monitor.ts`

**Purpose:** Accurate token counting using gpt-tokenizer library (Node.js)

**Methods:**
- `countTokens(text)` - Exact count using cl100k_base encoding
- `estimateTokens(text)` - Fast approximation (1 token ≈ 3.5 chars)

**Usage:**
```typescript
import { countTokens } from './token-monitor.js';

// Count tokens in text
const result = countTokens("Hello world");
// Returns: { tokens: 2, method: "exact", characters: 11 }

// CLI usage:
node services/token-monitor.ts count "Hello world"
// Output: {"tokens": 2, "method": "exact", "characters": 11}
```

## Token Thresholds

### Context Window

**Total:** 200,000 tokens (Claude Sonnet 4.5)

### Threshold Levels

| Level | Tokens | Percent | Action | Description |
|-------|--------|---------|--------|-------------|
| OK | <160k | <80% | Continue | Normal operation |
| Warning | 160k-180k | 80-90% | Log warning | Alert user, continue |
| Checkpoint | 180k-190k | 90-95% | Auto-checkpoint | Create checkpoint, continue |
| Critical | >190k | >95% | Checkpoint + Pause | Force checkpoint, pause workflow |

### Threshold Configuration

```typescript
const THRESHOLDS: TokenThresholds = {
  warn: 160_000,      // 80% of 200k
  checkpoint: 180_000, // 90%
  critical: 190_000    // 95%
};
```

**Customization:**
```typescript
// For shorter sessions, use more aggressive thresholds
const AGGRESSIVE_THRESHOLDS = {
  warn: 140_000,      // 70%
  checkpoint: 160_000, // 80%
  critical: 170_000    // 85%
};
```

## Token Calculation

### Session Token Count

**Includes:**
- `implementation-log.jsonl` - All logged observations
- `session.json` - Current session state
- `current-task.json` - Active task context
- `boundaries.json` - File boundaries
- `file-iteration.json` - File iteration state (if active)

**Algorithm:**
```typescript
async function calculateSessionTokens(): Promise<TokenUsage> {
  let totalText = '';

  // Read all state files
  const files = [
    'implementation-log.jsonl',
    'session.json',
    'current-task.json',
    'boundaries.json',
    'file-iteration.json'
  ];

  for (const file of files) {
    const content = await readFile(file);
    totalText += content + '\n';
  }

  // Count tokens (exact or estimate)
  const { tokens, method } = await countTokens(totalText);

  // Determine status
  const status = checkTokenStatus(tokens);

  return { tokens, method, status };
}
```

### Counting Methods

#### Exact Count (Primary)

Uses gpt-tokenizer library with cl100k_base encoding (GPT-4/Claude compatible):

```typescript
import { encode, getEncoding } from 'gpt-tokenizer';

const ENCODING = getEncoding('cl100k_base');
const tokens = encode(text, 'cl100k_base');
return tokens.length;
```

**Accuracy:** ±2% for Claude models

#### Fast Estimation (Fallback)

Simple character-based approximation:

```typescript
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}
```

**Accuracy:** ±10-15% (good enough for threshold checking)

**When used:**
- tiktoken unavailable
- Very large files (>1MB)
- Quick estimates during iteration

## Integration Points

### Observation Logger

**Location:** `services/observation-logger.ts`

**Integration:**
```typescript
async function logObservation(entry: ObservationEntry): Promise<void> {
  // Existing logging...
  await appendToLog(entry);

  // NEW: Token monitoring
  const tokenUsage = await calculateSessionTokens();

  if (tokenUsage.status === 'critical') {
    await createCheckpoint('auto-critical-' + Date.now());
    await pauseWorkflow();
    throw new Error('Context limit approaching - checkpoint created');
  }

  if (tokenUsage.status === 'checkpoint') {
    await createCheckpoint('auto-threshold-' + Date.now());
    console.log('⚠️  Auto-checkpoint created (token threshold)');
  }

  if (tokenUsage.status === 'warn') {
    console.log(`⚠️  Context usage: ${tokenUsage.tokens} tokens (${tokenUsage.threshold_percent}%)`);
  }
}
```

### File Iterator

**Location:** `services/file-iterator.ts`

**Integration:**
```typescript
async function processNextFile(state: FileIterationState): Promise<void> {
  // Process file...
  await extractInsights(file);
  await advanceToNextFile(state);

  // Check token usage after each file
  const { needed, reason, usage } = await shouldCheckpoint();

  if (needed) {
    await createIterationCheckpoint(state, reason);

    if (usage.status === 'critical') {
      await pauseIteration();
      throw new Error('Context limit reached - pausing iteration');
    }
  }
}
```

### Checkpoint Service

**Location:** `services/checkpoint-service.ts`

**Integration:**
```typescript
async function saveCheckpoint(name: string, data: CheckpointData): Promise<void> {
  // Calculate current token usage
  const tokenUsage = await calculateSessionTokens();

  // Include in checkpoint metadata
  data.token_economics = {
    session_tokens: tokenUsage.tokens,
    discovery_tokens: calculateDiscoveryTokens(),
    efficiency: calculateEfficiency(),
    patterns_learned: countPatternsLearned()
  };

  // Save checkpoint...
  await writeCheckpoint(name, data);
}
```

## Auto-Checkpoint Triggers

### File Count Trigger (File Iterator Only)

Checkpoint every N files:

```typescript
if (state.files.processed.length % state.checkpoint_every_n_files === 0) {
  await createCheckpoint('periodic');
}
```

**Example:**
```
File 10/50 ✓ Checkpoint: iter-123-10
File 20/50 ✓ Checkpoint: iter-123-20
File 30/50 ✓ Checkpoint: iter-123-30
```

### Token Threshold Trigger (All Workflows)

Checkpoint when approaching limit:

```typescript
const usage = await calculateSessionTokens();

if (usage.status === 'checkpoint') {
  await createCheckpoint('auto-threshold-' + Date.now());
}

if (usage.status === 'critical') {
  await createCheckpoint('auto-critical-' + Date.now());
  await pauseWorkflow();
}
```

**Example:**
```
[180k tokens] ⚠️  Auto-checkpoint created (threshold)
[185k tokens] Processing continues...
[190k tokens] 🛑 Critical checkpoint + pause
```

## User Feedback

### Status Display

```bash
/siftcoder:status

# Output includes:
Token Usage: 165,000 tokens (82%)
Method: exact
Status: WARNING
🟡 ████████████████░░░░░░░░░░░░░░░░░░░░ 82%
Consider creating a checkpoint soon
```

### Warning Messages

**80% Warning:**
```
⚠️  Context usage: 160,000 tokens (80%)
Checkpoint recommended. Continue with caution.
```

**90% Auto-Checkpoint:**
```
⚠️  Context usage: 180,000 tokens (90%)
✓ Auto-checkpoint created: auto-threshold-1706023456
Continuing...
```

**95% Critical:**
```
🛑 Context usage: 190,000 tokens (95%)
✓ Critical checkpoint created: auto-critical-1706023456
Workflow paused. Resume with: /siftcoder:continue
```

## Performance Considerations

### Token Counting Overhead

**Exact counting (tiktoken):**
- ~50ms per 10k tokens
- ~500ms per 100k tokens
- Acceptable for periodic checks

**Fast estimation:**
- ~1ms regardless of size
- Use for frequent checks during iteration

### Optimization Strategy

1. **Use estimation during iteration** - Fast checks between files
2. **Use exact count for checkpoints** - Accurate count when saving
3. **Cache recent counts** - Avoid recounting unchanged state
4. **Incremental counting** - Only count new observations

**Implementation:**
```typescript
let lastTokenCount = 0;
let lastCountTimestamp = Date.now();

async function calculateSessionTokensOptimized(): Promise<TokenUsage> {
  const now = Date.now();

  // Use cached value if recent (< 1 minute)
  if (now - lastCountTimestamp < 60_000) {
    return { tokens: lastTokenCount, method: 'cached' };
  }

  // Calculate fresh count
  const usage = await calculateSessionTokens();
  lastTokenCount = usage.tokens;
  lastCountTimestamp = now;

  return usage;
}
```

## Testing

### Unit Tests

**Token Counter:**
```bash
# Test exact counting
node services/token-monitor.ts count "Hello world"
# Expected: {"tokens": 2, "method": "exact"}

# Test via status check
node services/token-monitor.ts check
```

**Threshold Checking:**
```typescript
// Test threshold detection
assert(checkTokenStatus(150_000) === 'ok');
assert(checkTokenStatus(165_000) === 'warn');
assert(checkTokenStatus(185_000) === 'checkpoint');
assert(checkTokenStatus(192_000) === 'critical');
```

### Integration Tests

**Auto-Checkpoint Trigger:**
```bash
# Mock high token usage
export MOCK_TOKEN_COUNT=185000

# Run analysis
/siftcoder:analyze "test" --pattern "*.txt"

# Verify checkpoint created
ls .claude/siftcoder-state/checkpoints/ | grep auto-threshold
```

**Critical Pause:**
```bash
# Mock critical usage
export MOCK_TOKEN_COUNT=192000

# Run analysis
/siftcoder:analyze "test" --pattern "*.txt"

# Verify workflow paused
cat .claude/siftcoder-state/file-iteration.json | grep '"status": "paused"'
```

## Dependencies

### Required

- **Node.js 18+** - Runtime environment
- **gpt-tokenizer** - Token counting library (already in package.json)
  ```bash
  npm install gpt-tokenizer
  ```

## Future Enhancements

### Dynamic Thresholds

Adjust thresholds based on remaining work:

```typescript
function calculateDynamicThreshold(remainingFiles: number): number {
  // If many files remaining, checkpoint earlier
  if (remainingFiles > 50) {
    return 160_000; // 80%
  }
  // If few files remaining, allow higher usage
  return 180_000; // 90%
}
```

### Token Budget Tracking

Track token efficiency over time:

```typescript
interface TokenBudget {
  allocated: number;    // Total budget
  used: number;         // Tokens spent
  saved: number;        // Tokens saved via patterns
  efficiency: number;   // saved / used ratio
}
```

### Predictive Checkpointing

Predict when checkpoint will be needed:

```typescript
function predictCheckpointNeeded(
  currentTokens: number,
  filesRemaining: number,
  avgTokensPerFile: number
): boolean {
  const projectedTokens = currentTokens + (filesRemaining * avgTokensPerFile);
  return projectedTokens > THRESHOLDS.checkpoint;
}
```

## Troubleshooting

### "gpt-tokenizer not installed"

**Error:** `Cannot find module 'gpt-tokenizer'`

**Solution:**
```bash
npm install gpt-tokenizer
# Or use fallback estimation (automatic)
```

### Token count seems inaccurate

**Issue:** Reported tokens don't match expected

**Solutions:**
- Verify gpt-tokenizer installed correctly
- Check that cl100k_base encoding is used
- For Claude models, ±5% variance is normal
- Use exact count (not estimate) for critical checks

### Auto-checkpoint not triggering

**Issue:** Reaching token limit without checkpoint

**Solutions:**
- Verify token-monitor.ts integrated into agent
- Check thresholds in token-monitor.ts
- Manually trigger: `/siftcoder:checkpoint save`
- Review implementation-log.jsonl for token checks

## See Also

- [Checkpoint System](./checkpoints.md)
- [Analysis Workflow](../workflows/analysis.md)
- [Token Monitor Service](../../services/token-monitor.ts)
