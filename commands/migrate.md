# /siftcoder:migrate - Migration & Upgrade Assistant

Safely upgrade dependencies, migrate frameworks, and manage database changes.

## Usage

```
/siftcoder:migrate [subcommand] [target]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `upgrade` | Upgrade dependencies safely (default) |
| `framework` | Migrate to new framework/version |
| `database` | Generate database migrations |
| `breaking` | Detect breaking changes in upgrades |
| `codemod` | Apply automated code transformations |

## Arguments
- `$ARGUMENTS` - Subcommand and package name or target

## Instructions

You are a migration expert. Help developers safely upgrade dependencies, migrate frameworks, and manage database schema changes with minimal risk.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What kind of migration do you need?"
Header: "Type"
Options:
- "Upgrade Dependencies (Recommended)" - "Update npm/pip/etc packages safely"
- "Framework Migration" - "Migrate React/Vue/Express versions"
- "Database Migration" - "Generate schema change migrations"
- "Check Breaking Changes" - "See what would break before upgrading"
```

---

## Subcommand: upgrade

### Phase 1: Dependency Analysis

```
ANALYZING DEPENDENCIES...

Package Manager: npm
Lock file: package-lock.json
Direct dependencies: 45
Total (with transitive): 892
```

```
DEPENDENCY UPGRADE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OUTDATED PACKAGES: 23

SECURITY UPDATES (upgrade immediately):

🔴 CRITICAL:
├── lodash: 4.17.20 → 4.17.21
│   CVE: CVE-2021-23337 (Prototype Pollution)
│   Breaking: No
│   Command: npm update lodash
│
└── axios: 0.21.0 → 0.21.4
    CVE: CVE-2021-3749 (ReDoS)
    Breaking: No
    Command: npm update axios

🟡 HIGH:
└── node-fetch: 2.6.0 → 2.6.7
    CVE: CVE-2022-0235
    Breaking: No

MAJOR UPDATES (review breaking changes):

📦 react: 17.0.2 → 18.2.0
   Breaking changes:
   ├── Concurrent rendering (opt-in)
   ├── Automatic batching
   ├── Stricter Strict Mode
   └── New root API (createRoot)

   Migration effort: MEDIUM
   Changelog: https://react.dev/blog/2022/03/29/react-v18

   Files affected:
   ├── src/index.tsx (root render)
   ├── 12 components using useEffect timing
   └── 3 components with class lifecycles

📦 typescript: 4.7.4 → 5.3.2
   Breaking changes:
   ├── Stricter type checking
   ├── Deprecated options removed
   └── Module resolution changes

   Migration effort: LOW-MEDIUM
   Files with potential issues: 8

📦 express: 4.18.2 → 5.0.0
   Breaking changes:
   ├── Removed deprecated methods
   ├── Changed path matching
   ├── New async error handling
   └── req.host behavior change

   Migration effort: HIGH
   Files affected: 23

MINOR/PATCH UPDATES (safe to update):

✓ @types/node: 18.11.9 → 18.19.3
✓ eslint: 8.26.0 → 8.56.0
✓ prettier: 2.7.1 → 2.8.8
✓ jest: 29.2.2 → 29.7.0
... and 12 more

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPGRADE PLAN

Phase 1: Security patches (do now)
$ npm update lodash axios node-fetch

Phase 2: Safe minor updates
$ npm update @types/node eslint prettier jest

Phase 3: Major updates (one at a time)
1. TypeScript 5.x (prepare codebase first)
2. React 18 (after TS migration)
3. Express 5 (last, most breaking)

Create upgrade branch?
→ Type 'yes' to create branch and start Phase 1
→ Type 'plan' to see detailed migration plan
→ Type 'no' to cancel
```

### Phase 2: Automated Upgrade

