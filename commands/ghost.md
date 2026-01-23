---
description: Parallel Universe Code Exploration - Explore "what if" alternative implementations
argument-hint: "<what-if scenario>" [--apply|--compare|--save]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# /siftcoder:ghost - Parallel Universe Code Exploration

Explore alternative implementations without touching your actual code. Ask "what if?" and see the consequences.

## Usage

```
/siftcoder:ghost "<scenario>"          - Explore what-if scenario
/siftcoder:ghost --list                - List saved ghost explorations
/siftcoder:ghost --apply <id>          - Apply a ghost reality
/siftcoder:ghost --compare <id>        - Side-by-side comparison
/siftcoder:ghost --discard <id>        - Delete ghost exploration
```

## Philosophy

```
Every design decision closes doors.

"What if we had chosen differently?"
"What if we used X instead of Y?"
"What would the code look like if we started over?"

Ghost mode lets you explore these parallel universes
without risk. See the consequences before committing.

Think of it as:
  • A/B testing for architecture
  • Safe exploration of alternatives
  • Decision validation through simulation
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                  GHOST EXPLORATION ENGINE                   │
└─────────────────────────────────────────────────────────────┘

    Your Reality                    Ghost Reality
    ════════════                    ═════════════
         │                               │
    ┌────┴────┐                    ┌─────┴─────┐
    │ Current │     ──────►        │ What If   │
    │  Code   │    Scenario        │ Version   │
    └────┬────┘                    └─────┬─────┘
         │                               │
         │                               │
         ▼                               ▼
    ┌─────────┐                    ┌───────────┐
    │ Analyze │                    │ Generate  │
    │ Impact  │ ◄──── Compare ───► │ Ghost     │
    │         │                    │ Files     │
    └─────────┘                    └───────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Decision Time │
              │ Apply/Discard │
              └───────────────┘
```

## Instructions

### Default: Explore Scenario

**Step 1: Parse the "What If"**

```
/siftcoder:ghost "What if we used Redis instead of PostgreSQL for sessions?"
```

```
GHOST EXPLORATION
═══════════════════════════════════════════════════════════════

Scenario: Redis for sessions instead of PostgreSQL

Understanding current reality...

Current Implementation:
  ├── Sessions stored in PostgreSQL (sessions table)
  ├── Files involved: 4
  │   ├── src/auth/session.ts (main logic)
  │   ├── src/db/models/session.ts (model)
  │   ├── src/db/migrations/003_sessions.ts
  │   └── src/api/middleware/auth.ts (reads sessions)
  ├── Features used: JOINs with users table, ACID transactions
  └── Current performance: ~15ms average read

Generating ghost reality...
```

**Step 2: Generate Ghost Implementation**

Create the alternative in a `.ghost/` directory:

```
GHOST REALITY GENERATED

┌─ REALITY A (Current) ────────────────────────────────────────┐
│                                                               │
│  PostgreSQL Sessions                                          │
│  ├── Pros:                                                   │
│  │   ├── ACID guarantees                                     │
│  │   ├── JOINs with user data                               │
│  │   ├── Existing infrastructure                            │
│  │   └── Familiar to team                                   │
│  ├── Cons:                                                   │
│  │   ├── Slower reads (~15ms)                               │
│  │   ├── Connection pool limits                             │
│  │   └── Scales with DB load                                │
│  └── Dependencies: pg, knex                                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ REALITY B (Ghost) ──────────────────────────────────────────┐
│                                                               │
│  Redis Sessions                                               │
│  ├── Pros:                                                   │
│  │   ├── Sub-millisecond reads (~0.5ms)                     │
│  │   ├── Built-in TTL (auto-expiry)                         │
│  │   ├── Pub/sub for real-time invalidation                 │
│  │   └── Horizontal scaling                                 │
│  ├── Cons:                                                   │
│  │   ├── No ACID (eventual consistency)                     │
│  │   ├── No JOINs (need separate user lookup)               │
│  │   ├── New infrastructure to maintain                     │
│  │   └── Team needs to learn Redis                          │
│  ├── Dependencies: ioredis (new)                            │
│  └── Performance: ~30x faster reads                          │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 3: Show File-Level Diff**

```
┌─ FILES IN GHOST REALITY ─────────────────────────────────────┐
│                                                               │
│  NEW FILES:                                                   │
│  ├── .ghost/redis-sessions/src/auth/session.ts              │
│  ├── .ghost/redis-sessions/src/config/redis.ts              │
│  └── .ghost/redis-sessions/src/cache/session-store.ts       │
│                                                               │
│  MODIFIED FILES:                                              │
│  ├── .ghost/redis-sessions/src/api/middleware/auth.ts       │
│  └── .ghost/redis-sessions/package.json (+ioredis)          │
│                                                               │
│  DELETED FILES:                                               │
│  ├── src/db/models/session.ts (not needed)                  │
│  └── src/db/migrations/003_sessions.ts (data in Redis)      │
│                                                               │
│  UNCHANGED: 243 files                                         │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 4: Impact Analysis**

