---
description: Team knowledge sharing and collaboration
argument-hint: [create|invite|members|knowledge|share|approve|leave]
allowed-tools: Read, Write, Bash, WebFetch, AskUserQuestion
---

# /siftcoder:team - Team Knowledge Collaboration

Share knowledge across your team. Patterns, gotchas, and decisions learned by one member automatically benefit everyone.

## Usage

```
/siftcoder:team create <name>         - Create a new team
/siftcoder:team invite <email>        - Invite member to team
/siftcoder:team members               - List team members
/siftcoder:team leave                 - Leave current team
/siftcoder:team knowledge             - Browse team knowledge base
/siftcoder:team share <id>            - Share local knowledge to team
/siftcoder:team approve <id>          - Approve pending knowledge (admin)
/siftcoder:team reject <id>           - Reject pending knowledge (admin)
/siftcoder:team pending               - View pending contributions (admin)
/siftcoder:team stats                 - View team knowledge statistics
/siftcoder:team search <query>        - Search team knowledge
```

## Arguments
- `$ARGUMENTS` - Subcommand and any arguments

## Prerequisites

- Cloud sync must be configured: `/siftcoder:config cloud configure`
- User must be authenticated

## Instructions

### Subcommand: `create <name>`

Create a new team:

1. Verify user is authenticated (check cloud config)
2. Prompt for team details:
   ```
   Creating new team: <name>

   Team slug (URL-safe identifier): [auto-generated-from-name]
   Description (optional):

   Settings:
     Require approval for shared knowledge? (yes/no): [yes]
     Allow member invites? (yes/no): [yes]
   ```
3. Make API call to create team:
   ```bash
   curl -X POST "$SERVER_URL/api/v1/orgs" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "<name>",
       "slug": "<slug>",
       "settings": {
         "require_approval": true,
         "allow_member_invites": true
       }
     }'
   ```
4. Display result:
   ```
   Team created successfully!

   Name: <name>
   Slug: <slug>
   ID: <team-id>

   Your role: Owner

   Next steps:
     /siftcoder:team invite <email>  - Add team members
     /siftcoder:team share <id>      - Share knowledge
   ```

### Subcommand: `invite <email>`

Invite a member to the team:

1. Get current team from config
2. Make API call:
   ```bash
   curl -X POST "$SERVER_URL/api/v1/orgs/<slug>/members/invite" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email": "<email>", "role": "member"}'
   ```
3. Display result:
   ```
   Invitation sent to <email>

   They will receive an email with instructions to join.
   Pending invitations expire in 7 days.

   View pending: /siftcoder:team members --pending
   ```

### Subcommand: `members`

List team members:

1. Get current team from config
2. Make API call:
   ```bash
   curl "$SERVER_URL/api/v1/orgs/<slug>/members" \
     -H "Authorization: Bearer $API_KEY"
   ```
3. Display formatted list:
   ```
   Team: <team-name>

   Members (5):

   Role    Name              Email                    Joined
   ---------------------------------------------------------------
   Owner   John Smith        john@example.com         Jan 1, 2026
   Admin   Jane Doe          jane@example.com         Jan 5, 2026
   Member  Bob Wilson        bob@example.com          Jan 10, 2026
   Member  Alice Brown       alice@example.com        Jan 12, 2026
   Member  Charlie Davis     charlie@example.com      Jan 15, 2026

   Pending Invitations: 2
     - newuser@example.com (expires Jan 22, 2026)
     - another@example.com (expires Jan 23, 2026)
   ```

### Subcommand: `knowledge`

Browse team knowledge base:

1. Get current team from config
2. Make API call:
   ```bash
   curl "$SERVER_URL/api/v1/team/<slug>/knowledge?status=approved&limit=20" \
     -H "Authorization: Bearer $API_KEY"
   ```
