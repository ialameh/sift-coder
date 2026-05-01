---
name: salesforce-einstein
description: Use for Salesforce Einstein work — Discovery, Predictions, Next Best Action, Einstein Bots (legacy → migrating to Agentforce), prompt builder, model management.
---

# salesforce-einstein

Salesforce Einstein platform. Distinct from Agentforce (which subsumes some Einstein features). Use for: predictions, classifications, recommendations, prompt-builder workflows.

## Surfaces

- **Einstein Discovery** — AutoML on CRM data; predictions + model explainability
- **Einstein Prediction Builder** — clicks-not-code prediction model
- **Einstein Next Best Action** — recommendation strategy + flows
- **Prompt Builder** — prompt templates for AI features
- **Einstein Bots** — legacy chatbots; new builds → Agentforce
- **Model deployment** — Connect API for custom models, Trust Layer integration

## Method (typical workflows)

### Discovery model

1. Identify the **target field** (what to predict).
2. Identify the **comparison data** (positive vs negative outcomes).
3. Configure **dataset** — fields to include, exclusions for bias.
4. Train. Inspect **model fit** (R², accuracy, lift).
5. Deploy — embed in Lightning page or Flow.
6. **Monitor drift** — schedule re-train or alert on accuracy drop.

### Prompt template

1. **Type** — Field Generation / Email Generation / Sales Email / Flex / Record Summary.
2. **Resources** — fields, related lists, files, Apex methods, Flows.
3. **Instructions** — natural language; avoid contradicting the resource shape.
4. **Test** — Prompt Builder preview; eval against sample records.
5. **Surface** — embed in record page action, Flow, or via Apex.

## Output shape

```
Workflow:    <Discovery | Prediction Builder | NBA | Prompt | Bot>

Inputs:
  Object:     <SObject>
  Dataset:    <fields, filters>

Configuration:
  <key params>

Quality gates:
  Model fit:        <metric, threshold>
  Bias check:       <how>
  Trust Layer:      <PII handling>

Deploy:
  Surface:    <Lightning page | Flow | Apex | Bot>
  Test plan:  <eval cases>

Monitoring:
  Metric:     <accuracy, drift, latency>
  Alert:      <threshold>
```

## Rules

- **Bias review is part of quality, not optional.** Exclude biased fields (race, age, gender unless compliance-required).
- **Trust Layer applies to LLM-backed features** (prompts, generative responses).
- **Capacity** — Einstein has compute limits per edition; check before adding heavy models.
- **Migration path** — new chatbot work goes to Agentforce, not Einstein Bots.
- **Eval cases captured to memory** for regression testing.

## Anti-patterns

- Discovery model using PII as input without compliance signoff
- Prompt template that ignores resources, hallucinates from imagined records
- Deploying without monitoring (drift bites silently)
- Building new Einstein Bot when org has Agentforce licence
- Custom-model integration without Trust Layer

## When NOT to use

- Non-Einstein-licenced org — features unavailable
- Pure rule-based logic — use Flow / Apex
- Agentforce work — `/siftcoder:salesforce-agentforce`

## Subagent dispatch

- `salesforce-architect` for capacity + bias review
- `Plan` for multi-step workflows (data prep + train + deploy)
- `general-purpose` for the metadata generation

## Key references

- Einstein Discovery: trailhead.salesforce.com (Einstein Discovery Basics)
- Prompt Builder: help.salesforce.com → Prompt Builder
- Einstein Trust Layer: help.salesforce.com (also referenced from agentforce skill)

## Value over native CC

CC will discuss ML if asked. CC won't naturally know Einstein-specific shapes (Discovery model fit metrics, Prompt Builder template types, NBA strategy components). Platform-specific knowledge IS the value.
