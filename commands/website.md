---
description: Build beautiful, modern websites from your codebase or from scratch
argument-hint: <website-type> [options]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion
---

# /siftcoder:website - Build Beautiful Websites

Building website: **$ARGUMENTS**

## Overview

The website builder creates beautiful, modern websites that stay synchronized with your codebase. Choose from four website types:

- **Documentation** - Auto-generated API docs, guides, and references
- **Admin Dashboard** - CRUD interfaces, analytics, and management UIs
- **Marketing/Landing** - Product showcases, features, and conversion pages
- **Portfolio/Showcase** - Project galleries, case studies, and demos

## Usage

```
/siftcoder:website <type>                    # Build with interactive setup
/siftcoder:website docs                      # Build documentation site
/siftcoder:website admin                     # Build admin dashboard
/siftcoder:website marketing                 # Build marketing site
/siftcoder:website portfolio                 # Build portfolio site
```

## Workflow

### Phase 1: Interactive Setup

If no arguments provided, guide user through:

1. **Website Type Selection**
   - Analyze codebase and recommend type
   - User confirms or selects different type
   - Support multi-type combinations (e.g., docs + admin)

2. **Framework Selection**
   - Detect existing framework from codebase
   - Present options: Next.js, Nuxt, SvelteKit
   - Recommend based on project type and user preference

3. **Styling Preferences**
   - Color scheme (light, dark, auto)
   - Typography system
   - Layout preferences
   - Component library: shadcn/ui (default) or custom

4. **Feature Selection**
   - Search functionality
   - Analytics integration
   - Authentication UI
   - Blog/news section
   - Contact forms
   - Version management (for docs)

5. **Deployment Options**
   - Vercel (recommended for Next.js)
   - Netlify
   - Cloudflare Pages
   - GitHub Pages
   - Custom hosting

### Phase 2: Codebase Analysis

Analyze the codebase to inform website generation:

```
Analyzing codebase...
├── Project Structure
│   ├── Framework detected: [Next.js/Vue/Svelte/None]
│   ├── Components found: [count]
│   ├── Services/APIs found: [count]
│   └── Documentation found: [README, docs/, comments]
│
├── API Detection
│   ├── REST endpoints: [count]
│   ├── GraphQL schemas: [count]
│   └── WebSocket endpoints: [count]
│
├── Data Models
│   ├── TypeScript interfaces: [count]
│   ├── Database schemas: [count]
│   └── DTOs/types: [count]
│
└── Content Assets
    ├── Images: [count]
    ├── Markdown files: [count]
    └── Example code: [count]
```

Use the **website-builder** skill to analyze:
- Project structure and patterns
- Existing components and props
- API endpoints and data models
- Documentation and comments
- Dependencies and configurations

### Phase 3: Website Generation

Generate website using templates and analysis:

1. **Select Template**
   - Load framework-specific template for website type
   - Customize based on codebase analysis
   - Apply user preferences

2. **Generate Content**
   - **Documentation**: Extract API docs from TypeScript types, generate guides from README
   - **Admin**: Create CRUD UIs from data models, build dashboards from APIs
   - **Marketing**: Create hero/features from project description, add testimonials
   - **Portfolio**: Showcase projects from codebase, create about section

3. **Customize Components**
   - Use shadcn/ui component library
   - Apply Tailwind CSS styling
   - Configure theme and colors
   - Add branding (logo, favicon)

4. **Configure Build**
   - Set up build scripts
   - Configure TypeScript
   - Set up ESLint/Prettier
   - Add testing framework

### Phase 4: Synchronization Setup

Set up ongoing synchronization between codebase and website:

1. **Initial Sync**
   - Map codebase elements to website sections
   - Generate API documentation
   - Create admin interfaces for data models
   - Index content for search

2. **Sync Configuration**
   - Choose sync mode (auto, semi-auto, manual)
   - Set up change detection
   - Configure sync triggers (git commit, manual, scheduled)
   - Define sync strategies per website type

3. **Bridge Integration**
   - Use bridge-analyzer to detect gaps
   - Create integration specifications
   - Set up API bridges if needed
   - Configure webhooks for updates

### Phase 5: Preview & Refine

Allow user to preview and refine before final build:

1. **Start Preview**
   ```bash
   cd <generated-website>
   npm install
   npm run dev
   ```

2. **Refinement Loop**
   - User requests changes
   - Apply modifications
   - Preview again
   - Continue until satisfied

3. **Approval**
   - User approves final version
   - Generate production build
   - Deploy to selected platform

### Phase 6: Deployment

Deploy website based on selected platform:

**Vercel**
```bash
vercel link
vercel --prod
```

**Netlify**
```bash
netlify init
netlify deploy --prod
```

**Cloudflare Pages**
```bash
wrangler pages publish <dist-dir>
```

