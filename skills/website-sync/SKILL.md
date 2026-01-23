# Website Sync Skill

Keep generated websites synchronized with codebase changes.

## Capabilities

- **Change Detection** - Detect API, component, documentation, and model changes
- **Smart Mapping** - Map codebase changes to website updates
- **Sync Strategies** - Auto, semi-auto, and manual sync modes per website type
- **Bridge Integration** - Work with bridge-analyzer to detect gaps

## Sync Modes

### Auto
Changes are automatically applied to the website without manual review.

**Best for:**
- API documentation updates
- Type definition changes
- Routine documentation syncs

**Used by:**
- Documentation sites (API docs, type refs)
- Admin dashboards (model changes)

### Semi-Auto
Changes are detected and presented for review before applying.

**Best for:**
- New feature integration
- Dashboard updates from API changes
- Component showcase updates

**Used by:**
- Admin dashboards (new APIs)
- Portfolio sites (new projects)

### Manual
Changes require explicit approval before any action.

**Best for:**
- Content changes
- Breaking changes
- Major updates

**Used by:**
- Marketing sites (most changes)
- Portfolio sites (content updates)

## Website Type Strategies

### Documentation Sites

**Default Mode:** Auto

**Sync Rules:**
- API changes → Auto-update API docs
- Type changes → Auto-update type references
- Documentation changes → Auto-update content
- Component changes → Auto-update component docs
- Breaking changes → Manual review required

**Example:**
```typescript
// Codebase change: Updated User interface
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user"; // Added
}

// Auto-synced to:
// docs/reference/user.mdx - Updated type docs
```

### Admin Dashboards

**Default Mode:** Semi-Auto

**Sync Rules:**
- Model changes → Auto-update forms and tables
- API changes → Review required for dashboard updates
- New endpoints → Review and possibly add widgets
- Breaking changes → Manual review required

**Example:**
```typescript
// Codebase change: Added Product model
interface Product {
  id: string;
  name: string;
  price: number;
}

// Synced to:
// app/products/page.tsx - CRUD page (auto)
// app/dashboard/page.tsx - Product widget (review)
```

### Marketing Sites

**Default Mode:** Manual

**Sync Rules:**
- Version changes → Auto-update version numbers
- Feature additions → Manual review for feature showcase
- README changes → Review if homepage needs updates
- Pricing changes → Review pricing page

**Example:**
```typescript
// Codebase change: New feature added
// Codebase now has analytics feature

// Sync action:
// Review if analytics should be featured on homepage
// Update features section if approved
```

### Portfolio Sites

**Default Mode:** Semi-Auto

**Sync Rules:**
- New repositories → Auto-add to project showcase
- Commit activity → Auto-update timeline
- README changes → Manual review for project descriptions
- New skills/tech → Review skills section

**Example:**
```typescript
// Codebase change: New project pushed to GitHub
// Repository: my-awesome-project

// Auto-synced to:
// app/projects/page.tsx - Added to showcase
// Data fetched from GitHub API
```

## Integration with Bridge Analyzer

The website-sync skill works with bridge-analyzer to:

1. **Detect Gaps**
   - Identify missing website features for new codebase features
   - Find outdated website content
   - Locate broken links or references

2. **Generate Bridge Specs**
   - Create integration specifications for missing connections
   - Define data flows between codebase and website
   - Specify API endpoints needed

3. **Validate Sync Completeness**
   - Ensure all codebase changes are reflected in website
   - Check for orphaned website content
   - Verify data consistency

## Usage

### Manual Sync

```bash
# Sync all changes
/siftcoder:website sync

# Sync specific type
/siftcoder:website sync --docs

# Check sync status
/siftcoder:website sync status
```

### Programmatic Sync

```typescript
import { syncChanges, getSyncStrategy } from "website-sync";

// Get sync strategy for website type
const strategy = getSyncStrategy("documentation");
// { defaultMode: "auto", strategies: {...} }

// Sync changes
const result = await syncChanges(
  "./my-project",
  "./my-docs-site",
  "documentation",
  "auto"
);

console.log(result.message);
// "Sync complete: 5 applied, 2 pending review"
```

## Change Detection

The sync skill detects changes by monitoring:

