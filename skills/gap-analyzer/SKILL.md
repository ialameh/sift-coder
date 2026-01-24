---
name: gap-analyzer
description: Detect gaps between specification and implementation, and identify undocumented features
version: 1.0.0
---

# Gap Analyzer Skill

Detect gaps between specification and implementation, and identify undocumented features.

## Invocation
This skill is invoked by `/siftcoder:gap-analysis` or can be used standalone for gap detection tasks.

## Capabilities

### 1. Requirement Extraction

Extract structured requirements from specification files:

**Input:** Specification file (markdown, JSON, YAML)

**Output:**
```json
{
  "requirements": [
    {
      "id": "REQ-001",
      "section": "Authentication",
      "title": "User Login",
      "description": "Users can authenticate with email and password",
      "acceptance": [
        "User can enter email and password",
        "Invalid credentials show error message",
        "Successful login redirects to dashboard",
        "Session persists for 7 days"
      ],
      "keywords": ["login", "auth", "email", "password", "session"],
      "priority": "P0",
      "dependencies": []
    }
  ]
}
```

**Process:**
1. Detect file format (markdown sections, JSON schema, YAML structure)
2. Parse hierarchically (sections → features → acceptance criteria)
3. Extract keywords for matching
4. Assign priority based on language cues or explicit markers
5. Identify dependencies between requirements

---

### 2. Crawl Plan Generation

Create efficient exploration strategy:

**Input:**
- List of requirements
- Codebase root path
- Optional: Prior knowledge from `/understand`

**Output:**
```json
{
  "areas": [
    {
      "id": "area-001",
      "path": "src/auth/",
      "priority": 1,
      "likelyRequirements": ["REQ-001", "REQ-002", "REQ-003"],
      "fileCount": 12,
      "keywords": ["login", "register", "session", "token"],
      "confidence": 0.85
    }
  ],
  "unmappedRequirements": ["REQ-015"],
  "suggestedSearchPaths": ["src/", "lib/", "app/"]
}
```

**Mapping Strategies:**

1. **Keyword Matching:**
   - Requirement keywords → folder/file names
   - "authentication" → likely in `auth/`, `login/`, `session/`

2. **Semantic Similarity (with siftcoder-mcp):**
   - Embed requirement descriptions
   - Compare against code file embeddings
   - Cluster related requirements to areas

3. **Prior Knowledge:**
   - If `/understand` ran, use captured patterns
   - Known architectural conventions
   - Previously discovered code organization

---

### 3. Implementation Detection

For each area, determine implementation status:

**Input:**
- Area path
- List of requirements expected in this area

**Output per Requirement:**
```json
{
  "requirementId": "REQ-001",
  "status": "implemented|partial|missing",
  "confidence": 0.85,
  "implementations": [
    {
      "file": "src/auth/login.ts",
      "lines": "15-45",
      "type": "function",
      "name": "authenticateUser",
      "matchedCriteria": [
        "User can enter email and password",
        "Successful login redirects to dashboard"
      ],
      "missingCriteria": [
        "Session persists for 7 days"
      ]
    }
  ],
  "evidence": "Found authenticateUser() with email/password params, returns token but no session persistence logic"
}
```

**Detection Methods:**

1. **Direct Search:**
   - Grep for keywords in file names and content
   - Look for function/class names matching requirement

2. **Semantic Analysis:**
   - Read code and understand purpose
   - Match against acceptance criteria

3. **Test Coverage:**
   - Check for tests covering the requirement
   - Test names often mirror requirements

---

### 4. Extra Feature Discovery

Identify features in code not mentioned in spec:

**Process:**
1. During area exploration, note all significant features
2. Compare against requirement list
3. Features without matching requirements = extras

**Output:**
```json
{
  "extras": [
    {
      "id": "EXTRA-001",
      "title": "Admin Dashboard",
      "location": "src/admin/",
      "files": 12,
      "linesOfCode": 2400,
      "description": "Full admin panel with user management, analytics, system settings",
      "entryPoints": ["src/admin/index.ts", "src/admin/routes.ts"],
      "suggestedSpecSection": "Administration",
      "importance": "high"
    }
  ]
}
```

**Discovery Heuristics:**
- Folders with many files but no spec coverage
- Exported functions/routes not matching requirements
- UI components without documented features
- API endpoints without spec entries

---

### 5. Gap Classification

Classify gaps by severity and type:

