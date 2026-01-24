---
description: Generate architecture codemaps
allowed-tools: Read, Write, Edit, Bash, Task
---

# /update-codemaps - Architecture Code Maps

Generates architecture diagrams and dependency graphs for the codebase.

## Usage

```
/update-codemaps
```

## Process

### Phase 1: Codebase Scan
1. Scan all source files
2. Extract imports and exports
3. Identify file types
4. Build dependency graph

### Phase 2: Architecture Analysis
1. Categorize files (services, components, utils)
2. Map dependencies
3. Identify circular dependencies
4. Calculate complexity metrics

### Phase 3: Diagram Generation
1. **Service View** (codemaps/services.md)
   - All services and their roles
   - Dependencies and dependents
   - Integration points

2. **Dependency Graph** (codemaps/dependencies.md)
   - Mermaid diagram of relationships
   - Visual representation of architecture

3. **Component Tree** (codemaps/components.md)
   - Hierarchical view
   - Component relationships

### Phase 4: Output
1. Save to `docs/codemaps/`
2. Display generated diagrams
3. Highlight architecture insights

## Example Output

```
🗺️  Generating codemaps...

  → Scanning source files...
    Found 47 files

  → Building architecture graph...
    Identified 8 services
    Identified 12 components
    Identified 15 utilities

  → Generating service view...
    ✅ docs/codemaps/services.md

  → Generating dependency graph...
    ✅ docs/codemaps/dependencies.md

  → Generating component tree...
    ✅ docs/codemaps/components.md

✅ Codemaps generated successfully

📊 Architecture Summary:
  • Total files: 47
  • Services: 8
  • Components: 12
  • Utilities: 15
  • Max depth: 4 levels
  • Circular deps: 0

🔍 Insights:
  → AuthService depends on 3 services
  → UserService is used by 5 modules
  → FileUtils is a utility (low coupling)
  → No circular dependencies detected

📂 Generated files:
  • docs/codemaps/services.md - Service architecture
  • docs/codemaps/dependencies.md - Dependency graph (Mermaid)
  • docs/codemaps/components.md - Component tree

💡 Next steps:
  → Review architecture diagrams
  → Identify refactoring opportunities
  → Add to project documentation
```

## Code Map Types

### Service View
- Lists all services
- Shows dependencies count
- Shows dependents count
- Identifies integration points

### Dependency Graph
- Mermaid-compatible diagram
- Visual architecture representation
- Import/export relationships
- Can be rendered in GitHub

### Component Tree
- Hierarchical component structure
- Parent-child relationships
- Module organization

## Tips & Hints

```

ARCHITECTURE ANALYSIS:

What codemaps reveal:
  → High coupling (many dependencies)
  → Low cohesion (unrelated functions together)
  → Circular dependencies (architectural issue)
  → Orphaned code (nothing depends on it)
  → God objects (everything depends on it)

Good architecture:
  → Clear separation of concerns
  → Minimal circular dependencies
  → Services depend on utilities (not vice versa)
  → Components depend on services (not vice versa)

Red flags:
  🔴 Circular dependencies
  🔴 Services depending on components
  🔴 Deep nesting (5+ levels)
  🔴 God objects (10+ dependents)

REFACTORING OPPORTUNITIES:

High coupling:
  → Extract interfaces
  → Use dependency injection
  → Split large modules

Circular dependencies:
  → Extract shared code
  → Use event bus pattern
  → Introduce mediator

Deep nesting:
  → Flatten hierarchy
  → Use composition
  → Extract intermediate layers

CODMAP MAINTENANCE:

Update codemaps:
  → After major refactoring
  → Before releases
  → When adding new services
  → Onboarding new developers

Automate:
  → Add to pre-commit hook
  → Generate in CI/CD
  → Include in PR checks

INTEGRATION WITH TOOLS:

View Mermaid diagrams:
  → GitHub (native support)
  → VS Code (Mermaid preview)
  → Mermaid Live Editor
  → MkDocs with Mermaid plugin

Use in documentation:
  → README.md
  → Architecture docs
  → Onboarding guides
  → ADRs (Architecture Decision Records)

EXAMPLE WORKFLOW:

1. /update-codemaps
2. Review dependency graph
3. Identify refactoring targets
4. Make improvements
5. Re-run to verify

ONBOARDING:

For new developers:
  → Share codemaps in docs
  → Walk through architecture
  → Explain key decisions
  → Use as navigation aid
```

---

## Now: Generate Code Maps

Using DocService to generate architecture codemaps...

1. Scanning source files
2. Building dependency graph
3. Categorizing components
4. Generating diagrams

Starting code map generation...
