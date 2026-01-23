---
description: Main siftcoder orchestration - autonomous coding workflows for BUILD, MAINTAIN, and DOCUMENT
argument-hint: [status|pause|resume|configure]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
---

# siftcoder - Autonomous Coding Workflows

Welcome to siftcoder, your autonomous coding assistant.

## Quick Actions

Based on your argument: **$ARGUMENTS**

### If no argument or "status":
Show current siftcoder status and available workflows.

### If "pause":
Pause the current auto-continuation workflow.

### If "resume":
Resume the paused workflow.

### If "configure":
Open interactive configuration.

## Available Workflows

### BUILD - New Development
- `/siftcoder:build <spec-file>` - Create new project from specification
- `/siftcoder:add-feature <description>` - Add feature to existing app
- `/siftcoder:improve-spec <spec-file>` - Enhance spec with testable criteria

### MAINTAIN - Existing Code
- `/siftcoder:investigate <issue>` - Safe read-only investigation
- `/siftcoder:fix <issue>` - Bounded fix with scope limits
- `/siftcoder:optimize <area>` - Refactoring/performance

### DOCUMENT - Documentation
- `/siftcoder:document code [path]` - Docstrings, comments, README
- `/siftcoder:document user-manual` - End user documentation
- `/siftcoder:document architecture` - Code maps, Mermaid diagrams
- `/siftcoder:document technical` - API docs, ops runbook

### AUTONOMOUS FEATURES
- `/siftcoder:heal` - Self-healing build/test loop
- `/siftcoder:swarm` - Parallel agent execution
- `/siftcoder:smart-retry` - Learn from failures, try different approaches
- `/siftcoder:tdd <feature>` - Test-driven generation

### WORKFLOW CONTROL
- `/siftcoder:status` - Show progress and where you left off
- `/siftcoder:pause` - Pause auto-continuation
- `/siftcoder:continue` - Resume from where you left off
- `/siftcoder:focus <target>` - Focus on specific feature/area
- `/siftcoder:pair` - Interactive pair programming mode

### SESSION & STATE
- `/siftcoder:checkpoint` - Save/restore named checkpoints
- `/siftcoder:handoff` - Session memory for cross-session continuity
- `/siftcoder:preview` - Preview changes before applying
- `/siftcoder:trace` - View execution trace and decisions

### COST & EFFICIENCY
- `/siftcoder:budget` - Token/cost tracking and optimization

### CREATIVE & NOVEL
- `/siftcoder:duck` - AI rubber duck debugging (Socratic questioning)
- `/siftcoder:empathy` - Developer pain point detection
- `/siftcoder:ghost` - Parallel universe code exploration ("what if" scenarios)
- `/siftcoder:oracle` - Predictive intent engine (anticipate next actions)
- `/siftcoder:timewarp` - State reconstruction debugging
- `/siftcoder:archaeologist` - Deep code history intelligence
- `/siftcoder:narrator` - Code-to-story translation (PM, exec, dev audiences)
- `/siftcoder:dream` - Generative exploration mode
- `/siftcoder:invariant` - Automatic contract mining
- `/siftcoder:chaos` - Intelligent chaos engineering
- `/siftcoder:fuzz-mind` - Intelligent edge case generation
- `/siftcoder:ripple` - Change impact visualization
- `/siftcoder:fortune` - Technical debt fortune telling
- `/siftcoder:polyglot` - Cross-language intelligence
- `/siftcoder:zen` - Minimalist code mode (aggressive simplification)

### SALESFORCE DEVELOPMENT
- `/siftcoder:apex` - Apex analysis, bulkification, governor limits, patterns
- `/siftcoder:apex-patterns` - Enterprise patterns (FFLib, Selector, Domain, Service)
- `/siftcoder:lwc` - Lightning Web Component creation and debugging
- `/siftcoder:lwc-debug` - LWC wire issues, lifecycle, performance
- `/siftcoder:schema` - Object/field creation, ERD visualization
- `/siftcoder:schema-migrate` - Schema migration and change management
- `/siftcoder:sf-connect` - Named Credentials, External Credentials, OAuth
- `/siftcoder:sf-webhook` - Inbound webhook handlers with HMAC verification
- `/siftcoder:sf-test` - Test generation, coverage analysis, mocks
- `/siftcoder:sf-test-data` - Test data factories and seed data
- `/siftcoder:sf-debug` - Debug log analysis, governor limit tracking
- `/siftcoder:sf-log` - Platform Event logging framework
- `/siftcoder:sf-deploy` - Deployment validation, CI/CD setup
- `/siftcoder:sf-package` - Unlocked package development
- `/siftcoder:sf-architect` - Architecture diagrams, capacity planning
- `/siftcoder:sf-architect-review` - Security, scalability, sharing reviews

### ANALYSIS
- `/siftcoder:missing` - Check what's not yet implemented
- `/siftcoder:gap-analysis <spec>` - Compare spec vs implementation

### UTILITY
- `/siftcoder:features list|add|complete` - Manage feature queue
- `/siftcoder:scope show|add|remove` - Manage boundaries
- `/siftcoder:knowledge` - Query cross-session learnings
- `/siftcoder:rollback <id>` - Rollback to checkpoint

## Current Status

Check `.claude/siftcoder-state/` for:
- `features.json` - Feature queue
- `current-task.json` - Active task
- `boundaries.json` - Current scope limits
- `knowledge/` - Learned patterns

## Getting Started

1. **New Project**: `/siftcoder:build path/to/spec.md`
2. **Add Feature**: `/siftcoder:add-feature "Add user authentication"`
3. **Fix Bug**: `/siftcoder:investigate "Payments fail for amounts > $1000"`

The appropriate agents will be invoked automatically based on your workflow.
