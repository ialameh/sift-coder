---
name: suggest
description: Analyzes natural language requests and suggests the most appropriate SiftCoder command to use
version: 1.0.0
---

# Suggest Command

Analyzes your natural language request and suggests the most appropriate SiftCoder command to use.

## Usage

```bash
/siftcoder:suggest "I need to add a new feature for user authentication"
/siftcoder:suggest "The code has security vulnerabilities"
/siftcoder:suggest "I want to understand how this codebase works"
/siftcoder:suggest "Refactor the payment processing module"
```

## How It Works

1. **Analyzes** your natural language request
2. **Extracts** key intent, keywords, and context
3. **Matches** against all available SiftCoder commands
4. **Suggests** the best command with explanation
5. **Provides** alternative options if multiple matches exist

## Analysis Categories

- **Feature Development**: `/build`, `/add-feature`, `/migrate`
- **Problem Solving**: `/fix`, `/debug`, `/investigate`
- **Code Quality**: `/refactor`, `/review`, `/security`
- **Documentation**: `/document`, `/narrator`
- **Understanding**: `/learn`, `/understand`, `/search`
- **Testing**: `/test`, `/tdd`, `/sf-test`
- **Salesforce**: `/sf-*` commands
- **Architecture**: `/sf-architect`, `/schema`
- **Team**: `/team`, `/pair`, `/swarm`

## Examples

| Request | Suggested Command | Confidence |
|---------|------------------|------------|
| "Add login functionality" | `/siftcoder:build` | High |
| "Fix the bug in payments" | `/siftcoder:fix` | High |
| "Refactor user service" | `/siftcoder:refactor` | High |
| "Document API endpoints" | `/siftcoder:document` | High |
| "Find security issues" | `/siftcoder:security` | High |
| "How does this work?" | `/siftcoder:understand` | Medium |
| "Write tests for auth" | `/siftcoder:tdd` | High |
| "Generate class diagram" | `/sf-architect` | Medium |

## Response Format

```
🎯 Suggested Command:
  /siftcoder:build
  Build new features or functionality from specifications
  Confidence: 95%
  Reason: Matches keyword: "add"; Matches keyword: "new"; Matches intent: "Create new feature or functionality"

📋 Alternative Commands:
  1. /siftcoder:add-feature (85%)
  2. /siftcoder:migrate (70%)

📝 Your Intent: Create new feature or functionality
🔑 Keywords: add, new, feature, authentication

Run the suggested command directly to continue.
```

## Implementation

The suggest command uses the `SuggestService` which:

1. **Keyword Extraction**: Identifies relevant keywords from the request
2. **Intent Determination**: Determines the primary intent (create, fix, refactor, etc.)
3. **Command Scoring**: Scores each command based on keyword matching, intent alignment, and context relevance
4. **Confidence Ranking**: Ranks commands by confidence score and provides alternatives

## When to Use

- **Uncertainty**: When you're not sure which command to use
- **Discovery**: When exploring available commands for a task
- **Onboarding**: When learning SiftCoder capabilities
- **Context Switching**: When switching between different types of tasks

## See Also

- `/siftcoder:wizard` - Interactive guided walkthrough
- `/siftcoder:oracle` - Predictive intent engine
- `/siftcoder:einstein` - Advanced command prediction