3. Display knowledge entries:
   ```
   Team Knowledge Base

   Total: 45 entries (32 patterns, 8 gotchas, 5 decisions)

   Recent Contributions:

   [Pattern] Error Retry with Exponential Backoff
     By: Jane Doe | Jan 15, 2026 | Views: 23
     Tags: error-handling, resilience

   [Gotcha] SQLite Concurrent Write Lock
     By: Bob Wilson | Jan 14, 2026 | Views: 18
     Tags: sqlite, database, concurrency

   [Decision] Use UUID v7 for IDs
     By: John Smith | Jan 12, 2026 | Views: 31
     Tags: database, architecture

   [Pattern] Rust Feature Flags for Optional Deps
     By: Alice Brown | Jan 10, 2026 | Views: 15
     Tags: rust, cargo, dependencies

   Commands:
     /siftcoder:team knowledge --type pattern  - Filter by type
     /siftcoder:team search <query>            - Search knowledge
     /siftcoder:team share <id>                - Share your knowledge
   ```

### Subcommand: `share <id>`

Share local knowledge to team:

1. Read local knowledge from `.claude/siftcoder-state/knowledge/`
2. If `<id>` provided, find that specific entry
3. If no `<id>`, show list of local knowledge:
   ```
   Local Knowledge (not yet shared):

   ID        Type      Title
   -----------------------------------------------
   pat-001   Pattern   Retry with Backoff
   pat-002   Pattern   Config Loading
   got-001   Gotcha    SQLite Lock Issue
   dec-001   Decision  UUID v7 Choice

   Share which entry? [pat-001/pat-002/got-001/dec-001/all]
   ```
4. On selection, make API call:
   ```bash
   curl -X POST "$SERVER_URL/api/v1/team/<slug>/knowledge" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "entry_type": "pattern",
       "title": "Retry with Backoff",
       "description": "...",
       "code_example": "...",
       "tags": ["error-handling"],
       "contribution_context": "Discovered while building sync feature"
     }'
   ```
5. Display result:
   ```
   Knowledge shared successfully!

   Title: Retry with Backoff
   Type: Pattern
   Status: Pending Approval

   Your contribution will be reviewed by a team admin.
   Track status: /siftcoder:team pending
   ```

   Or if auto-approved (user is admin):
   ```
   Knowledge shared and auto-approved!

   Title: Retry with Backoff
   Type: Pattern
   Status: Approved

   Now visible to all team members.
   ```

### Subcommand: `approve <id>`

Approve pending knowledge (admin only):

1. Get pending entry details:
   ```bash
   curl "$SERVER_URL/api/v1/team/<slug>/knowledge/<id>" \
     -H "Authorization: Bearer $API_KEY"
   ```
2. Display for review:
   ```
   Pending Knowledge Review

   Type: Pattern
   Title: Retry with Exponential Backoff
   Contributed by: Jane Doe (jane@example.com)
   Submitted: Jan 15, 2026

   Description:
   Implement exponential backoff for network retries to avoid
   overwhelming servers during outages.

   Code Example:
   ```rust
   async fn retry_with_backoff<F, T, E>(f: F, max_retries: u32) -> Result<T, E>
   where
       F: Fn() -> Future<Output = Result<T, E>>,
   {
       let mut delay = Duration::from_millis(100);
       for attempt in 0..max_retries {
           match f().await {
               Ok(result) => return Ok(result),
               Err(e) if attempt < max_retries - 1 => {
                   sleep(delay).await;
                   delay *= 2;
               }
               Err(e) => return Err(e),
           }
       }
   }
   ```

   Tags: error-handling, resilience, async

   Actions:
     [A]pprove  [R]eject  [S]kip
   ```
3. On approve:
   ```bash
   curl -X POST "$SERVER_URL/api/v1/team/<slug>/knowledge/<id>/review" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"status": "approved", "review_notes": "Great pattern!"}'
   ```
4. Display confirmation:
   ```
   Knowledge approved!

   Now visible to all team members.
   Contributor has been notified.
   ```

### Subcommand: `reject <id>`

Reject pending knowledge (admin only):

1. Use AskUserQuestion to get rejection reason
2. Make API call:
   ```bash
   curl -X POST "$SERVER_URL/api/v1/team/<slug>/knowledge/<id>/review" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"status": "rejected", "review_notes": "<reason>"}'
   ```
