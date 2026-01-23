# /siftcoder:search - Semantic Codebase Search

**Find code by meaning, not just keywords. Uses vector embeddings for intelligent code discovery.**

## Usage

```
/siftcoder:search <natural-language-query>
```

## Examples

```bash
# Find code by meaning
/siftcoder:search "where do we handle user authentication"
/siftcoder:search "how do we process payments"
/siftcoder:search "error handling for API calls"

# Find specific implementations
/siftcoder:search "database connection logic"
/siftcoder:search "JWT token validation"
/siftcoder:search "file upload functionality"

# Explore architecture
/siftcoder:search "what's the data flow for user registration"
/siftcoder:search "how does the checkout process work"
```

## Arguments

- `$ARGUMENTS` - Natural language query describing what you're looking for

## Instructions

You are a **Semantic Code Search Specialist** that helps developers find code by meaning and intent, not just exact keywords.

### Core Principles

1. **Understand Intent** - What is the user really looking for?
2. **Semantic Matching** - Find related code even with different keywords
3. **Context Rich** - Show code context, relationships, and data flow
4. **Fast Results** - Return relevant results in < 2 seconds
5. **Privacy First** - All processing happens locally

---

## Phase 0: Pre-Flight Checks

### Step 1: Check Vector Index

```bash
# Check if index exists
index_file=".claude/siftcoder-state/vector-index/lancedb"

if [ ! -d "$index_file" ]; then
  echo "📊 Vector index not found"
  echo ""
  echo "Building index for first time..."
  echo "This may take a few minutes for large codebases."
  echo ""

  build_vector_index
fi

# Check if index is stale
last_index=$(stat -f %m "$index_file" 2>/dev/null || stat -c %Y "$index_file")
last_change=$(find . -name "*.ts" -o -name "*.js" -o -name "*.py" | xargs stat -f %m 2>/dev/null | sort -rn | head -1)

if [ "$last_change" -gt "$last_index" ]; then
  echo "⚠️  Code has changed since last index"
  echo ""
  ask_user "Rebuild index?" && rebuild_vector_index
fi
```

### Step 2: Verify LanceDB and Ollama

```bash
# Check LanceDB
if ! command -v lancedb &> /dev/null; then
  echo "⚠️  LanceDB not installed"
  echo ""
  echo "Install with: pip install lancedb"
  echo ""
  echo "Falling back to grep-based search..."
  fallback_search=true
fi

# Check Ollama (for embeddings)
if ! command -v ollama &> /dev/null; then
  echo "⚠️  Ollama not installed"
  echo ""
  echo "Install from: https://ollama.ai"
  echo ""
  echo "Falling back to grep-based search..."
  fallback_search=true
fi
```

---

## Phase 1: Query Analysis

### Step 1: Understand User Intent

Parse the natural language query to understand:

**What type of code are they looking for?**

```
"where do we handle user authentication"
→ Type: IMPLEMENTATION_SEARCH
→ Domain: AUTHENTICATION
→ Intent: FIND_AUTHENTICATION_LOGIC

"how do we process payments"
→ Type: FLOW_SEARCH
→ Domain: PAYMENTS
→ Intent: UNDERSTAND_PAYMENT_FLOW

"database connection"
→ Type: SPECIFIC_FUNCTION
→ Domain: DATABASE
→ Intent: FIND_CONNECTION_CODE
```

**Extract key concepts:**

```bash
# Extract main concepts
query="$ARGUMENTS"

# Identify domain concepts
domains=$(identify_domains "$query")
  # → authentication, payment, database, api, etc.

# Identify action concepts
actions=$(identify_actions "$query")
  # → handle, process, validate, connect, etc.

# Identify entity concepts
entities=$(identify_entities "$query")
  # → user, payment, customer, product, etc.
```

### Step 2: Generate Query Embedding

```bash
# Use Ollama to generate query embedding
query_embedding=$(ollama embed nomic-embed-text "$query")

# Or use LanceDB's embedding function
if [ "$fallback_search" = false ]; then
  query_embedding=$(python3 -c "
import lancedb
db = lancedb.connect('.claude/siftcoder-state/vector-index')
table = db.open('codebase')
embedding = table.embed_strings('$query')
print(embedding)
")
fi
```

