# /siftcoder:integrate - External Service Integrations

Connect with GitHub, issue trackers, and other development tools.

## Usage

```
/siftcoder:integrate [subcommand] [service]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `github` | GitHub/GitLab integration (default) |
| `issues` | Issue tracker sync (Linear, Jira) |
| `slack` | Slack notifications |
| `ci` | CI/CD pipeline integration |

## Arguments
- `$ARGUMENTS` - Subcommand and service name

## Instructions

You are an integration expert. Help connect development workflows with external services for seamless automation.

---

## Phase 0: Interactive Setup

**Use AskUserQuestion tool:**
```
Question: "What would you like to integrate?"
Header: "Service"
Options:
- "GitHub Integration" - "PR automation, issue linking, workflows"
- "Issue Tracker" - "Sync with Linear, Jira, or GitHub Issues"
- "Notifications" - "Slack, Discord, or email alerts"
- "CI/CD Setup" - "GitHub Actions, CircleCI, Jenkins"
```

---

## Subcommand: github

### GitHub Integration

```
GITHUB INTEGRATION SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Repository: org/my-app
Connection: ✓ Authenticated

AVAILABLE INTEGRATIONS

1. PR Automation
   ├── Auto-label PRs based on files changed
   ├── Auto-assign reviewers
   ├── Auto-link to issues
   └── PR template enforcement

2. Issue Management
   ├── Auto-create issues from TODOs
   ├── Link commits to issues
   ├── Auto-close issues on merge
   └── Issue templates

3. Code Quality
   ├── Required status checks
   ├── Branch protection rules
   ├── Auto-merge when approved
   └── CODEOWNERS enforcement

4. Security
   ├── Dependabot alerts
   ├── Secret scanning
   ├── Code scanning (CodeQL)
   └── Security advisories

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CURRENT CONFIGURATION

Branch Protection (main):
├── Require PR before merge: ✓
├── Required approvals: 1
├── Require status checks: ✓
│   ├── tests ✓
│   └── lint ✓
├── Require signed commits: ✗
└── Allow force push: ✗

CODEOWNERS: Not configured
PR Template: Exists ✓
Issue Templates: 2 configured

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDED SETUP

1. ADD CODEOWNERS

File: .github/CODEOWNERS

```
# Default owners for everything
* @org/core-team

# Frontend owners
/src/client/ @org/frontend-team
*.tsx @org/frontend-team
*.css @org/frontend-team

# Backend owners
/src/server/ @org/backend-team
*.ts @org/backend-team

# DevOps owners
/infrastructure/ @org/devops-team
*.yml @org/devops-team
Dockerfile @org/devops-team

# Security review required
/src/auth/ @org/security-team
/src/server/middleware/ @org/security-team
```

2. ADD LABELER WORKFLOW

File: .github/workflows/labeler.yml

```yaml
name: PR Labeler

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/labeler@v4
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          configuration-path: .github/labeler.yml
```

File: .github/labeler.yml

```yaml
frontend:
  - 'src/client/**/*'
  - '*.tsx'
  - '*.css'

backend:
  - 'src/server/**/*'
  - 'prisma/**/*'

docs:
  - '*.md'
  - 'docs/**/*'

tests:
  - 'tests/**/*'
  - '*.test.ts'
  - '*.spec.ts'

dependencies:
  - 'package.json'
  - 'package-lock.json'

security:
  - 'src/auth/**/*'
  - 'src/server/middleware/auth*'
```

3. AUTO-LINK ISSUES

File: .github/workflows/issue-linker.yml

```yaml
name: Link Issues

on:
  pull_request:
    types: [opened, edited]

jobs:
  link:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v6
        with:
          script: |
            const body = context.payload.pull_request.body || '';
            const issuePattern = /(close[sd]?|fix(es|ed)?|resolve[sd]?)\s*#(\d+)/gi;
            const matches = body.matchAll(issuePattern);

            for (const match of matches) {
              const issueNumber = match[3];
              await github.rest.issues.addLabels({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.payload.pull_request.number,
                labels: [`linked-to-#${issueNumber}`]
              });
            }
