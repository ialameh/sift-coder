# Website Builder Skill

Build beautiful, modern websites from your codebase or from scratch.

## Capabilities

### Website Types

- **Documentation** - Auto-generated API docs, guides, and references
- **Admin Dashboard** - CRUD interfaces, analytics, and management UIs
- **Marketing/Landing** - Product showcases, features, and conversion pages
- **Portfolio/Showcase** - Project galleries, case studies, and demos

### Framework Support

- **Next.js** - Best for SEO, performance, and React ecosystem
- **Nuxt** - Vue.js meta-framework with excellent DX
- **SvelteKit** - High performance with small bundles

### Key Features

- Smart codebase analysis
- Framework detection and recommendation
- Beautiful shadcn/ui components
- Tailwind CSS styling
- Deployment configuration
- Synchronization support

## Invocation

The website builder skill is invoked through the `/siftcoder:website` command:

```bash
/siftcoder:website <type>              # Build specific type
/siftcoder:website docs                # Build documentation site
/siftcoder:website admin               # Build admin dashboard
/siftcoder:website marketing           # Build marketing site
/siftcoder:website portfolio           # Build portfolio site
```

## Process

### 1. Codebase Analysis

The skill analyzes the codebase to understand:

```
Analyzing codebase...
├── Framework Detection
│   ├── package.json dependencies
│   ├── Config files (next.config.js, nuxt.config.js, etc.)
│   └── File structure patterns
│
├── Component Detection
│   ├── React/Vue/Svelte components
│   ├── Component props and interfaces
│   └── Component relationships
│
├── API Detection
│   ├── REST endpoints (Express, Fastify, etc.)
│   ├── GraphQL schemas
│   └── API route patterns
│
├── Data Model Detection
│   ├── TypeScript interfaces/types
│   ├── Database schemas
│   ├── ORM models (Prisma, TypeORM, etc.)
│   └── DTOs and validation schemas
│
└── Documentation Detection
    ├── README.md
    ├── docs/ folders
    ├── JSDoc/TSDoc comments
    └── Markdown files
```

### 2. Type Recommendation

Based on the analysis, the skill recommends the most suitable website type:

**Documentation Site** - Recommended when:
- README.md or docs/ folder found
- TypeScript interfaces/types detected
- API endpoints present
- Library/component library detected

**Admin Dashboard** - Recommended when:
- Multiple data models detected
- REST/GraphQL APIs found
- CRUD operations needed
- SaaS or internal tool patterns

**Marketing Site** - Recommended when:
- Product/project description found
- General project structure
- No specific patterns indicating other types
- Startup or product context

**Portfolio Site** - Recommended when:
- Multiple components or projects
- GitHub repositories
- Developer/agency context
- Showcase patterns detected

### 3. Framework Selection

The skill selects the optimal framework:

**Existing Framework** - Always match if detected:
```
Found Next.js → Use Next.js template
Found Nuxt → Use Nuxt template
Found SvelteKit → Use SvelteKit template
```

**No Framework** - Recommend based on use case:
```
Documentation → Next.js (best SEO)
Admin Dashboard → Next.js or Nuxt
Marketing → Next.js (SSR for SEO)
Portfolio → Next.js or SvelteKit
```

### 4. Website Generation

The skill generates the website using templates:

1. **Load Template**
   - Framework-specific template
   - Website-type-specific content
   - shadcn/ui component library

2. **Customize Template**
   - Apply codebase analysis
   - Inject project metadata
   - Generate API documentation
   - Create components from data models

3. **Configure Build**
   - Set up package.json
   - Configure TypeScript
   - Add ESLint/Prettier
   - Configure Tailwind CSS
   - Set up testing

4. **Generate Deployment Config**
   - Vercel (vercel.json)
   - Netlify (netlify.toml)
   - Cloudflare Pages (wrangler.toml)
   - GitHub Pages (workflow)

### 5. Synchronization Setup

The skill sets up ongoing synchronization:

**Sync Mode Selection**
- **Auto** - Documentation, certain admin updates
- **Semi-Auto** - Marketing content, new features
- **Manual** - Breaking changes, major updates

**Sync Configuration**
- Change detection hooks
- Trigger configuration (git, webhook, scheduled)
- Sync strategies per content type
- Rollback capabilities

## Output Format

### Analysis Output

```json
{
  "success": true,
  "analysis": {
    "framework": "nextjs",
    "language": "TypeScript",
    "components": 15,
    "apis": 8,
    "dataModels": 5,
    "documentation": true,
    "features": ["REST API", "Data models", "Pages/Routes"],
    "recommendedType": "documentation",
    "recommendedFramework": "nextjs"
  }
}
```

### Recommendation Output

```json
{
  "recommended": "documentation",
  "confidence": 0.9,
  "reasoning": "Found README.md and docs/ folder with TypeScript types - ideal for documentation site",
  "alternatives": [
    {"type": "portfolio", "reason": "Can showcase project alongside docs"}
  ]
}
```

### Build Output

```json
{
  "success": true,
  "message": "Website built successfully!",
  "websitePath": "./docs-website",
  "steps": [
    "✓ Options validated",
    "✓ Template loaded",
    "✓ Website generated",
    "✓ Build configured",
    "✓ Dependencies installed",
    "✓ Deployment configured"
  ],
  "nextSteps": [
    "cd docs-website",
    "npm run dev",
    "# Open http://localhost:3000"
  ]
}
```