---

## Phase 2: Semantic Search

### Step 1: Vector Similarity Search

```bash
echo "🔍 Searching: $query"
echo ""

# Perform vector search
if [ "$fallback_search" = false ]; then
  results=$(lancedb query \
    --index .claude/siftcoder-state/vector-index \
    --table codebase \
    --query "$query_embedding" \
    --limit 10 \
    --metric cosine)
else
  # Fallback: grep-based search
  results=$(grep -r "$query" src/ --include="*.ts" --include="*.js" -n | head -10)
fi

# Parse results
echo "📊 Found $(echo "$results" | wc -l) relevant results"
echo ""
```

### Step 2: Re-Rank by Context

```bash
# Re-rank results based on:
# 1. Semantic similarity (already done)
# 2. Code context (is it the main function or a comment?)
# 3. File importance (is it in src/ or tests/?)
# 4. Recency (recently modified files)

ranked_results=$(rank_results "$results")

echo "📈 Top results:"
echo ""
```

---

## Phase 3: Result Presentation

### Step 1: Show Top Results

Display results in order of relevance:

```markdown
## Result 1: src/services/auth.ts (92% match)

**Context:** This file handles user authentication logic

**Location:** Line 45-120

**Code:**
\`\`\`typescript
export class AuthService {
  async authenticate(email: string, password: string): Promise<User> {
    // Validate credentials
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
\`\`\`

**Why this matches:**
- ✓ Handles user authentication (exact match)
- ✓ Validates credentials
- ✓ Uses bcrypt for password verification

**Related files:**
- src/middleware/auth.ts - Uses AuthService for middleware
- src/controllers/auth.ts - Calls AuthService.authenticate()
```

### Step 2: Show Multiple Perspectives

**When results span multiple files, show them grouped:**

```markdown
## Authentication Implementation (Found in 5 files)

### Primary Implementation
**src/services/auth.ts** - AuthService class (92% match)
  - authenticate() method
  - validateToken() method
  - refreshToken() method

### Usage Points
**src/controllers/auth.ts** - LoginController (87% match)
  - Calls AuthService.authenticate()

**src/middleware/auth.ts** - AuthMiddleware (78% match)
  - Validates JWT tokens
  - Protects routes

### Related
**src/utils/jwt.ts** - JWT utilities (65% match)
**src/models/user.ts** - User model (54% match)
```

### Step 3: Interactive Exploration

Offer follow-up actions:

```bash
echo ""
echo "💡 Next steps:"
echo "  1. View file: /siftcoder:explain src/services/auth.ts"
echo "  2. See flow: /siftcoder:search 'authentication flow from login to token'"
echo "  3. Find tests: /siftcoder:search 'tests for authentication'"
echo "  4. Show dependencies: /siftcoder:search 'what uses AuthService'"
```

---

## Phase 4: Context Enrichment

### Step 1: Show Data Flow

For queries about flows/processes, show data flow:

```markdown
## Data Flow: User Registration

**Request Flow:**
```
user submits form
  ↓
POST /api/auth/register
  ↓
RegistrationController.register()
  ↓
AuthService.register()
  ↓
UserRepository.create()
  ↓
Database INSERT
  ↓
Return user + JWT token
```

**Key Files:**
- src/controllers/auth.ts - Entry point
- src/services/auth.ts - Business logic
- src/repositories/user.ts - Data access
- src/database/models/user.ts - Schema

**Error Handling:**
- Validation errors → 400 Bad Request
- Duplicate email → 409 Conflict
- Database errors → 500 Internal Server Error
```

### Step 2: Show Relationships

```markdown
## Relationship Map: Authentication

**Direct Dependencies:**
- AuthService → UserRepository (data access)
- AuthService → JwtService (token generation)
- AuthService → PasswordHasher (bcrypt)

**Used By:**
- LoginController → AuthService.authenticate()
- RegistrationController → AuthService.register()
- AuthMiddleware → AuthService.validateToken()

**Test Coverage:**
- auth.service.spec.ts - Unit tests
- auth.controller.spec.ts - Integration tests
- auth.middleware.spec.ts - Middleware tests
```

---

## Phase 5: Index Management

### Step 1: Build Vector Index

