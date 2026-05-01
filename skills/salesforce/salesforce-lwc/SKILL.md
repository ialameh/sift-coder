---
name: salesforce-lwc
description: Use when working on Lightning Web Components — wire adapters, events, lifecycle, state, performance, testing.
---

# Salesforce LWC skill

## Wire adapters
- Reactive params: `@wire(getX, { id: '$recordId' })` — the `$` is a contract with the framework
- Imperative for mutations or one-shot fetches: import directly, call as function
- Always handle `error` and `data` branches in wire handlers
- Use `refreshApex(this.wiredX)` after DML to refresh cached results

## Events
- `dispatchEvent(new CustomEvent('change', { detail, bubbles: true, composed: true }))`
- `composed: true` only when crossing shadow DOM boundaries — usually at a top-level component
- Don't use DOM events for parent→child; use `@api` props
- Don't use `@api` methods for parent←child; use events

## Lifecycle order
1. `constructor`
2. `connectedCallback` (in DOM)
3. wires fire
4. `renderedCallback` (after each render)
5. `disconnectedCallback` (out of DOM)
6. `errorBoundaryCallback` (parent only)

Avoid: heavy work in `renderedCallback` — fires on every re-render. Guard with a `_initialized` flag.

## State
- Mutable arrays/objects need re-assignment to trigger reactivity: `this.list = [...this.list, item]`
- Track is implicit on `@api` and `@track` is no longer required for primitives
- Use `lwc/wire` for store-shaped state; otherwise local class fields

## Performance
- `lwc-recipes` is the canonical reference for patterns
- Lazy-load heavy children with `if:true`
- Avoid full re-renders — use keyed `for:each` with stable `key`
- Profile with the LWC Performance Inspector in Chrome devtools

## Testing
- `@salesforce/sfdx-lwc-jest` for unit tests
- `createElement('c-foo', { is: Foo })` then `document.body.appendChild(el)`
- `await Promise.resolve()` between actions to flush microtasks
- Mock wire adapters with `registerLdsTestWireAdapter` (for LDS) or `createApexTestWireAdapter` (for Apex)

## Common bugs
- "Cannot assign to read-only property" — assigning to `@api` from within the component
- Wire not firing — param starts undefined, fix with `?? null` or wait for value
- Style not applying — selector specificity issue across shadow DOM
- `connectedCallback` runs but child template `querySelector` returns null — DOM not yet rendered, use `renderedCallback`
