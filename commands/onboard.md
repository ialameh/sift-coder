# /siftcoder:onboard - Team Onboarding Acceleration

**Interactive codebase tours and role-specific onboarding for new developers.**

## Usage

```bash
/siftcoder:onboard generate              # Generate onboarding plan
/siftcoder:onboard tour                   # Interactive codebase tour
/siftcoder:onboard exercise <topic>       # Generate coding challenges
```

## Examples

```bash
# Generate personalized onboarding
/siftcoder:onboard generate

# Take interactive tour
/siftcoder:onboard tour

# Practice with challenges
/siftcoder:onboard exercise "authentication"
/siftcoder:onboard exercise "database models"
```

## Instructions

You are an **Onboarding Accelerator** that helps new developers become productive quickly through interactive tours, role-specific learning paths, and hands-on challenges.

---

## Phase 1: Generate Onboarding Plan

### Step 1: Analyze Team Structure

Identify different roles on the team:
- Frontend developers (React, Vue, Angular)
- Backend developers (Node.js, Python, Go)
- Full-stack developers
- DevOps/SRE
- QA engineers
- Data engineers

### Step 2: Create Role-Specific Paths

**Frontend Developer Path:**
1. UI components architecture
2. State management patterns
3. API integration patterns
4. Styling system (CSS, Tailwind, etc.)
5. Testing frontend code

**Backend Developer Path:**
1. API endpoints structure
2. Database models and relationships
3. Authentication/authorization
4. Business logic organization
5. Error handling patterns

**Full-Stack Path:**
1. Frontend + Backend combined
2. Full request/response flow
3. End-to-end testing
4. Deployment process

### Step 3: Identify Critical Files

For each role, identify:
- Must-understand files (core architecture)
- Important files (frequently used)
- Nice-to-know files (occasional use)

**Example Output:**
```markdown
# Onboarding Plan: Frontend Developer

## Week 1: Foundation (10-15 hours)
- Day 1-2: Project setup and architecture
  - README.md - Project overview
  - package.json - Dependencies and scripts
  - src/components/ - Component structure

- Day 3-4: Core components
  - src/components/App.tsx - Main application
  - src/components/Layout/ - Layout system
  - src/hooks/ - Custom React hooks

- Day 5: Styling and theming
  - src/styles/ - Global styles
  - tailwind.config.js - Tailwind configuration

## Week 2: Feature Deep Dives (15-20 hours)
- Authentication flow
- Data fetching patterns
- State management (Redux/Zustand)
- Form handling
- Error boundaries

## Week 3: Practice (10-15 hours)
- Fix a real bug
- Add a small feature
- Code review walkthrough
- Deployment practice
```

---

## Phase 2: Interactive Tour

### Step 1: Codebase Navigation

```bash
echo "🎓 Welcome to the codebase tour!"
echo ""
echo "This tour will show you:"
echo "  ✓ Project structure"
echo "  ✓ Key components"
echo "  ✓ Data flows"
echo "  ✓ Important patterns"
echo ""

ask_user "Ready to begin? (yes/no)"
```

### Step 2: Show Architecture

```markdown
## Project Architecture

```
my-app/
├── src/
│   ├── components/      # React components
│   │   ├── common/      # Reusable components
│   │   └── features/    # Feature-specific components
│   ├── hooks/           # Custom hooks
│   ├── services/        # API clients
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript types
│   └── App.tsx          # Main app
├── tests/               # Test files
├── docs/                # Documentation
└── package.json
```

**Key Points:**
- Component-based architecture
- Feature folders for related code
- Clear separation of concerns
```

### Step 3: Explore Key Files

```bash
# Show main App component
echo "📄 Main Application: src/App.tsx"
echo ""
head -30 src/App.tsx
echo ""
echo "This is the entry point. It sets up:"
echo "  - Routing"
echo "  - Global state"
echo "  - Theme provider"
echo "  - Error boundaries"
echo ""

ask_user "Continue to next file? (yes/no)"
```

---

## Phase 3: Coding Challenges

### Step 1: Generate Challenge

```bash
topic="$1"

echo "🎯 Coding Challenge: $topic"
echo ""

# Find related code
/siftcoder:search "$topic implementation"

# Generate challenge
cat <<EOF
Your task: Fix a bug in the $topic feature

Background:
- Users report that $topic is failing when X happens
- The error occurs in src/features/$topic/

Steps:
1. Read the failing code
2. Identify the bug
3. Write a fix
4. Add a test
5. Verify it works

Starting file: src/features/$topic/index.ts
EOF
```

### Step 2: Provide Hints

```bash
echo "💡 Hints (use sparingly!):"
echo ""
echo "Hint 1: Look at line 42-45"
echo "Hint 2: Check the error handling"
echo "Hint 3: Compare with similar features"
echo ""

ask_user "Show hints? (yes/no)"
```

### Step 3: Validate Solution

```bash
# Run tests
npm test -- --testPathPattern="$topic"

# If tests pass
echo "🎉 Challenge complete!"
echo ""
echo "You've successfully:"
echo "  ✓ Identified the bug"
echo "  ✓ Implemented a fix"
echo "  ✓ Added test coverage"
echo ""
echo "Ready for the next challenge!"
```

---

## Integration

### With `/siftcoder:knowledge`

```bash
# Capture learnings during onboarding
/siftcoder:knowledge capture "Learned about authentication flow"
```

### With `/siftcoder:search`

```bash
# Find relevant code during challenges
/siftcoder:search "$topic implementation"
```

### With `/siftcoder:explain`

```bash
# Get detailed explanations
/siftcoder:explain src/features/auth/
```

---

## Output Files

**Onboarding Plan:** `.claude/siftcoder-state/onboarding/plan.md`
**Tour Progress:** `.claude/siftcoder-state/onboarding/progress.json`
**Challenges:** `.claude/siftcoder-state/onboarding/challenges/`

---

## Tips & Hints

```
GETTING STARTED

New team member?
  → /siftcoder:onboard generate
  → Creates personalized plan

Want to explore?
  → /siftcoder:onboard tour
  → Interactive codebase walkthrough

Ready to practice?
  → /siftcoder:onboard exercise <topic>
  → Hands-on learning

ROLE-SPECIFIC PATHS

Frontend developers:
  → Components, state, styling, testing

Backend developers:
  → APIs, database, auth, business logic

Full-stack:
  → End-to-end flows, integration, deployment

LEARNING STRATEGY

Week 1: Explore and understand
  → Read code
  → Run the app
  → Make small changes

Week 2: Practice
  → Fix bugs
  → Add features
  → Write tests

Week 3: Contribute
  → Code reviews
  → Deploy features
  → Document learnings
```

---

## Allowed Tools

Read, Write, Glob, Grep, Bash, AskUserQuestion

## Integration Points

- `/siftcoder:knowledge` - Capture learnings
- `/siftcoder:search` - Find relevant code
- `/siftcoder:explain` - Deep dive into code
- `/siftcoder:challenge` - Practice exercises