```bash
build_vector_index() {
  echo "🏗️  Building vector index..."

  # Create index directory
  mkdir -p .claude/siftcoder-state/vector-index

  # Find all code files
  files=$(find . -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" | grep -v node_modules | grep -v ".next")

  # Index each file
  echo "$files" | while read file; do
    echo "  Indexing: $file"

    # Generate embeddings for code chunks
    index_file "$file"
  done

  # Create metadata
  cat > .claude/siftcoder-state/vector-index/metadata.json <<EOF
{
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files_indexed": $(echo "$files" | wc -l),
  "total_chunks": $(cat .claude/siftcoder-state/vector-index/chunks.txt | wc -l),
  "embedding_model": "nomic-embed-text",
  "vector_dimension": 768
}
EOF

  echo "✅ Index built successfully"
  echo "  Files: $(jq '.files_indexed' .claude/siftcoder-state/vector-index/metadata.json)"
  echo "  Chunks: $(jq '.total_chunks' .claude/siftcoder-state/vector-index/metadata.json)"
}
```

### Step 2: Incremental Index Updates

```bash
update_index() {
  # Only index changed files
  last_index=$(jq '.created_at' .claude/siftcoder-state/vector-index/metadata.json)

  changed_files=$(find . -name "*.ts" -newermt "$last_index" -o -name "*.js" -newermt "$last_index")

  if [ -n "$changed_files" ]; then
    echo "📝 Updating index for $(echo "$changed_files" | wc -l) changed files..."

    echo "$changed_files" | while read file; do
      remove_from_index "$file"
      index_file "$file"
    done

    # Update metadata
    jq '.created_at = "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"' \
      .claude/siftcoder-state/vector-index/metadata.json > .tmp
    mv .tmp .claude/siftcoder-state/vector-index/metadata.json
  fi
}
```

---

## Integration with Existing Commands

### With `/siftcoder:investigate`

```bash
# When investigating an issue, use semantic search to find relevant code
/siftcoder:investigate "Users can't log in"

# Internally calls:
/siftcoder:search "user authentication login"
/siftcoder:search "error handling in auth flow"
```

### With `/siftcoder:understand`

```bash
# Use semantic search to understand architecture
/siftcoder:understand

# Calls semantic search to find:
# - Main entry points
# - Key services
# - Data models
# - API endpoints
```

### With `/siftcoder:fix`

```bash
# When fixing a bug, find related code semantically
/siftcoder:fix "Payment processing fails"

# Uses semantic search to find:
/siftcoder:search "payment processing logic"
/siftcoder:search "error handling in payments"
/siftcoder:search "payment API endpoints"
```

---

## Fallback: Grep-Based Search

When vector search is unavailable, fall back to intelligent grep:

```bash
grep_search() {
  query="$1"

  echo "🔍 Searching (grep-based): $query"
  echo ""

  # Extract keywords from query
  keywords=$(echo "$query" | grep -oE '\w{3,}' | tr '\n' '|')

  # Search with context
  results=$(grep -r -E "$keywords" \
    --include="*.ts" \
    --include="*.js" \
    --include="*.py" \
    -B 2 -A 2 \
    -n \
    src/ | head -20)

  # Display results
  echo "$results"
}
```

---

## Performance Optimization

### Fast Index Updates

```bash
# Use file modification time to skip unchanged files
index_file() {
  local file="$1"
  local cache=".claude/siftcoder-state/vector-index/cache/$(echo $file | md5sum)"

  if [ -f "$cache" ]; then
    cached_mtime=$(stat -f %m "$cache")
    file_mtime=$(stat -f %m "$file")

    if [ "$file_mtime" -le "$cached_mtime" ]; then
      return  # Skip, already indexed
    fi
  fi

  # Index the file
  # ...
}
```

### Parallel Indexing

```bash
# Index multiple files in parallel
find . -name "*.ts" | parallel -j 4 index_file {}
```

---

## Examples

### Example 1: Finding Authentication Logic

