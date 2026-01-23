# UX Analyzer Skill

Analyze user experience patterns, best practices, and accessibility requirements for specific domains and applications.

## Invocation
This skill is invoked by `/siftcoder:ideate` at Level 2+ or can be used standalone.

## Capabilities

### 1. Domain-Specific UX Patterns

**Common Domains & Their UX Requirements:**

#### E-Commerce
```
E-COMMERCE UX ESSENTIALS

Navigation:
├── Category hierarchy (max 3 levels deep)
├── Breadcrumb navigation
├── Persistent search bar
└── Filter/sort capabilities

Product Pages:
├── High-quality images with zoom
├── Clear pricing and availability
├── Size/variant selectors
├── Add to cart without page refresh
├── Related products
└── Customer reviews with photos

Checkout:
├── Guest checkout option (CRITICAL)
├── Progress indicator
├── Order summary visible throughout
├── Multiple payment options
├── Address autocomplete
├── Save for later / wishlist
└── Clear error messages

Trust Signals:
├── Security badges
├── Return policy visible
├── Customer service access
└── Reviews and ratings
```

#### SaaS / Productivity
```
SAAS UX ESSENTIALS

Onboarding:
├── < 3 steps to first value
├── Progress indicators
├── Skip option for experienced users
├── Interactive tutorials (not walls of text)
├── Empty states that guide action
└── Sample data option

Dashboard:
├── Key metrics at a glance
├── Actionable insights
├── Recent activity
├── Quick actions
└── Customizable widgets

Core Workflow:
├── Keyboard shortcuts
├── Undo/redo support
├── Auto-save
├── Inline editing
├── Bulk actions
└── Real-time collaboration indicators

Settings:
├── Searchable settings
├── Grouped by category
├── Preview changes before applying
└── Reset to defaults option
```

#### Mobile Apps
```
MOBILE UX ESSENTIALS

Navigation:
├── Bottom navigation (max 5 items)
├── Thumb-friendly tap targets (44x44pt minimum)
├── Swipe gestures for common actions
├── Pull to refresh
└── Back button behavior consistency

Performance:
├── Skeleton screens (not spinners)
├── Offline capability indication
├── Optimistic UI updates
└── Background sync

Input:
├── Appropriate keyboard types
├── Autofill support
├── Voice input option
├── Scanner for codes/documents
└── Minimal typing required
```

### 2. Accessibility Analysis (WCAG 2.1)

```
ACCESSIBILITY CHECKLIST

Level A (Minimum):
├── [ ] All images have alt text
├── [ ] Videos have captions
├── [ ] Color is not only indicator
├── [ ] Keyboard navigable
├── [ ] No keyboard traps
├── [ ] Page has title
├── [ ] Links have descriptive text
├── [ ] Forms have labels
└── [ ] Error identification

Level AA (Recommended):
├── [ ] 4.5:1 contrast ratio (text)
├── [ ] 3:1 contrast ratio (large text)
├── [ ] Text resizable to 200%
├── [ ] Focus indicator visible
├── [ ] Consistent navigation
├── [ ] Multiple ways to find pages
├── [ ] Headings describe content
└── [ ] Labels near inputs

Level AAA (Enhanced):
├── [ ] 7:1 contrast ratio
├── [ ] Sign language for video
├── [ ] Extended audio description
├── [ ] Reading level consideration
└── [ ] Pronunciation help
```

### 3. Usability Heuristics (Nielsen's 10)

```
USABILITY HEURISTIC ANALYSIS

1. Visibility of System Status
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

2. Match Between System and Real World
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

3. User Control and Freedom
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

4. Consistency and Standards
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

5. Error Prevention
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

6. Recognition Rather Than Recall
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

7. Flexibility and Efficiency of Use
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

8. Aesthetic and Minimalist Design
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

9. Help Users Recognize/Recover from Errors
   ├── Current: [Assessment]
   └── Recommendation: [Improvement]

10. Help and Documentation
    ├── Current: [Assessment]
    └── Recommendation: [Improvement]
```

### 4. UX Feature Recommendations

**Output Format:**
```
UX FEATURE RECOMMENDATIONS

Critical (Must Have):
├── [Feature 1]
│   ├── Problem: [What user pain it solves]
│   ├── Pattern: [Industry standard approach]
│   ├── Implementation: [How to build it]
│   └── Impact: [Expected improvement]
└── [Feature 2]
    └── ...

Important (Should Have):
├── [Feature 1]
│   └── ...
└── [Feature 2]

Delightful (Nice to Have):
├── [Micro-interaction 1]
├── [Animation 1]
└── [Personalization feature]
```

### 5. User Flow Analysis

```
USER FLOW ANALYSIS

Primary Flow: [Task Name]
Steps:
1. [Step] → [Success criteria]
2. [Step] → [Success criteria]
3. [Step] → [Success criteria]

Friction Points:
├── Step [X]: [Issue]
│   └── Fix: [Recommendation]
└── Step [Y]: [Issue]
    └── Fix: [Recommendation]

Drop-off Risks:
├── [Where users might abandon]
└── [Mitigation strategy]

Optimization Opportunities:
├── [Reduce steps by...]
├── [Add shortcut for...]
└── [Provide alternative path...]
```

### 6. Responsive Design Requirements

```
RESPONSIVE DESIGN CHECKLIST

Breakpoints:
├── Mobile: 320px - 480px
├── Tablet: 481px - 768px
├── Desktop: 769px - 1024px
└── Large: 1025px+

Per Breakpoint:
├── Navigation transformation
├── Grid/layout adjustments
├── Image sizing/art direction
├── Touch vs hover interactions
├── Typography scaling
└── Component visibility

Mobile-First Priorities:
├── [Critical feature 1]
├── [Critical feature 2]
└── [Feature to hide on mobile]
```

## Analysis Workflow

1. **Identify Domain**
   - Determine application type
   - List core user tasks
   - Identify target devices

2. **Apply Relevant Patterns**
   - Select domain-specific checklist
   - Apply universal heuristics
   - Check accessibility requirements

3. **Gap Analysis**
   - Compare spec to best practices
   - Identify missing UX features
   - Prioritize by impact

4. **Generate Recommendations**
   - Specific, actionable items
   - Reference industry examples
   - Include implementation guidance

## Tools Used
- Read - Analyze specification
- WebSearch - Research UX patterns
- WebFetch - Analyze competitor UX

## Runtime Implementation

This skill includes a minimal `skill.ts` entry point to satisfy plugin requirements.
The primary value remains in this documentation - see sections above for:
- UX analysis patterns
- Domain-specific guidelines
- Accessibility checklists

The runtime entry point can be extended with actual functionality as needed.

## Quality Guidelines

- **Reference established patterns** (Material Design, Human Interface Guidelines)
- **Provide examples** from successful products
- **Consider edge cases** (slow network, errors, empty states)
- **Balance idealism with pragmatism** - prioritize essentials
- **Include accessibility** in all recommendations