**GitHub Pages**
- Configuration already in template
- Push to trigger workflow

## Website Types

### Documentation Site

Best for: Open source projects, API references, technical guides

**Features:**
- Auto-generated API documentation from TypeScript types
- Sidebar navigation with nested sections
- Full-text search (Fuse.js or Algolia)
- Code syntax highlighting
- Table of contents
- Version selector
- Previous/next navigation
- MDX support for interactive examples
- Edit on GitHub links

**Generated Content:**
- API reference from type definitions
- Getting started guide from README
- Component documentation from props
- Usage examples from code comments

**Sync Strategy:**
- Auto-sync: Code changes → API docs update
- Manual review: Content changes
- Versioning: Track documentation versions

**Example:**
```
/siftcoder:website docs
→ Generates docs.yourproject.com
→ Auto-updates API docs when types change
→ Searchable, navigable documentation
```

### Admin Dashboard

Best for: SaaS apps, internal tools, data management

**Features:**
- Data tables with sorting/filtering/pagination
- Charts and graphs (Recharts/Chart.js)
- Forms with validation
- Authentication pages (login, register, forgot password)
- Role-based access control UI
- Dashboard widgets (stats, cards, activity feeds)
- Notification system
- Settings pages
- User management

**Generated Content:**
- CRUD UIs from data models
- Dashboard from API endpoints
- Forms based on validation schemas
- Analytics from data patterns

**Sync Strategy:**
- Auto-sync: Model changes → Form updates
- Auto-sync: API changes → Dashboard updates
- Semi-auto: New features require review

**Example:**
```
/siftcoder:website admin
→ Generates admin.yourapp.com
→ Auto-generates CRUD interfaces
→ Real-time dashboard from APIs
```

### Marketing/Landing Site

Best for: Products, startups, campaigns

**Features:**
- Hero section with headline and CTA
- Features grid with icons
- Testimonials carousel
- Pricing tables
- FAQ accordion
- Blog/news section
- Newsletter signup
- Contact form
- SEO optimization
- Social sharing

**Generated Content:**
- Hero from project description
- Features from capabilities
- Pricing from plans (if detected)
- About from README/team info

**Sync Strategy:**
- Manual review: Most changes
- Auto-sync: Version numbers, pricing
- Semi-auto: Feature updates

**Example:**
```
/siftcoder:website marketing
→ Generates yourproduct.com
→ Beautiful landing page
→ SEO optimized
```

### Portfolio/Showcase

Best for: Developers, agencies, project showcases

**Features:**
- Project showcase grid
- Project detail pages
- About section
- Skills/technologies grid
- Experience timeline
- Education section
- Contact form
- Blog/writing section
- Resume download
- Social links
- Dark/light mode toggle

**Generated Content:**
- Projects from codebase repositories
- Skills from package.json dependencies
- Experience from commit history/README
- About from bio/description

**Sync Strategy:**
- Auto-sync: New projects → Showcase
- Auto-sync: Commit history → Timeline
- Manual review: About, bio

**Example:**
```
/siftcoder:website portfolio
→ Generates yourname.dev
→ Showcases your projects
→ Auto-updates with new work
```

## Framework Support

### Next.js (Recommended)

**Best for:**
- Marketing sites (SEO, performance)
- Documentation (App Router, SSG)
- Admin dashboards (React ecosystem)

**Features:**
- App Router with React Server Components
- Server-side rendering
- Static site generation
- API routes
- Excellent Vercel integration

**Template Locations:**
- `sift-coder/templates/website/nextjs-docs/`
- `sift-coder/templates/website/nextjs-admin/`
- `sift-coder/templates/website/nextjs-marketing/`
- `sift-coder/templates/website/nextjs-portfolio/`

### Nuxt (Vue)

**Best for:**
- Vue.js projects
- Documentation sites
- Admin panels

**Features:**
- Nuxt 3 with Composition API
- Server-side rendering
- File-based routing
- Auto-imports
- Nuxt UI components

**Template Locations:**
- `sift-coder/templates/website/nuxt-docs/`
- `sift-coder/templates/website/nuxt-admin/`

### SvelteKit

**Best for:**
- Performance-critical apps
- Interactive websites
- Small bundle size

**Features:**
- Svelte 5 with runes
- Server-side rendering
- File-based routing
- Built-in state management
- Skeleton UI components

**Template Locations:**
- `sift-coder/templates/website/sveltekit-docs/`
- `sift-coder/templates/website/sveltekit-admin/`

## Synchronization

### Sync Modes

**Auto**
- Documentation: Code changes auto-update docs
- Admin: Model changes auto-update forms
- Portfolio: New projects auto-appear

**Semi-Auto**
- Marketing: Feature changes prompt for review
- Admin: New APIs prompt for dashboard updates

