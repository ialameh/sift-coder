# SiftCoder Suggest Command

Analyzes your request and suggests the most appropriate SiftCoder command to use.

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

- **Feature Development**: /build, /add-feature, /migrate
- **Problem Solving**: /fix, /debug, /investigate
- **Code Quality**: /refactor, /review, /security
- **Documentation**: /document, /narrator
- **Understanding**: /learn, /understand, /search
- **Testing**: /test, /tdd, /sf-test
- **Salesforce**: /sf-* commands
- **Architecture**: /sf-architect, /schema
- **Team**: /team, /pair, /swarm

## Examples

| Request | Suggested Command | Confidence |
|---------|------------------|------------|
| "Add login functionality" | /siftcoder:build | High |
| "Fix the bug in payments" | /siftcoder:fix | High |
| "Refactor user service" | /siftcoder:refactor | High |
| "Document API endpoints" | /siftcoder:document | High |
| "Find security issues" | /siftcoder:security | High |
| "How does this work?" | /siftcoder:understand | Medium |
| "Write tests for auth" | /siftcoder:tdd | High |
| "Generate class diagram" | /sf-architect | Medium |