3. Display confirmation:
   ```
   Knowledge rejected.

   Reason: <reason>
   Contributor has been notified.
   ```

### Subcommand: `pending`

View pending contributions (admin only):

1. Make API call:
   ```bash
   curl "$SERVER_URL/api/v1/team/<slug>/knowledge/pending" \
     -H "Authorization: Bearer $API_KEY"
   ```
2. Display list:
   ```
   Pending Contributions (3)

   ID          Type      Title                          By           Date
   ---------------------------------------------------------------------------
   pend-001    Pattern   Retry with Backoff             Jane Doe     Jan 15
   pend-002    Gotcha    SQLite Lock Issue              Bob Wilson   Jan 14
   pend-003    Decision  UUID v7 for IDs                Alice Brown  Jan 13

   Review with:
     /siftcoder:team approve <id>
     /siftcoder:team reject <id>
   ```

### Subcommand: `stats`

View team knowledge statistics:

1. Make API call:
   ```bash
   curl "$SERVER_URL/api/v1/team/<slug>/knowledge/stats" \
     -H "Authorization: Bearer $API_KEY"
   ```
2. Display stats:
   ```
   Team Knowledge Statistics

   Total Entries: 45
     - Patterns: 32
     - Gotchas: 8
     - Decisions: 5

   This Month:
     - New contributions: 12
     - Approvals: 10
     - Rejections: 2

   Top Contributors:
     1. Jane Doe        - 15 contributions
     2. Bob Wilson      - 12 contributions
     3. Alice Brown     - 8 contributions

   Most Viewed:
     1. Error Retry Pattern (45 views)
     2. SQLite Lock Gotcha (38 views)
     3. UUID v7 Decision (31 views)

   Most Searched:
     1. "error handling" (23 searches)
     2. "database" (18 searches)
     3. "async" (15 searches)
   ```

### Subcommand: `search <query>`

Search team knowledge:

1. Make API call:
   ```bash
   curl "$SERVER_URL/api/v1/team/<slug>/knowledge/search?q=<query>" \
     -H "Authorization: Bearer $API_KEY"
   ```
2. Display results:
   ```
   Search Results for "error handling"

   Found 5 entries:

   [Pattern] Error Retry with Exponential Backoff
     Score: 0.95 | By: Jane Doe | Views: 23
     "...implement exponential backoff for network retries..."

   [Gotcha] Silent Error Swallowing in Async
     Score: 0.87 | By: Bob Wilson | Views: 15
     "...async functions may silently swallow errors..."

   [Pattern] Structured Error Types
     Score: 0.82 | By: Alice Brown | Views: 19
     "...use thiserror for deriving error types..."

   View full entry: /siftcoder:team knowledge <id>
   ```

### Subcommand: `leave`

Leave current team:

1. Use AskUserQuestion to confirm
2. Make API call:
   ```bash
   curl -X DELETE "$SERVER_URL/api/v1/orgs/<slug>/members/<user_id>" \
     -H "Authorization: Bearer $API_KEY"
   ```
3. Display confirmation:
   ```
   You have left the team: <team-name>

   Your contributions remain in the team knowledge base.
   Your local knowledge is unaffected.

   To join another team:
     /siftcoder:team join <invite-link>
   ```

## Configuration

Team settings stored in `~/.config/siftcoder/team.toml`:

```toml
[team]
current = "my-team-slug"
org_id = "uuid-here"

[team.settings]
auto_share = false
share_patterns = true
share_gotchas = true
share_decisions = true
```

## Tips

```
EFFECTIVE TEAM KNOWLEDGE SHARING

Building the knowledge base:
  - Share patterns as you discover them
  - Document gotchas when you hit them
  - Record decisions with context

Quality contributions:
  - Include code examples
  - Add relevant tags
  - Explain the "why" not just "what"

As an admin:
  - Review pending regularly
  - Provide feedback on rejections
  - Thank contributors

Searching effectively:
  - Use specific terms
  - Try tag searches: /siftcoder:team search --tag rust
  - Check "most viewed" for common issues

Building team culture:
  - Encourage all members to share
  - Celebrate good contributions
  - Keep knowledge up-to-date
```
