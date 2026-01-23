# ANALYZE Workflow

**Spec vs code comparison and ideation**

---

## Overview

The ANALYZE workflow contains 3 commands for bidirectional analysis between specifications and implementation.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| `/gap-analysis <spec>` | Compare spec vs code for gaps | ⭐⭐ Intermediate | 10-30 min |
| `/ideate <spec>` | Generate feature ideas | ⭐⭐ Intermediate | 15-45 min |
| `/improve-spec` | Enhance specification quality | ⭐⭐ Intermediate | 5-15 min |

---

## /gap-analysis

Compare specification against code to find gaps and extras.

```bash
/siftcoder:gap-analysis ./specs/requirements.md
```

**Finds:**
- Missing features (in spec, not in code)
- Undocumented features (in code, not in spec)
- Partial implementations
- Outdated specifications

---

## /ideate

Analyze specification and suggest missing features.

```bash
/siftcoder:ideate spec.md --level 2
```

**Levels:**
- **Level 1 (Quick)**: Spec gap analysis, missing essentials (5-10 min)
- **Level 2 (Standard)**: + Market research, competitor analysis, UX best practices (15-30 min)
- **Level 3 (Deep)**: + SEO trends, user personas, innovation opportunities (45-90 min)

---

## /improve-spec

Enhance specification quality with testable criteria.

```bash
/siftcoder:improve-spec ./specs/draft.md
```

---

## See Also

- [UNDERSTAND Workflow](./understand-workflow.md) - Analyze codebase
- [Skill: Gap Analyzer](../../03-skills-reference/gap-analyzer.md)
