# LWC

Lightning Web Components are the modern UI layer of Salesforce. They're built on web components, they speak ES modules, and they're an enormous improvement over the Aura predecessor — but they have their own conventions, lifecycle, and a reactivity model that has bitten every engineer who has ever written one.

Two skills cover this area. `lwc` handles building components, scaffolding, and the conventions you should follow. `lwc-debug` is the diagnostic skill — it kicks in when something is rendering wrong, a wire isn't firing, or events aren't propagating.

## What `lwc` does

`/siftcoder:lwc` is the day-to-day skill. Most engineers invoke it implicitly — ask Claude to "build a component that displays the user's open cases with a refresh button" and the skill auto-loads.

Explicit invocations:

- `/siftcoder:lwc create caseList` — scaffolds the component (`.html`, `.js`, `.js-meta.xml`, optional `.css`) plus a Jest test.
- `/siftcoder:lwc wire Account` — generates a wire-adapter pattern with both Apex and LDS examples.
- `/siftcoder:lwc event create caseSelected` — generates the `dispatchEvent` boilerplate plus a parent listener template.
- `/siftcoder:lwc review caseList` — runs the conventions rule set against an existing component.

The skill knows the wire/imperative split, the lifecycle order, the events vs `@api` distinction, and the common state-reactivity pitfalls. It will not let you `track` a primitive (no longer needed), and it will warn when you're doing heavy work in `renderedCallback` (fires every render).

## Wire adapters — the contract you keep forgetting

Wire adapters are reactive subscriptions to Apex methods, LDS records, or framework data sources. The pattern:

```javascript
import { LightningElement, wire } from 'lwc';
import getCases from '@salesforce/apex/CaseController.getCases';

export default class CaseList extends LightningElement {
    @api accountId;

    @wire(getCases, { accountId: '$accountId' })
    wiredCases;
}
```

Three things to internalise:

1. **The `$` prefix is a contract with the framework.** `$accountId` means "watch this field on the component; when it changes, re-fire the wire." Without the `$`, you pass a literal value — `'accountId'` (the string) — and the wire never reacts.

2. **Wires fire when the param has a defined value.** If `accountId` is `undefined` on first render, the wire doesn't fire at all. This is the most common cause of "my wire isn't firing." Either guard with `?? null` (passing null fires the wire with null) or wait for `connectedCallback` to set the value.

3. **`refreshApex` is how you invalidate.** After a DML, calling `refreshApex(this.wiredCases)` re-fetches. Without it, the wire serves cached data forever.

The skill enforces wire handlers that always destructure both branches:

```javascript
@wire(getCases, { accountId: '$accountId' })
wiredCases({ error, data }) {
    if (data) {
        this.cases = data;
        this.error = null;
    } else if (error) {
        this.cases = [];
        this.error = error;
    }
}
```

Forgetting the error branch is the second most common bug.

## Lifecycle order

LWC's lifecycle has six callbacks. They fire in order:

1. `constructor` — the JavaScript constructor. Component is created, but it's not in the DOM, no template, no wires fired yet.
2. `connectedCallback` — component is in the DOM. Public properties (`@api`) are set. Wires fire *after* this.
3. wires fire and resolve.
4. `renderedCallback` — fires after every render. Including re-renders triggered by reactivity. Be careful.
5. `disconnectedCallback` — component leaves the DOM. Clean up subscriptions, timers.
6. `errorBoundaryCallback` — only on parent components, catches errors from descendants.

The pitfall most beginners hit: calling `this.template.querySelector('input')` in `connectedCallback`. The component is *connected* but the template hasn't rendered yet — the query returns null. Move it to `renderedCallback` (and guard with an `_initialized` flag so you don't run the side effect on every re-render).

## Reactivity — what triggers a re-render

A property change triggers re-render if:

- It's an `@api` property assigned from outside.
- It's an `@track`-tracked property (no longer needed for primitives in modern LWC).
- It's a regular field assigned via `=`.

A property change *does not* trigger re-render if:

- You mutate an array (`this.list.push(item)`) or object (`this.obj.x = 1`) without reassigning.

The fix is reassignment with spread:

```javascript
// Wrong
this.cases.push(newCase);

// Right
this.cases = [...this.cases, newCase];
```

The skill flags array/object mutations and rewrites them. It's the kind of bug that produces "my UI isn't updating but the data changed" complaints.

## What `lwc-debug` does

`/siftcoder:lwc-debug` is the diagnostic skill. It runs hypothesis-driven analysis on a component or behaviour. Most useful when you have a working component that's misbehaving in a specific way — wire not firing, event not propagating, style not applying.

It dispatches the `lwc-debugger` agent under the hood, which is read-only and produces a written diagnosis with file:line citations. It will not change your code; once you have the diagnosis, you fix it yourself or with `/siftcoder:fix`.

## Worked example: a wire that won't fire

You have a `caseList` component. It receives an `accountId` from a parent record page. The wire is supposed to fetch open cases for that account. It works fine in your dev sandbox but in UAT it shows the spinner forever.