```
┌─ IMPACT ANALYSIS ────────────────────────────────────────────┐
│                                                               │
│  Migration Complexity: MEDIUM                                 │
│  ├── Data migration: Export sessions to Redis                │
│  ├── Code changes: 4 files                                   │
│  ├── Config changes: Add Redis connection                    │
│  └── Rollback plan: Keep PG table for 30 days                │
│                                                               │
│  Performance Impact:                                          │
│  ├── Session reads: -97% latency (15ms → 0.5ms)             │
│  ├── Database load: -40% (no session queries)                │
│  └── Memory usage: +50MB (Redis cache)                       │
│                                                               │
│  Risk Assessment:                                             │
│  ├── Data loss risk: LOW (sessions are ephemeral)            │
│  ├── Downtime required: 5-10 minutes (deploy + warm cache)   │
│  └── Rollback difficulty: LOW (PG still has data)            │
│                                                               │
│  Team Impact:                                                 │
│  ├── Learning curve: 2-4 hours for Redis basics              │
│  ├── Ops overhead: New service to monitor                    │
│  └── On-call impact: New failure mode to handle              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Step 5: Present Options**

```
GHOST EXPLORATION COMPLETE

Ghost ID: ghost-redis-sessions-1705069200

Options:
  [1] Apply Ghost   - Replace current with ghost implementation
  [2] Compare       - Side-by-side diff view
  [3] Save          - Keep for later decision
  [4] Discard       - Delete ghost exploration

What would you like to do?
```

### Example Scenarios

**Architecture Changes:**
```
/siftcoder:ghost "What if we used GraphQL instead of REST?"
/siftcoder:ghost "What if we split into microservices?"
/siftcoder:ghost "What if we used event sourcing?"
```

**Technology Swaps:**
```
/siftcoder:ghost "What if we used TypeORM instead of Prisma?"
/siftcoder:ghost "What if we switched to Deno from Node?"
/siftcoder:ghost "What if we used Tailwind instead of styled-components?"
```

**Pattern Changes:**
```
/siftcoder:ghost "What if we used dependency injection everywhere?"
/siftcoder:ghost "What if we eliminated all classes and used functions?"
/siftcoder:ghost "What if we used the repository pattern?"
```

**Infrastructure:**
```
/siftcoder:ghost "What if we went serverless?"
/siftcoder:ghost "What if we used MongoDB instead of PostgreSQL?"
/siftcoder:ghost "What if we added a message queue?"
```

### Command: `--compare`

Side-by-side comparison:

```
/siftcoder:ghost --compare ghost-redis-sessions
```

```
SIDE-BY-SIDE COMPARISON
═══════════════════════════════════════════════════════════════

src/auth/session.ts
───────────────────────────────────────────────────────────────
CURRENT                          │ GHOST (Redis)
───────────────────────────────────────────────────────────────
import { db } from '../db';      │ import { redis } from '../cache';
                                 │
