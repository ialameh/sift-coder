# /siftcoder:understand - Capture Project Understanding

Analyze and capture understanding of a project's structure, patterns, and architecture.

## Usage

```
/siftcoder:understand [--deep] [--area <path>]
```

## Arguments
- `$ARGUMENTS` - Optional flags: `--deep` for thorough analysis, `--area <path>` for specific area

## Instructions

You are capturing a comprehensive understanding of the project. This command scans the codebase, detects patterns, and stores knowledge for future sessions.

### Phase 1: Project Discovery

1. **Detect Project Type**
   ```
   🔍 ANALYZING PROJECT...

   Project Root: /path/to/project

   Detected:
   ├── Type: Node.js/TypeScript
   ├── Framework: React + Express
   ├── Package Manager: npm
   ├── Test Framework: Jest
   └── Build Tool: Vite
   ```

2. **Scan Structure**
   - Map directory structure
   - Identify key directories (src, tests, config, etc.)
   - Count files by type

3. **If ContextDigger Available**
   Use ContextDigger MCP for enhanced discovery:
   ```bash
   # Check for ContextDigger
   contextdigger dig --json
   ```
   This provides:
   - Automatic area discovery
   - Symbol indexing
   - Dependency graphs
   - Cohesion metrics

### Phase 2: Pattern Detection

Invoke the **pattern-detector** skill to identify:

1. **Naming Conventions**
   - File naming (kebab-case, camelCase, etc.)
   - Variable/function naming
   - Class/component naming

2. **Architecture Patterns**
   - MVC, Clean Architecture, etc.
   - Service/Repository patterns
   - State management approach

3. **Code Organization**
   - Feature-based vs type-based
   - Test location patterns
   - Configuration patterns

4. **Coding Style**
   - Import ordering
   - Error handling patterns
   - Async patterns

### Phase 3: Knowledge Extraction

1. **Identify Key Components**
   ```
   📦 KEY COMPONENTS

   Entry Points:
   ├── src/index.ts - Application entry
   ├── src/server.ts - Express server
   └── src/App.tsx - React root

   Core Services:
   ├── src/services/auth.ts - Authentication
   ├── src/services/api.ts - API client
   └── src/services/db.ts - Database

   Data Models:
   ├── src/models/User.ts
   ├── src/models/Product.ts
   └── src/models/Order.ts
   ```

2. **Map Dependencies**
   - Internal dependencies between modules
   - External package dependencies
   - Database/API dependencies

3. **Detect Gotchas**
   - Environment requirements
   - Build prerequisites
   - Common pitfalls

### Phase 4: Store Understanding

1. **Save to Knowledge Base**
   Store patterns in `.claude/siftcoder-state/knowledge/`:
   - `patterns.json` - Detected patterns
   - `gotchas.json` - Identified pitfalls
   - `decisions.json` - Architecture decisions found

2. **If siftcoder-mcp Available**
   Generate embeddings and store in vector database for semantic search:
   ```
   Storing 15 patterns in vector database...
   Storing 5 gotchas...
   Storing 3 architecture decisions...
   ```

3. **Generate Summary**
   Save to `.claude/siftcoder-state/project-understanding.json`:
   ```json
   {
     "projectName": "my-app",
     "analyzedAt": "2026-01-10T12:00:00Z",
     "type": "typescript-react",
     "framework": "React 18 + Express",
     "architecture": "Clean Architecture",
     "directories": 24,
     "files": 156,
     "patterns": 15,
     "gotchas": 5
   }
   ```

### Phase 5: Output Report

```
✅ PROJECT UNDERSTANDING CAPTURED

Project: my-app
Type: TypeScript React + Express
Architecture: Clean Architecture

Structure:
├── src/           (89 files)
│   ├── components/  - React components
│   ├── services/    - Business logic
│   ├── models/      - Data models
│   └── utils/       - Helpers
├── tests/         (34 files)
└── config/        (8 files)

Patterns Detected (15):
├── Naming: camelCase functions, PascalCase components
├── Imports: External → Internal → Relative
├── Errors: Custom error classes with codes
├── Async: async/await with try/catch
└── Tests: Co-located with .test.ts suffix

Gotchas Found (5):
├── DATABASE_URL must be set before start
├── Node 18+ required for native fetch
├── Build requires VITE_API_URL env var
├── Tests need running database
└── ESM modules - use .js extensions in imports

Key Files to Know:
├── src/config/index.ts - All configuration
├── src/services/index.ts - Service exports
├── src/types/index.ts - Shared types
└── docs/ARCHITECTURE.md - Architecture docs

Knowledge Stored:
├── Patterns: 15 → knowledge/patterns.json
├── Gotchas: 5 → knowledge/gotchas.json
├── Vectors: 20 entries (siftcoder-mcp)
└── Summary: project-understanding.json

Use /siftcoder:knowledge to query this understanding.
```

## Deep Mode (--deep)

With `--deep` flag:
- Analyze every file (not just samples)
- Extract docstrings and comments
- Build complete dependency graph
- Generate Mermaid diagrams
- Takes longer but more thorough

## Area Mode (--area)

With `--area <path>`:
- Focus on specific directory
- Useful for large monorepos
- Can be run multiple times for different areas

## Integration with Other Commands

After understanding is captured:
- `/siftcoder:add-feature` uses patterns for consistency
- `/siftcoder:investigate` has context for better analysis
- `/siftcoder:document` leverages captured structure
- `/siftcoder:knowledge` queries the understanding

---

## Tips & Hints

```
WHY RUN UNDERSTAND?

Before adding features:
  → I learn your coding patterns
  → New code will match your style automatically

Before fixing bugs:
  → I know the gotchas and pitfalls
  → Investigations are more accurate

Before documenting:
  → I understand the architecture
  → Documentation is more comprehensive

OPTIONS EXPLAINED

Basic (no flags):
  → Quick scan, samples files
  → Good for most projects

--deep:
  → Analyzes every file
  → Builds complete dependency graph
  → Generates Mermaid diagrams
  → Takes longer but more thorough

--area src/components:
  → Focus on specific directory
  → Great for monorepos
  → Can run multiple times for different areas

AFTER UNDERSTANDING

Query what I learned:
  → /siftcoder:knowledge patterns
  → /siftcoder:knowledge gotchas

Generate spec from code:
  → /siftcoder:reverse-spec
  → Creates documentation of what exists

Start working:
  → /siftcoder:add-feature "..."
  → /siftcoder:investigate "..."
  → /siftcoder:document code
```

---

## Allowed Tools
Read, Glob, Grep, Bash, Task (for subagents and MCP)

## Skills Used
- **pattern-detector** - Detect code patterns
- **diagram-generator** - Create visualizations (with --deep)