Step one — invoke the debug skill.

```bash
/siftcoder:lwc-debug "caseList wire not firing in UAT"
```

The skill reads the component, looks at the wire definition, and forms hypotheses:

```
Hypotheses:
  H1 [needs-evidence] — accountId is undefined when wire would fire
  H2 [needs-evidence] — Apex method is failing silently in UAT
  H3 [needs-evidence] — wire definition uses literal 'accountId' instead of '$accountId'
  H4 [needs-evidence] — user lacks Read on Case in UAT (CRUD/FLS)
```

Step two — collect evidence. The skill walks through them in order.

H3 first because it's the cheapest to check. The skill reads `caseList.js`, finds:

```javascript
@wire(getCases, { accountId: '$accountId' })
```

That's correct. H3 ruled out.

H1 next. The skill suggests adding a console log in `connectedCallback`:

```javascript
connectedCallback() {
    console.log('caseList connected, accountId =', this.accountId);
}
```

You deploy the change to UAT, open the record page, look at the console. `accountId = undefined`. The parent record page in UAT is configured differently — it's a Lightning App page, not a Record page, and the `recordId` system property isn't being passed through to your component.

The fix is in the `caseList.js-meta.xml`:

```xml
<targets>
    <target>lightning__RecordPage</target>
    <target>lightning__AppPage</target>
</targets>
<targetConfigs>
    <targetConfig targets="lightning__AppPage">
        <property name="accountId" type="String" />
    </targetConfig>
</targetConfigs>
```

You expose `accountId` as a configurable property on App Pages. The page builder lets the admin bind it to a context variable. The wire fires.

H1 confirmed. H2 and H4 don't need testing. The skill captures the diagnosis and fix to memory. Next time someone hits a "wire not firing" issue on a different component, the prior diagnosis surfaces in retrieval.

## The `lwc-documentation-generator` skill

This one ships with the plugin and is worth flagging because it solves a real headache. `/lwc-documentation-generator` (or the longer `/lwc-doc-gen`) reads an LWC and generates a markdown doc covering:

- What the component does (functional description)
- Inputs (`@api` properties with types and defaults)
- Outputs (events dispatched, with payload shapes)
- Wired data (what Apex methods it calls, what LDS records it reads)
- Events handled (parent-emitted events the component listens for)
- Styling conventions (CSS custom properties used, slots exposed)

Output is a single markdown file you can drop into your team's docs site. The skill is particularly useful for handoffs — when someone leaves the team and you inherit fifteen LWCs you've never seen, run the generator across all of them and you have an inventory by lunchtime.

A variant, `lwc-doc-gen-enhanced`, generates docs *from deployed components* in a sandbox — useful when the source repo doesn't match what's actually running, which is more common than anyone wants to admit.

## Performance

Two patterns the skill enforces because they catch most LWC perf issues:

**Lazy-load heavy children.** Don't render a `lightning-datatable` with 500 rows when the user might never scroll to it. Wrap it in `<template if:true={showDetails}>` and render on demand.

**Stable keys in `for:each`.** When a list re-renders, LWC uses the `key` attribute to figure out which DOM nodes to keep. If your key changes (e.g. it's an index that shifts when you add to the front), the framework throws away and rebuilds every node. Use a stable id, not the index.

The skill flags `for:each` blocks that use `key={index}` and asks for a real id.

## Testing — Jest + LWC

Salesforce ships `@salesforce/sfdx-lwc-jest` for unit testing. The skill scaffolds a test for every component it generates. The pattern:

```javascript
import { createElement } from 'lwc';
import CaseList from 'c/caseList';

describe('c-case-list', () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('renders cases when wire returns data', async () => {
        const element = createElement('c-case-list', { is: CaseList });
        element.accountId = '001000000000001AAA';
        document.body.appendChild(element);

        // ... emit data via wire mock ...
        await Promise.resolve();
        // ... assertions ...
    });
});
```

Mocking wires takes some boilerplate; the skill knows the patterns for both LDS (`registerLdsTestWireAdapter`) and Apex (`createApexTestWireAdapter`).

## Common bugs the skills know

A short list of things the skills will flag without being asked:

- "Cannot assign to read-only property" — assigning to an `@api` property from inside the component.
- Wire fires once with `undefined` then never fires again — the param value never becomes defined; check the parent context.
- Style not applying — selector specificity, or a style trying to cross the shadow DOM boundary (it can't).
- `connectedCallback` runs but `template.querySelector` returns null — DOM not yet rendered; move to `renderedCallback`.
- Event not reaching parent — `composed: true` missing on a CustomEvent that needs to cross a shadow boundary.

## Cross-references

- [Apex patterns](apex-patterns.md) — when an LWC's `@AuraEnabled` Apex needs structure.
- [Security](security.md) — `@AuraEnabled` security and CRUD/FLS in LWC-backing methods.
- The full skill bodies are at `skills/salesforce/salesforce-lwc/SKILL.md`.

Next: [architecture](architecture.md) — the org-wide view.