### API Changes
- Route files in `api/`, `routes/`, `controllers/`
- Endpoint additions, modifications, deletions
- Request/response type changes

### Component Changes
- Component files in `components/`
- Prop changes
- New components
- Component removals

### Documentation Changes
- README.md, CHANGELOG.md
- docs/ folder contents
- Comment changes in code

### Model Changes
- Type definitions in `types/`, `models/`
- Interface changes
- Schema modifications

### Content Changes
- Asset additions/removals
- Configuration updates
- New files/folders

## Sync Actions

For each detected change, the sync skill determines an action:

### Update
Modify existing website content to reflect codebase changes.

**Example:**
```typescript
// Change: API endpoint signature updated
// Action: Update API documentation page
{
  action: "update",
  target: "docs/api/users.mdx",
  description: "Update API docs for users endpoint",
  autoApply: true
}
```

### Create
Generate new website content for new codebase elements.

**Example:**
```typescript
// Change: New data model added
// Action: Create CRUD page for model
{
  action: "create",
  target: "app/products/page.tsx",
  description: "Create CRUD page for Product model",
  autoApply: true
}
```

### Delete
Remove website content for deleted codebase elements.

**Example:**
```typescript
// Change: Component removed
// Action: Remove component documentation
{
  action: "delete",
  target: "docs/components/old-button.mdx",
  description: "Remove documentation for deleted component",
  autoApply: false  // Requires review
}
```

### Review
Flag changes that need manual review before action.

**Example:**
```typescript
// Change: Major README update
// Action: Review if homepage needs updates
{
  action: "review",
  target: "app/page.tsx",
  description: "Review if homepage needs updates from README",
  autoApply: false
}
```

## Configuration

### Sync Configuration File

Create `siftcoder-sync.config.json` in your project root:

```json
{
  "projectPath": "./my-project",
  "websitePath": "./my-website",
  "websiteType": "documentation",
  "syncMode": "auto",
  "syncTriggers": ["git-commit", "manual"],
  "excludePatterns": ["node_modules", ".git", "dist"],
  "strategies": {
    "api": "auto",
    "component": "auto",
    "docs": "auto",
    "model": "auto",
    "content": "manual"
  }
}
```

### Sync Triggers

Configure when sync runs:

- **git-commit** - Run sync after every commit
- **manual** - Run sync only when triggered
- **scheduled** - Run sync on schedule (cron)
- **webhook** - Run sync on webhook trigger

### Exclusion Patterns

Specify files/folders to ignore:

```json
{
  "excludePatterns": [
    "node_modules/**",
    ".git/**",
    "dist/**",
    "build/**",
    "*.test.ts",
    "*.spec.ts"
  ]
}
```

## Best Practices

### Documentation Sites
- Use auto-sync for API and type changes
- Set up git-commit trigger for continuous updates
- Review sync results periodically
- Keep documentation comments up to date

### Admin Dashboards
- Use semi-auto for balance of automation and control
- Review new API integrations before adding to dashboard
- Test generated forms after model changes
- Monitor sync for breaking changes

### Marketing Sites
- Use manual sync for content control
- Review and approve all changes
- Schedule sync reviews weekly
- Test after each sync

### Portfolio Sites
- Use semi-auto for project additions
- Review new project showcases
- Keep project metadata updated
- Sync commit activity weekly

## Troubleshooting

**Sync Not Detecting Changes**
- Check sync configuration paths
- Verify file patterns match your structure
- Review exclusion patterns

**Too Many Changes Pending**
- Adjust sync mode from manual to semi-auto or auto
- Review sync strategy settings
- Consider more granular sync configuration

**Sync Breaking Website**
- Switch to manual mode
- Review and test changes before applying
- Use version control to revert
- Check for breaking changes in codebase

**Performance Issues**
- Add more exclusion patterns
- Use scheduled sync instead of git-commit
- Optimize change detection frequency
- Consider incremental sync

## Future Enhancements

- Bidirectional sync (website → codebase)
- Conflict resolution strategies
- Sync rollback capabilities
- Sync history and analytics
- Advanced diff visualization
- Webhook integrations (GitHub, GitLab)
- Team collaboration features
- Sync approval workflows