```
EXECUTING UPGRADE PLAN...

Creating branch: upgrade/dependencies-2026-01

Phase 1: Security patches
├── Updating lodash... ✓
├── Updating axios... ✓
├── Updating node-fetch... ✓
├── Running tests... ✓ (234/234 passing)
└── Committing: "security: update vulnerable packages"

Phase 2: Minor updates
├── Updating 15 packages... ✓
├── Running type check... ✓
├── Running tests... ✓ (234/234 passing)
├── Running lint... ✓
└── Committing: "deps: update minor versions"

UPGRADE COMPLETE

Branch: upgrade/dependencies-2026-01
Commits: 2
Packages updated: 18

Security issues fixed: 3 (critical: 1, high: 2)
Breaking changes: 0 (safe updates only)

Next steps:
→ git push -u origin upgrade/dependencies-2026-01
→ Create PR for review
→ For React 18: /siftcoder:migrate framework react@18
```

---

## Subcommand: framework

### Framework Migration

```
/siftcoder:migrate framework react@18
```

```
FRAMEWORK MIGRATION: React 17 → 18
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS COMPLETE

Current: React 17.0.2
Target: React 18.2.0

BREAKING CHANGES TO ADDRESS:

1. ROOT API CHANGE
   File: src/index.tsx

   Before (React 17):
   ```tsx
   import ReactDOM from 'react-dom';
   ReactDOM.render(<App />, document.getElementById('root'));
   ```

   After (React 18):
   ```tsx
   import { createRoot } from 'react-dom/client';
   const root = createRoot(document.getElementById('root')!);
   root.render(<App />);
   ```

2. STRICT MODE CHANGES (12 files affected)

   React 18 Strict Mode intentionally double-invokes:
   ├── useState initializers
   ├── useReducer initializers
   ├── Component constructors
   └── Effects (mount → unmount → mount)

   Files with potential issues:
   ├── src/hooks/useWebSocket.ts - Side effect in initializer
   ├── src/components/Analytics.tsx - Double tracking possible
   └── ... 10 more files

3. AUTOMATIC BATCHING

   React 18 batches all state updates automatically.
   This is usually good but may change timing.

   Review these files:
   ├── src/hooks/useAsync.ts - Relies on update order
   └── src/components/Form.tsx - Multiple setState calls

4. TYPESCRIPT CHANGES

   Update types:
   ```bash
   npm install @types/react@18 @types/react-dom@18
   ```

   Type changes:
   ├── React.FC no longer includes `children`
   ├── useCallback return type more strict
   └── VFC removed (use FC)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MIGRATION STEPS

Step 1: Update packages
```bash
npm install react@18 react-dom@18
npm install -D @types/react@18 @types/react-dom@18
```

Step 2: Update root render (codemod available)
→ /siftcoder:migrate codemod react-18-root

Step 3: Fix TypeScript issues
→ Add `children: React.ReactNode` to component props

Step 4: Review Strict Mode behavior
→ Test all effects and initializers

Step 5: Run full test suite
```bash
npm test
```

Step 6: Manual testing
└── Test all user flows

AUTOMATED MIGRATION:

I can automatically:
├── Update root render (src/index.tsx)
├── Add `children` prop type where needed
├── Update deprecated patterns
└── Run tests after each change

Start automated migration?
→ Type 'auto' for fully automated
→ Type 'guided' for step-by-step with approval
→ Type 'manual' for instructions only
```

---

## Subcommand: database

### Database Migration Generation

```
/siftcoder:migrate database
```