**Manual**
- Content changes require explicit approval
- Breaking changes require manual intervention

### Sync Triggers

1. **Git Commit**
   - Analyze changed files
   - Update relevant website sections
   - Commit website changes

2. **Manual Trigger**
   ```bash
   /siftcoder:website sync
   ```

3. **Scheduled**
   - Nightly sync for documentation
   - Weekly sync for portfolios

4. **Webhook**
   - Deploy on push to main
   - Update docs on release

### Sync Commands

```
/siftcoder:website sync                 # Sync all changes
/siftcoder:website sync --docs          # Sync documentation only
/siftcoder:website sync --admin         # Sync admin dashboard only
/siftcoder:website sync status          # Check sync status
```

## Integration with Other Commands

**bridge** - Analyze gaps between codebase and website
```
/siftcoder:bridge <codebase> <website>
→ Identifies missing website features
→ Generates integration specs
```

**document** - Generate documentation for website
```
/siftcoder:document code
→ Auto-generates content for docs site
```

**features** - List features to showcase
```
/siftcoder:features
→ Provides feature list for marketing site
```

**test** - Test generated website
```
/siftcoder:test <website-path>
→ Runs E2E tests on website
```

## Quality Assurance

All generated websites include:

**Testing**
- Component tests (Vitest)
- E2E tests (Playwright)
- Accessibility tests (axe-core)
- Visual regression tests

**Code Quality**
- ESLint configuration
- Prettier formatting
- TypeScript strict mode
- Pre-commit hooks

**Performance**
- Lighthouse CI integration
- Image optimization
- Code splitting
- Lazy loading

**SEO** (for marketing/docs)
- Meta tags
- Structured data
- Sitemap generation
- Robots.txt

## State Management

Website projects tracked in:
- `.claude/siftcoder-state/website-projects.json`
- `.claude/siftcoder-state/website-templates.json`

State includes:
- Project metadata (name, type, framework, status)
- Sync configuration
- Deployment settings
- Build history

## Examples

**Example 1: Documentation Site from TypeScript Project**
```bash
/siftcoder:website docs
→ Analyzes codebase
→ Detects Next.js, uses Next.js template
→ Generates API docs from types
→ Creates guides from README
→ Deploys to Vercel
```

**Example 2: Admin Dashboard for SaaS App**
```bash
/siftcoder:website admin
→ Analyzes data models
→ Creates CRUD UIs
→ Builds dashboard from APIs
→ Adds authentication UI
→ Deploys to Netlify
```

**Example 3: Marketing Site for Product**
```bash
/siftcoder:website marketing
→ Extracts product info from README
→ Creates landing page with hero, features, pricing
→ Adds SEO optimization
→ Deploys to Vercel
```

**Example 4: Portfolio for Developer**
```bash
/siftcoder:website portfolio
→ Scans repositories for projects
→ Creates project showcase
→ Builds experience timeline from commits
→ Adds skills from tech stack
→ Deploys to GitHub Pages
```

**Example 5: Sync Existing Website**
```bash
/siftcoder:website sync
→ Detects codebase changes
→ Updates website accordingly
→ Runs tests
→ Deploys if tests pass
```

## Tips & Hints

```
BEFORE BUILDING

New project?
  → Ensure you have a README.md
  → Add JSDoc comments to APIs
  → Use TypeScript types

Have an existing website?
  → /siftcoder:bridge <codebase> <website>
  → Analyze gaps first
  → Then build new or sync

DURING BUILD

Choose framework wisely:
  → Next.js for SEO/SSR (docs, marketing)
  → Nuxt for Vue projects
  → SvelteKit for performance

Enable sync for:
  → Documentation (keep API docs current)
  → Admin dashboards (sync with data models)
  → Portfolios (auto-add new projects)

AFTER BUILDING

Test locally:
  → npm run dev
  → Check all pages
  → Test responsive design
  → Run lighthouse

Deploy with confidence:
  → Tests run automatically
  → Quality gates passed
  → SEO optimized (if applicable)

Keep synchronized:
  → /siftcoder:website sync
  → Set up webhooks
  → Enable auto-sync for docs

CUSTOMIZATION

Want to customize?
  → Templates are fully editable
  → Add custom components
  → Modify layouts
  → Update styling

Need advanced features?
  → Add authentication (Auth.js, Clerk)
  → Add analytics (Vercel Analytics, Plausible)
  → Add CMS (Sanity, Contentful)
  → Add search (Algolia, Orama)
```

## Now: Start Building

If website type provided, begin analysis and generation.
If no arguments, start interactive setup.

Use AskUserQuestion for:
- Website type selection
- Framework selection
- Styling preferences
- Feature selection
- Deployment options

Proceed with website generation...