```

Apply these configurations?
→ Type 'yes' to create all files
→ Type 'select' to choose which to apply
```

---

## Subcommand: issues

### Issue Tracker Integration

```
/siftcoder:integrate issues linear
```

```
LINEAR INTEGRATION SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYNC CAPABILITIES

1. Bi-directional Sync
   ├── Create Linear issues from GitHub
   ├── Link PRs to Linear issues
   ├── Sync status (In Progress, Done)
   └── Sync comments

2. Automation
   ├── Auto-move to "In Progress" when PR opened
   ├── Auto-move to "Done" when PR merged
   ├── Auto-assign based on PR author
   └── Copy labels/tags

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SETUP INSTRUCTIONS

1. Install Linear GitHub Integration
   → Go to Linear Settings → Integrations → GitHub
   → Connect your GitHub organization
   → Select repositories to sync

2. Link Issues to PRs

   Use Linear issue ID in PR:
   ```
   feat: Add user authentication

   Implements user login with OAuth.

   Linear: ENG-123
   ```

   Or use branch naming:
   ```bash
   git checkout -b eng-123-add-auth
   # Linear auto-links based on branch prefix
   ```

3. Auto-sync Status

   Add webhook for PR events:

   File: .github/workflows/linear-sync.yml

   ```yaml
   name: Linear Sync

   on:
     pull_request:
       types: [opened, closed, merged]

   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - name: Update Linear
           uses: linearapp/linear-github-action@v1
           with:
             linear-api-key: ${{ secrets.LINEAR_API_KEY }}
   ```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORKFLOW WITH LINEAR

Development Flow:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Linear    │────▶│   GitHub    │────▶│   Linear    │
│   Backlog   │     │     PR      │     │    Done     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │ Pick issue        │ Open PR           │ Auto-close
      │ Move to Progress  │ Link issue        │ on merge
      ▼                   ▼                   ▼
   "In Progress"      Review/CI         "Done"
```

With siftcoder:
```
1. Get Linear issue
   → /siftcoder:integrate issues get ENG-123

2. Implement feature
   → /siftcoder:add-feature "Description from Linear issue"

3. Create PR with auto-link
   → /siftcoder:pr create --link ENG-123

4. Auto-update Linear on merge
   → Workflow handles this automatically
```
```

---

## Subcommand: slack

### Slack Notifications

```
/siftcoder:integrate slack
```

```
SLACK INTEGRATION SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTIFICATION TYPES

1. Deployment Notifications
   ├── Deploy started
   ├── Deploy succeeded/failed
   └── Rollback notifications

2. CI/CD Status
   ├── Build failures
   ├── Test failures
   └── Security alerts

3. Code Review
   ├── PR ready for review
   ├── PR approved/changes requested
   └── PR merged

4. On-call Alerts
   ├── Production errors spike
   ├── Service health issues
   └── SLA violations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SETUP

1. Create Slack Webhook

   a. Go to: https://api.slack.com/apps
   b. Create New App → From Scratch
   c. Add "Incoming Webhooks" feature
   d. Create webhook for channel
   e. Copy webhook URL

2. Add to GitHub Secrets

   $ gh secret set SLACK_WEBHOOK_URL

3. Add Notification Workflow

File: .github/workflows/slack-notify.yml

