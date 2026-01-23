# Skill: Semantic Codebase Search

**Vector-based code discovery using semantic similarity**

---

## Overview
- **Purpose**: Find code by meaning, not just keywords
- **Type**: Search
- **Invoked By**: `/search`, `/investigate`, `/understand`

---

## What This Skill Does

Provides semantic code search using vector embeddings:

1. **Natural Language Queries**
   - Search using concepts, not exact terms
   - Find related code even with different names

2. **Vector Indexing**
   - Embed code chunks as vectors
   - Store in LanceDB for fast retrieval
   - Update index as code changes

3. **Similarity Matching**
   - Compare query embeddings to code embeddings
   - Return most similar code sections
   - Provide relevance scores

---

## How It Works

### 1. Index Codebase

```bash
index_codebase() {
  # Find all code files
  files=$(find "$path" -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" \
      -o -name "*.py" -o -name "*.go" \))

  # Create embeddings using Ollama
  for file in $files; do
    embed_file "$file"
  done

  # Store in LanceDB
  store_in_lancedb
}
```

### 2. Search Vectors

```bash
search_vectors() {
  local query="$1"

  # Generate query embedding
  query_emb=$(ollama embed nomic-embed-text "$query")

  # Search LanceDB
  results=$(lancedb search "$query_emb")

  echo "$results"
}
```

### 3. Update Index

```bash
update_index() {
  # Check for modified files
  changed_files=$(find . -newermt "$last_index")

  # Re-index changed files
  for file in $changed_files; do
    index_file "$file"
  done
}
```

---

## Usage Examples

### Basic Search

```bash
/siftcoder:search "authentication logic"
```

**Output:**
```
🔍 Semantic search: "authentication logic"

Found 5 relevant code sections:

1. src/services/auth.ts (similarity: 0.92)
   Lines: 15-89
   Context: User authentication with JWT tokens

2. src/middleware/auth.ts (similarity: 0.87)
   Lines: 1-45
   Context: Authentication middleware for routes

3. src/routes/auth.ts (similarity: 0.81)
   Lines: 10-67
   Context: Authentication endpoints
```

### Query Expansion

The skill automatically expands queries to find related code:

```
Query: "password reset"
Expanded: "password reset OR forgot password OR recovery"
```

---

## Requirements

### Optional Dependencies

- **LanceDB**: `pip install lancedb` - Vector database
- **Ollama**: https://ollama.ai - Local embeddings
- **nomic-embed-text**: `ollama pull nomic-embed-text` - Embedding model

### Without Dependencies

If dependencies aren't available, falls back to:
- Keyword-based search
- Grep for file names
- Content pattern matching

---

## Performance

| Operation | Performance |
|-----------|-------------|
| Index building | ~100 files/minute |
| Search latency | < 2 seconds |
| Index size | ~10% of codebase |
| Update speed | Incremental, only changed files |

---

## Integration

### Commands Using This Skill
- `/search` - Semantic code search
- `/investigate` - Finding relevant code during investigation
- `/understand` - Building code understanding

### Related Skills
- `pattern-detector` - Analyzes code patterns
- `gap-analyzer` - Compares spec vs code

---

## Examples

### Finding Authentication Code

```bash
/siftcoder:search "user authentication"
```

**Finds:**
- Login functions
- JWT token handling
- Session management
- Password validation

Even if variable names don't match exactly!

### Finding Database Code

```bash
/siftcoder:search "database queries"
```

**Finds:**
- SQL queries
- ORM operations
- Database connections
- Data access layers

---

## See Also

- [Command: /search](../02-command-reference/by-category/understand-workflow.md#search)
- [Command: /investigate](../02-command-reference/by-category/maintain-workflow.md#investigate)
- [Skill: Pattern Detector](pattern-detector.md)
