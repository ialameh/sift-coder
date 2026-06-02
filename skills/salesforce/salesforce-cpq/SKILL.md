---
name: salesforce-cpq
description: Use for Salesforce CPQ work — products, price rules, product rules, quote templates, advanced approvals, contracts/amendments/renewals. Migrating to Revenue Cloud — flag if relevant.
paths: '**/*.cls,**/*.trigger,**/*.apex,**/lwc/**,**/aura/**,**/objects/**,**/*.object-meta.xml,sfdx-project.json,**/flows/**,**/flexipages/**,**/permissionsets/**,**/profiles/**'
---

# salesforce-cpq

Salesforce CPQ (formerly Steelbrick). Configure-Price-Quote.

> **Migration note.** CPQ is being subsumed by **Revenue Cloud**. New builds should evaluate Revenue Cloud first. Existing CPQ orgs continue to work; this skill covers both.

## Surfaces

- **Products** — standalone, options, bundles
- **Product features / options** — bundle structure
- **Price rules** — adjust prices based on conditions
- **Product rules** — validation, alert, selection, filter
- **Quote templates** — output document
- **Advanced approvals** — multi-step approval flows
- **Contracts / Amendments / Renewals** — order lifecycle
- **Subscription pricing** — recurring, ramp, evergreen

## Method (typical workflows)

### Add product to bundle

1. Set parent product as bundle (Configurable, Allow Quantity, Pricing Method).
2. Create Product Option records linking child products.
3. Set Min/Max quantity + Required flag.
4. Configure Pricing Method (List vs Block vs Custom Logic).
5. Test in Quote Line Editor.

### Price rule

1. Identify the trigger — field change on Quote Line.
2. Define conditions — when does the rule fire?
3. Define actions — set field values, formulas, summary aggregates.
4. Set evaluation order — Calculator/Configurator/On Save.
5. Test against bundle + standalone scenarios.

### Quote template

1. Sections: Header, Line Items (grouped/ungrouped), Totals, Footer.
2. Templates per region/audience.
3. Template content fields (rich text, merge fields).
4. Conditional sections.
5. Test PDF generation; check pagination.

## Output shape

```
Workflow:    <Bundle | Price Rule | Quote Template | Approval | Amendment>

Configuration:
  Records:    <count + names of metadata records>
  Files:      <metadata XML paths>

Test scenarios:
  - <scenario>: <expected outcome>
  - ...

CPQ-specific limits:
  Lines per quote:    <typical | hard cap>
  Calculation slots:  <impact>
  Calculator job:     <if async — note>

Migration to Revenue Cloud:
  Equivalent surface: <if applicable>
  Effort:             <low | med | high — based on customisation depth>
```

## Rules

- **Calculator order matters.** Price rules have explicit evaluation order — wrong order = wrong totals.
- **Twin Fields** copy values between Quote Line and Product. Use them; don't reinvent via Apex.
- **Product Options use lookups, not master-detail** — sharing is non-trivial.
- **Subscriptions and one-time mix** — verify Subscription Pricing fields on every product.
- **Quote Template is metadata.** Source-control it; don't edit only in Setup.

## Anti-patterns

- Apex triggers on `SBQQ__QuoteLine__c` for things Price Rules can do (CPQ calculator vs trigger order conflicts)
- Hardcoded discount percentages in formulas (use Discount Schedules)
- Quote Templates with all logic in formulas (move to Quote Term records)
- Bundles with > 50 options (perf cliff)

## When NOT to use

- Org doesn't have CPQ licence
- Greenfield revenue work — evaluate Revenue Cloud first
- Simple price book — standard Salesforce Pricebook2 may be enough

## Subagent dispatch

- `salesforce-architect` for capacity + perf review on large quotes
- `apex-bulkifier` for any custom Apex on quote lines
- `Plan` for migration to Revenue Cloud

## Key references

- CPQ Implementation Guide: help.salesforce.com → Salesforce CPQ
- Calculator order: docs detail Configurator → Pre-Calc → Calc → Post-Calc → On Save
- Revenue Cloud migration: help.salesforce.com → Revenue Cloud

## Value over native CC

CC won't naturally know CPQ's calculator pipeline, Twin Field semantics, Discount Schedule patterns, or Bundle Option lookup quirks. Platform-specific knowledge IS the value.