```
DATABASE MIGRATION ASSISTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORM detected: Prisma
Database: PostgreSQL

SCHEMA CHANGES DETECTED

Comparing current schema with models...

CHANGES TO MIGRATE:

1. NEW MODEL: Subscription
   ```prisma
   model Subscription {
     id        String   @id @default(uuid())
     userId    String
     plan      Plan
     status    Status
     startDate DateTime
     endDate   DateTime?
     user      User     @relation(fields: [userId], references: [id])
   }
   ```

2. NEW FIELD: User.subscriptionId
   Type: String?
   Relation: One-to-many with Subscription

3. NEW ENUM: Plan
   Values: FREE, BASIC, PRO, ENTERPRISE

4. NEW ENUM: Status
   Values: ACTIVE, CANCELLED, EXPIRED

5. MODIFIED FIELD: Product.price
   Before: Int (cents)
   After: Decimal (for precision)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MIGRATION GENERATED

File: prisma/migrations/20260110_add_subscriptions/migration.sql

```sql
-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "status" "Status" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Subscription"
ADD CONSTRAINT "Subscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterColumn (with data migration)
ALTER TABLE "Product"
ALTER COLUMN "price" TYPE DECIMAL(10,2)
USING price::decimal / 100;

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
```

ROLLBACK MIGRATION:

```sql
-- Down migration
DROP TABLE "Subscription";
DROP TYPE "Status";
DROP TYPE "Plan";
ALTER TABLE "Product"
ALTER COLUMN "price" TYPE INTEGER
USING (price * 100)::integer;
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATA MIGRATION NEEDED

⚠ Product.price change requires data transformation

Current data: Stored as cents (integer)
New format: Decimal with 2 places

Migration script:
```sql
-- Transform existing data
UPDATE "Product"
SET price = price::decimal / 100;
```

SAFETY CHECKS:
├── Backup database before migration
├── Test on staging first
├── Migration is reversible
└── Estimated time: < 1 minute for 100K rows

APPLY MIGRATION:

Development:
$ npx prisma migrate dev --name add_subscriptions

Production:
$ npx prisma migrate deploy

→ Type 'apply' to run migration
→ Type 'test' to preview on test database
→ Type 'save' to save migration files only
```

---

## Subcommand: codemod

### Automated Code Transformations

```
/siftcoder:migrate codemod react-18-root
```

```
CODEMOD: React 18 Root API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transformation: ReactDOM.render → createRoot

FILES TO TRANSFORM: 1

src/index.tsx:

BEFORE:
```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
```

AFTER:
```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

CHANGES:
├── Import: react-dom → react-dom/client
├── API: ReactDOM.render → createRoot + root.render
└── Added: container variable with non-null assertion

Apply transformation?
→ Type 'yes' to apply
→ Type 'diff' to see full diff
→ Type 'no' to cancel
```

---

## Tips & Hints

```
UPGRADE BEST PRACTICES

Before upgrading:
  → Read changelog and migration guide
  → Check for breaking changes
  → Ensure tests exist
  → Create a branch

Safe upgrade order:
  1. Security patches (always first)
  2. Patch versions (x.x.PATCH)
  3. Minor versions (x.MINOR.x)
  4. Major versions (MAJOR.x.x)

Major version upgrades:
  → One major version at a time
  → Don't skip versions
  → Test thoroughly
  → Have rollback plan

DATABASE MIGRATIONS

Golden rules:
  → Always have rollback migration
  → Test on staging first
  → Backup before production
  → Use transactions

Safe changes:
  → Adding tables
  → Adding nullable columns
  → Adding indexes (with CONCURRENTLY)
  → Adding new enum values

Dangerous changes:
  → Dropping tables/columns
  → Changing column types
  → Renaming (breaks app until deployed)
  → Removing enum values

Zero-downtime pattern:
  1. Add new column (nullable)
  2. Deploy app that writes to both
  3. Backfill old data
  4. Deploy app that reads from new
  5. Make column required
  6. Remove old column

ROLLBACK STRATEGIES

Package rollback:
  → npm install package@previous-version
  → Keep package-lock.json in git

Database rollback:
  → npx prisma migrate rollback
  → Have down migrations ready

Full rollback:
  → git revert commit-hash
  → Restore database from backup
```

---

## Skills Used
- **dependency-analyzer** - Package analysis
- **migration-generator** - Database migrations
- **codemod-engine** - Code transformations

## Allowed Tools
Read, Write, Edit, Grep, Glob, Bash, Task, AskUserQuestion
