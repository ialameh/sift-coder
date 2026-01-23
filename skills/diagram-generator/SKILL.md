# Diagram Generator Skill

Generate visual documentation including Mermaid diagrams, code maps, and architecture visualizations.

## Description

This skill generates visual representations of code structure, architecture, and data flows. Outputs include Mermaid diagram source and optionally rendered SVG files.

## When to Use

Invoke this skill when:
- `/siftcoder:document architecture` is executed
- User requests code maps or diagrams
- Visualizing dependencies or data flows
- Creating documentation with visual aids

## Instructions

You are a diagram generator. Your job is to analyze code and produce clear, informative diagrams.

### Diagram Types

1. **Module Dependency Graph**
   Shows how modules/packages depend on each other.

2. **Component Hierarchy**
   Tree structure of UI components (React, Vue, etc.)

3. **Data Flow Diagram**
   How data moves through the application.

4. **Database Schema**
   Entity relationships (if database models exist).

5. **API Endpoint Map**
   REST/GraphQL endpoints and their relationships.

6. **Sequence Diagram**
   Request/response flows for specific operations.

7. **State Machine**
   State transitions (if state machines are used).

### Generation Process

1. **Analyze Target**
   ```
   Analyzing codebase for diagram generation...

   Found:
   ├── 12 modules in src/
   ├── 24 React components
   ├── 8 API endpoints
   ├── 6 database models
   └── 3 state machines
   ```

2. **Generate Appropriate Diagrams**

### Diagram Templates

#### Module Dependency Graph
```mermaid
graph TD
    subgraph Presentation
        A[Components]
        B[Pages]
        C[Hooks]
    end

    subgraph Application
        D[Services]
        E[Use Cases]
    end

    subgraph Infrastructure
        F[Repositories]
        G[API Clients]
    end

    A --> C
    B --> A
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
```

#### Component Hierarchy
```mermaid
graph TD
    App --> Layout
    Layout --> Header
    Layout --> Sidebar
    Layout --> Main
    Main --> Dashboard
    Main --> UserProfile
    Main --> Settings
    Dashboard --> StatCard
    Dashboard --> Chart
    Dashboard --> RecentActivity
```

#### Data Flow
```mermaid
flowchart LR
    User -->|Action| Component
    Component -->|Dispatch| Store
    Store -->|API Call| Service
    Service -->|HTTP| Backend
    Backend -->|Response| Service
    Service -->|Update| Store
    Store -->|State| Component
    Component -->|Render| User
```

#### Database Schema (ERD)
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        string id PK
        string email
        string name
        datetime createdAt
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        string id PK
        string userId FK
        decimal total
        string status
        datetime createdAt
    }
    ORDER_ITEM }|--|| PRODUCT : references
    ORDER_ITEM {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        decimal price
    }
    PRODUCT {
        string id PK
        string name
        decimal price
        string category
    }
```

#### API Endpoint Map
```mermaid
graph LR
    subgraph Auth
        POST_login[POST /auth/login]
        POST_register[POST /auth/register]
        POST_logout[POST /auth/logout]
    end

    subgraph Users
        GET_users[GET /users]
        GET_user[GET /users/:id]
        PUT_user[PUT /users/:id]
    end

    subgraph Orders
        GET_orders[GET /orders]
        POST_order[POST /orders]
        GET_order[GET /orders/:id]
    end
```

#### Sequence Diagram
```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as API
    participant D as Database

    U->>C: Click Login
    C->>A: POST /auth/login
    A->>D: Query user
    D-->>A: User data
    A->>A: Verify password
    A->>A: Generate JWT
    A-->>C: Token + User
    C->>C: Store token
    C-->>U: Redirect to dashboard
```

#### State Machine
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: FETCH
    Loading --> Success: RESOLVE
    Loading --> Error: REJECT
    Success --> Idle: RESET
    Error --> Loading: RETRY
    Error --> Idle: RESET
```

### Output Structure

Save diagrams to `.claude/siftcoder-state/diagrams/`:
```
diagrams/
├── architecture.mmd           # Module dependency
├── components.mmd             # Component hierarchy
├── data-flow.mmd              # Data flow
├── database-schema.mmd        # ERD
├── api-map.mmd                # API endpoints
└── README.md                  # Index of diagrams
```

### Output Format

Return diagram summary:
```json
{
  "generated": [
    {
      "type": "module-dependency",
      "file": "diagrams/architecture.mmd",
      "description": "Module dependency graph showing 12 modules"
    },
    {
      "type": "component-hierarchy",
      "file": "diagrams/components.mmd",
      "description": "React component tree with 24 components"
    }
  ],
  "summary": "Generated 5 diagrams documenting project architecture"
}
```

### ContextDigger Integration

If ContextDigger is available, use its enhanced capabilities:
```bash
# Check for ContextDigger
if command -v contextdigger &> /dev/null; then
    # Use ContextDigger's render command for enhanced diagrams
    contextdigger render --format mermaid --output diagrams/
fi
```

ContextDigger provides:
- Automatic area discovery
- Cohesion/coupling metrics
- Governance visualization
- More accurate dependency detection

### Rendering to SVG

If Mermaid CLI is available:
```bash
npx -y @mermaid-js/mermaid-cli mmdc -i input.mmd -o output.svg
```

Otherwise, provide instructions:
```
💡 To render diagrams to SVG:

Option 1: Mermaid CLI
  npm install -g @mermaid-js/mermaid-cli
  mmdc -i diagrams/architecture.mmd -o diagrams/architecture.svg

Option 2: VS Code Extension
  Install "Mermaid Preview" extension

Option 3: Online
  Paste into https://mermaid.live/
```

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- Diagram generation patterns
- Mermaid templates
- Integration guidelines

The runtime entry point can be extended with actual functionality as needed.

## Allowed Tools
Read, Write, Bash, Glob, Grep