```bash
/siftcoder:search "where do we handle user authentication"

🔍 Searching: where do we handle user authentication

📊 Found 12 relevant results

## Result 1: src/services/auth.ts (95% match)

**Context:** Main authentication service

**Location:** Lines 15-120

**Code:**
\`\`\`typescript
export class AuthService {
  async authenticate(email: string, password: string): Promise<User> {
    // ... implementation
  }
}
\`\`\`

**Why this matches:**
- ✓ Main authentication logic
- ✓ Handles credential validation
- ✓ Returns user tokens

**Related:**
- src/controllers/auth.ts - Uses AuthService
- tests/auth.service.spec.ts - Tests

💡 Next steps:
  /siftcoder:explain src/services/auth.ts
  /siftcoder:search "authentication flow diagram"
```

### Example 2: Understanding Data Flow

```bash
/siftcoder:search "how does user registration work"

🔍 Searching: how does user registration work

## Data Flow: User Registration

**Request → Response:**
```
POST /api/auth/register
  ↓
RegistrationController.register()
  ↓
AuthService.validateAndCreate()
  ↓
UserRepository.findByEmail() - Check duplicate
  ↓
PasswordHasher.hash() - Hash password
  ↓
UserRepository.create() - Save to DB
  ↓
JwtService.generate() - Create token
  ↓
Response: { user, token }
```

**Key Files:**
- src/controllers/auth.ts - Entry point
- src/services/auth.ts - Validation logic
- src/repositories/user.ts - Data access

💡 Next steps:
  /siftcoder:search "registration validation rules"
  /siftcoder:search "tests for user registration"
```

### Example 3: Finding Error Handling

```bash
/siftcoder:search "error handling for API calls"

🔍 Searching: error handling for API calls

📊 Found 8 relevant results

## Result 1: src/middleware/error-handler.ts (91% match)

**Context:** Global error handling middleware

**Code:**
\`\`\`typescript
export function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof UnauthorizedException) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... more error types
}
\`\`\`

**Other Error Handling:**
- src/utils/api-client.ts - API call error handling
- src/services/base.ts - Service layer errors
- tests/error-handling.spec.ts - Error tests

💡 Next steps:
  /siftcoder:search "custom error classes"
  /siftcoder:search "error logging"
```

---

## Tips & Hints

```
GETTING STARTED

First time using semantic search?
  → Use natural language queries
  → Be specific about what you want
  → Example: "where is user authentication handled" (good)
  → Example: "auth" (too vague)

QUERY TYPES

Find implementations:
  "where do we handle X"
  "how do we process X"
  "show me X implementation"

Understand flows:
  "how does X work"
  "what is the flow for X"
  "data flow for X process"

Find specific features:
  "database connection logic"
  "JWT token validation"
  "file upload functionality"

SEARCH TIPS

Be specific:
  ✅ "user authentication with JWT tokens"
  ❌ "auth"

Use natural language:
  ✅ "where do we validate user input"
  ❌ "validate input function"

Explore related concepts:
  → After getting results, ask follow-ups
  → "show me tests for this"
  → "what uses this function"

PERFORMANCE

First search builds index:
  → Takes 1-3 minutes for large codebases
  → Index is cached for subsequent searches
  → Automatic incremental updates

Fast results:
  → Most queries complete in < 2 seconds
  → Vector search is optimized for speed
  → Results ranked by relevance

PRIVACY

Everything is local:
  → No code leaves your machine
  → Embeddings generated locally (Ollama)
  → Vector database stored locally
  → No external API calls

TROUBLESHOOTING

Index not found?
  → First search automatically builds index
  → Wait for indexing to complete
  → Takes 1-3 minutes for large codebases

Slow results?
  → Check vector index is built
  → Use shorter queries
  → Reduce search scope (e.g., "in src/services")

No results?
  → Try different keywords
  → Use broader query
  → Check code actually exists
```

---

## Allowed Tools

Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion

## Required Components

- **LanceDB** - Vector database (pip install lancedb)
- **Ollama** - Local embeddings (https://ollama.ai)
- **nomic-embed-text** - Embedding model (ollama pull nomic-embed-text)

## Skills Used

- **semantic-codebase-search** - Vector search capabilities
- **index-codebase** - Build and maintain vector index

## Integration Points

- `/siftcoder:investigate` - Find relevant code
- `/siftcoder:understand` - Architecture analysis
- `/siftcoder:fix` - Locate bug-related code
- `/siftcoder:explain` - Deep dive into results
