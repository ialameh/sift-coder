# LEARN Workflow

**Knowledge and learning tools**

---

## Overview

The LEARN workflow contains 4 commands for interactive learning and onboarding.

---

## Commands Overview

| Command | Purpose | Difficulty | Time |
|---------|---------|------------|------|
| `/learn codebase` | Interactive codebase tour | ⭐ Beginner | 10-30 min |
| `/learn onboard` | Generate onboarding docs | ⭐⭐ Intermediate | 15-30 min |
| `/learn explain <file>` | Deep file explanation | ⭐ Beginner | 5-10 min |
| `/learn journey <flow>` | Follow user flow | ⭐ Beginner | 5-15 min |

---

## /learn codebase

Interactive codebase tour - guided exploration of the project.

```bash
/siftcoder:learn codebase
```

---

## /learn explain

Deep explanation of a file - what it does, why it exists, how it works.

```bash
/siftcoder:learn explain src/services/payment.ts
```

---

## /learn journey

Follow a user flow through the code (e.g., "login to checkout").

```bash
/siftcoder:learn journey "user clicks checkout button"
```

---

## See Also

- [UNDERSTAND Workflow](./understand-workflow.md) - Codebase analysis