**Gap Types:**

| Type | Description | Example |
|------|-------------|---------|
| `missing` | No implementation found | Feature entirely absent |
| `partial` | Some criteria met | Login works, but no session persistence |
| `incomplete` | Stub or TODO | Function exists but not implemented |
| `outdated` | Implemented differently | Spec says X, code does Y |

**Severity Classification:**

```
CRITICAL (P0):
  - Security features (auth, encryption)
  - Core business logic
  - Blocking other features

HIGH (P1):
  - Important user-facing features
  - Performance requirements
  - Integration points

MEDIUM (P2):
  - Enhancement features
  - Nice-to-have functionality
  - Non-critical paths

LOW (P3):
  - Documentation requirements
  - Minor improvements
  - Future considerations
```

---

### 6. Report Generation

Generate comprehensive analysis report:

**Sections:**

1. **Executive Summary**
   - Coverage percentages
   - Critical gaps count
   - Undocumented features count

2. **Gap Details**
   - Per requirement: status, evidence, suggested action
   - Grouped by section/priority

3. **Extras Details**
   - Per feature: location, description, documentation suggestion

4. **Coverage Matrix**
   - Section-by-section breakdown
   - Visual representation

5. **Recommendations**
   - Prioritized action items
   - Suggested siftcoder commands

---

### 7. Semantic Matching (with MCP)

If siftcoder-mcp is available, use vector search:

**Tools Used:**
- `knowledge_add` - Store requirement embeddings
- `code_embed` - Generate code embeddings
- `similarity_find` - Match requirements to code
- `knowledge_search` - Query existing knowledge

**Process:**
```
1. For each requirement:
   - Generate embedding from title + description + criteria
   - Store in vector DB with metadata

2. For each code section discovered:
   - Generate embedding from function/class + comments
   - Store in vector DB

3. Cross-match:
   - For each requirement embedding, find nearest code embeddings
   - Threshold (0.7) determines match
   - Return similarity scores
```

**Fallback without MCP:**
- Keyword-based matching
- Lower confidence scores
- More reliance on subagent analysis

---

## Subagent Coordination

For large codebases, coordinate multiple subagents:

**Area Exploration Subagent Prompt:**
```
You are exploring [area path] for the gap-analysis command.

Requirements likely in this area:
[List of requirements with acceptance criteria]

Your task:
1. Read the files in this area
2. For each requirement, determine:
   - Implementation status (implemented/partial/missing)
   - File locations where implemented
   - Which acceptance criteria are met/missing
   - Confidence level (0-100)

3. Also identify any significant features NOT in the requirements list
   - These are potential "extras" (undocumented features)

Output your findings as structured JSON.
```

**Coordination Flow:**
```
Main Agent
    ├── Generate crawl plan
    ├── Spawn Area Subagent 1 → src/auth/
    ├── Spawn Area Subagent 2 → src/api/
    ├── Spawn Area Subagent 3 → src/services/
    ├── Collect results
    ├── Cross-validate with semantic matching
    └── Generate report
```

---

## Integration Points

### Before Gap Analysis
- `/siftcoder:understand` - Better matching with prior knowledge
- Ensure spec is up to date

### After Finding Gaps
- `/siftcoder:add-feature` - Implement missing features
- `/siftcoder:fix` - Complete partial implementations
- `/siftcoder:reverse-spec` - Document extras

### Continuous Tracking
- Re-run after changes to track improvement
- Store history in `gap-analysis/history/`
- Show coverage trend over time

---

## Quality Guidelines

1. **Accuracy over Speed**
   - Better to flag uncertain matches for review
   - Provide evidence for conclusions

2. **Prioritize Critical Gaps**
   - Security features first
   - Core functionality second
   - Enhancements last

3. **Actionable Output**
   - Every gap should have suggested action
   - Link to specific siftcoder commands

4. **Conservative Matching**
   - When uncertain, mark as "partial" not "implemented"
   - Explain what's missing or unclear

5. **Context Efficiency**
   - Don't read entire codebase at once
   - Use crawl plan to focus exploration
   - Leverage subagents for parallel work

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Gap detection patterns
- Analysis workflows
- Integration guidelines

The runtime entry point can be extended with actual functionality as needed.

## Tools Used
- Read, Glob, Grep - File exploration
- Task - Subagent coordination
- Write - Store intermediate results
- siftcoder-mcp tools (if available) - Semantic matching