export async function            │ export async function
  getSession(token: string) {    │   getSession(token: string) {
                                 │
  return db.sessions             │   const data = await redis
    .findOne({ token })          │     .get(`session:${token}`);
    .join('users');              │
                                 │   if (!data) return null;
                                 │
                                 │   const session = JSON.parse(data);
                                 │   const user = await getUser(
                                 │     session.userId
                                 │   );
                                 │
  // ~15ms                       │   // ~0.5ms + user lookup
}                                │ }
───────────────────────────────────────────────────────────────

[Next File] [Apply This Change] [Keep Current] [View Full Files]
```

### Command: `--apply`

Apply ghost reality to your actual codebase:

```
/siftcoder:ghost --apply ghost-redis-sessions
```

```
APPLYING GHOST REALITY
═══════════════════════════════════════════════════════════════

Creating checkpoint before application...
  ✓ Checkpoint: pre-ghost-redis-sessions

Applying changes:
  [1/5] Adding ioredis to package.json...
  [2/5] Creating src/config/redis.ts...
  [3/5] Creating src/cache/session-store.ts...
  [4/5] Updating src/auth/session.ts...
  [5/5] Updating src/api/middleware/auth.ts...

Post-application:
  Running type check... ✓
  Running tests... ✓ (2 tests updated)
  Running lint... ✓

GHOST REALITY APPLIED

Your code now uses Redis for sessions.

Rollback if needed:
  /siftcoder:checkpoint restore pre-ghost-redis-sessions
```

### Multiple Ghost Realities

Compare multiple alternatives:

```
/siftcoder:ghost "Redis for sessions" --save
/siftcoder:ghost "JWT stateless sessions" --save
/siftcoder:ghost "In-memory sessions with clustering" --save

/siftcoder:ghost --list
```

```
SAVED GHOST REALITIES

ID                          Scenario                    Created
───────────────────────────────────────────────────────────────
ghost-redis-sessions        Redis for sessions          2 min ago
ghost-jwt-sessions          JWT stateless sessions      1 min ago
ghost-inmemory-sessions     In-memory + clustering      Just now

Compare all:
  /siftcoder:ghost --compare-all sessions
```

```
MULTI-GHOST COMPARISON
═══════════════════════════════════════════════════════════════

                    Current    Redis      JWT        In-Memory
───────────────────────────────────────────────────────────────
Read latency        15ms       0.5ms      0ms*       0.1ms
Write latency       20ms       1ms        0ms*       0.1ms
Scalability         Limited    High       High       Complex
Infrastructure      Existing   +Redis     None       Clustering
Revocation          Easy       Easy       Hard       Easy
Data on server      Yes        Yes        No         Yes
Complexity          Low        Medium     Medium     High
Migration effort    N/A        Medium     High       High

* JWT reads/writes are on client, but validation still needed

RECOMMENDATION: Redis offers best balance of performance,
simplicity, and functionality for your use case.

[Apply Redis] [Apply JWT] [Apply In-Memory] [Keep Current]
```

## Configuration

```json
{
  "ghost": {
    "directory": ".ghost",
    "keepDays": 30,
    "autoCheckpoint": true,
    "maxGhosts": 10,
    "includeTests": true,
    "runValidation": true
  }
}
```

## Ghost Directory Structure

```
.ghost/
├── redis-sessions/
│   ├── manifest.json           # Metadata about this ghost
│   ├── src/
│   │   ├── auth/session.ts     # Ghost version of file
│   │   └── config/redis.ts     # New file in ghost
│   └── analysis.md             # Impact analysis
├── jwt-sessions/
│   └── ...
└── index.json                  # List of all ghosts
```

## Integration

Works well with:
  • `/siftcoder:checkpoint` - Auto-saves before applying
  • `/siftcoder:preview` - Preview ghost changes
  • `/siftcoder:timewarp` - Compare with historical alternatives
  • `/siftcoder:ripple` - See impact of ghost changes