### Component Generation Output

```json
{
  "success": true,
  "components": [
    "Sidebar navigation",
    "Search bar",
    "API documentation pages",
    "Code syntax highlighting",
    "Table of contents",
    "MDX support",
    "Version selector"
  ],
  "message": "Generated 7 components for documentation website"
}
```

## Integration with Other Skills

### pattern-detector

The website-builder skill integrates with pattern-detector to:
- Detect coding patterns in the codebase
- Match website style to codebase conventions
- Maintain consistency between code and website

```typescript
// Pattern detection informs:
// - Component structure
// - Naming conventions
// - Code style in examples
// - Documentation patterns
```

### spec-analyzer

Integration with spec-analyzer to:
- Extract features from specifications
- Generate website content from specs
- Create documentation from requirements

### bridge-analyzer

Integration with bridge-analyzer to:
- Detect gaps between codebase and website
- Create integration specifications
- Ensure complete synchronization

### documenter

Integration with documenter to:
- Auto-generate documentation content
- Create API reference docs
- Generate guides and tutorials

## Website Type Details

### Documentation Site

**Generated Components:**
- Sidebar navigation
- Search bar (Fuse.js or Algolia)
- API documentation pages
- Code syntax highlighting
- Table of contents
- Previous/next navigation
- Version selector
- MDX support
- Edit on GitHub links

**Content Generation:**
- API docs from TypeScript types/interfaces
- Getting started from README.md
- Component docs from props and JSDoc
- Usage examples from code comments

**Sync Strategy:**
- Auto: Code changes → API docs update
- Auto: Type changes → Reference docs update
- Manual: Guide content changes

### Admin Dashboard

**Generated Components:**
- Dashboard layout
- Data tables (sorting, filtering, pagination)
- Charts and graphs
- CRUD forms
- Validation UI
- Authentication pages
- User management
- Settings pages
- Notifications
- Activity feeds

**Content Generation:**
- CRUD UIs from data models
- Dashboard widgets from API endpoints
- Forms from validation schemas
- Analytics from data patterns

**Sync Strategy:**
- Auto: Model changes → Form updates
- Auto: API changes → Dashboard updates
- Semi-auto: New features → Review required

### Marketing Site

**Generated Components:**
- Hero section
- Features grid
- Testimonials
- Pricing tables
- FAQ accordion
- Blog/news section
- Newsletter signup
- Contact form
- Social sharing

**Content Generation:**
- Hero from project description
- Features from capabilities
- Pricing from plans (if detected)
- About from README/team info

**Sync Strategy:**
- Manual: Most content changes
- Auto: Version numbers, pricing
- Semi-auto: Feature updates

### Portfolio Site

**Generated Components:**
- Project showcase
- Project detail pages
- About section
- Skills grid
- Experience timeline
- Education section
- Contact form
- Blog section
- Resume download
- Social links

**Content Generation:**
- Projects from codebase/repos
- Skills from package.json dependencies
- Experience from commit history
- About from bio/description

**Sync Strategy:**
- Auto: New projects → Showcase
- Auto: Commits → Timeline
- Manual: About, bio content

## Usage Examples

### Example 1: Documentation for TypeScript Project

```bash
/siftcoder:website docs
# Analyzes codebase
# Detects TypeScript, APIs
# Generates API documentation
# Creates navigation and search
# Outputs: ./docs-website
```

### Example 2: Admin Dashboard for SaaS

```bash
/siftcoder:website admin
# Analyzes data models
# Creates CRUD UIs
# Builds dashboard
# Adds authentication
# Outputs: ./admin-dashboard
```

### Example 3: Marketing Site

```bash
/siftcoder:website marketing
# Extracts product info
# Creates landing page
# Adds features, pricing
# SEO optimization
# Outputs: ./marketing-site
```

### Example 4: Portfolio for Developer

```bash
/siftcoder:website portfolio
# Scans repositories
# Creates project showcase
# Builds experience timeline
# Adds skills, education
# Outputs: ./portfolio
```

## Best Practices

### Before Building

- Ensure project has a good README.md
- Add JSDoc/TSDoc comments to APIs
- Use TypeScript for better auto-generated docs
- Organize code with clear structure

### During Build

- Choose framework wisely (Next.js for SEO, Nuxt for Vue, SvelteKit for performance)
- Enable sync for documentation sites
- Consider multi-type combinations (docs + portfolio)
- Review recommendations before accepting

### After Building

- Test locally: `npm run dev`
- Check all pages and routes
- Test responsive design
- Run Lighthouse for performance
- Customize styling and branding

## Troubleshooting

**Framework Not Detected**
- Ensure package.json exists
- Check framework dependencies
- Manually specify framework with options

**Missing Components**
- Verify codebase structure
- Check for components/ folder
- Ensure proper file naming

**Sync Issues**
- Check sync configuration
- Verify webhook setup
- Review change detection rules

**Build Errors**
- Check dependencies: `npm install`
- Verify TypeScript configuration
- Review build logs

## Future Enhancements

- Additional framework support (Astro, Remix)
- More component libraries (MUI, Chakra)
- CMS integration (Sanity, Contentful)
- Advanced analytics (Google Analytics, Plausible)
- Authentication providers (Auth.js, Clerk)
- More deployment platforms (Railway, Fly.io)
- A/B testing integration
- Internationalization (i18n)
- Theme customization UI