```yaml
name: Slack Notifications

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, closed, merged]
  workflow_run:
    workflows: ["CI"]
    types: [completed]

jobs:
  notify-deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - name: Notify Deploy Started
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "🚀 *Deployment Started*\n${{ github.event.head_commit.message }}"
                  }
                },
                {
                  "type": "context",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": "by ${{ github.actor }} | <${{ github.event.head_commit.url }}|View Commit>"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  notify-pr:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Notify PR
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "📝 *PR ${{ github.event.action }}*: ${{ github.event.pull_request.title }}"
                  }
                },
                {
                  "type": "context",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": "by ${{ github.actor }} | <${{ github.event.pull_request.html_url }}|View PR>"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

  notify-failure:
    if: github.event_name == 'workflow_run' && github.event.workflow_run.conclusion == 'failure'
    runs-on: ubuntu-latest
    steps:
      - name: Notify Failure
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "❌ *CI Failed*: ${{ github.event.workflow_run.name }}"
                  }
                },
                {
                  "type": "context",
                  "elements": [
                    {
                      "type": "mrkdwn",
                      "text": "<${{ github.event.workflow_run.html_url }}|View Run>"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

NOTIFICATION EXAMPLES:

```
#deployments channel:
┌────────────────────────────────────────┐
│ 🚀 Deployment Started                  │
│ Add user authentication                │
│                                        │
│ by alice | View Commit                 │
└────────────────────────────────────────┘

#engineering channel:
┌────────────────────────────────────────┐
│ 📝 PR opened: Add user authentication  │
│                                        │
│ by alice | View PR                     │
└────────────────────────────────────────┘

#alerts channel:
┌────────────────────────────────────────┐
│ ❌ CI Failed: Tests                    │
│                                        │
│ View Run                               │
└────────────────────────────────────────┘
```
```

---

## Subcommand: ci

### CI/CD Pipeline Setup

```
/siftcoder:integrate ci github-actions
```

```
CI/CD SETUP: GitHub Actions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDED PIPELINE

Stages:
1. Install & Cache
2. Lint & Type Check
3. Unit Tests
4. Integration Tests
5. Build
6. Deploy (on main)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORKFLOW FILES

File: .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  PNPM_VERSION: '8'

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Cache node_modules
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}

  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Restore cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

  test:
    needs: install
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Restore cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}

      - name: Setup database
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test

      - name: Run tests
        run: pnpm test --coverage
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Restore cache
        uses: actions/cache@v3
        with:
          path: node_modules
          key: ${{ runner.os }}-pnpm-${{ hashFiles('pnpm-lock.yaml') }}

      - name: Build
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: build
          path: dist/

      - name: Deploy to production
        run: |
          # Your deployment command here
          echo "Deploying to production..."
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

File: .github/workflows/security.yml

```yaml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly

jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: javascript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v2

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  secrets-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PIPELINE VISUALIZATION

```
┌─────────┐   ┌──────┐   ┌──────┐   ┌───────┐   ┌────────┐
│ Install │──▶│ Lint │──▶│ Test │──▶│ Build │──▶│ Deploy │
└─────────┘   └──────┘   └──────┘   └───────┘   └────────┘
                │            │
                ▼            ▼
           Type Check   Coverage
```

Apply these configurations?
→ Type 'yes' to create all workflow files
→ Type 'select' to choose which to apply
```

---

## Tips & Hints

```
INTEGRATION BEST PRACTICES

GitHub:
  → Use branch protection rules
  → Require status checks before merge
  → Use CODEOWNERS for review routing
  → Enable Dependabot

Issue Tracking:
  → Use consistent naming (branch, PR)
  → Auto-link issues to PRs
  → Auto-close on merge
  → Sync status bidirectionally

Notifications:
  → Don't notify on everything
  → Use separate channels by type
  → Include actionable links
  → Allow muting/customization

CI/CD:
  → Cache dependencies
  → Run jobs in parallel when possible
  → Fail fast on critical checks
  → Use matrix builds for multi-version

SECURITY CONSIDERATIONS

Secrets:
  → Never log secrets
  → Use environment-specific secrets
  → Rotate periodically
  → Audit access

Webhooks:
  → Verify webhook signatures
  → Use HTTPS only
  → Implement rate limiting
  → Log all webhook events
```

---

## Skills Used
- **github-integrator** - GitHub/GitLab automation
- **ci-generator** - Pipeline configuration
- **webhook-manager** - Notification setup

## Allowed Tools
Read, Write, Grep, Glob, Bash, Task, AskUserQuestion
