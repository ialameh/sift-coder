---
name: salesforce-agentforce
description: Use for Salesforce Agentforce work — Agents (Topics, Actions), prompt templates, Atlas reasoning engine, Trust Layer integration, agent testing.
---

# salesforce-agentforce

Salesforce Agentforce platform skill. Agents, Topics, Actions, prompt templates, Atlas Reasoning Engine.

## Concepts

- **Agent** — autonomous worker with goals + topics
- **Topic** — capability cluster (e.g. "Service", "Sales") with actions
- **Action** — operation the agent can take (Apex/Flow/Prompt-based)
- **Prompt template** — reusable prompt with merge fields
- **Atlas** — reasoning engine that picks topics and actions
- **Trust Layer** — masking, audit, retention enforcement

## Method (build an action)

1. **Decide action type:**
   - **Apex action** — programmatic; full control; deploy via metadata
   - **Flow action** — declarative; click-built; bulkification limits
   - **Prompt template action** — LLM-powered; needs grounding
2. **Inputs/outputs.** Strict shape. Atlas needs deterministic schema.
3. **Grounding** for prompt actions: which records / files / data feed the prompt? Inline static data is anti-pattern.
4. **Testing.** Unit-test the action. Integration-test via "Try Agent" in Setup. Capture eval cases.
5. **Topic assignment.** Action belongs to a Topic; Topic to an Agent. Wrong topic = action never invoked.

## Output / deliverable shape

```
Agent:    <name>
Topic:    <name>
Action:   <name>
Type:     <Apex | Flow | Prompt template>

Files:
  force-app/main/default/genAiPlugins/<Agent>.genAiPlugin-meta.xml
  force-app/main/default/genAiFunctions/<Action>.genAiFunction-meta.xml
  force-app/main/default/classes/<ActionName>.cls (if Apex)
  force-app/main/default/genAiPromptTemplates/<Template>.genAiPromptTemplate-meta.xml (if prompt)

Test plan:
  Unit:        <test class>
  Integration: <Setup → Agent → "Try"; eval cases>
  Eval:        <prompt eval rubric>

Trust Layer:
  PII masking:      <enabled | reason if not>
  Audit logging:    <captured destination>
  Retention:        <policy>
```

## Rules

- **Action signatures are strict.** Atlas can only call deterministic shapes. No `any`-typed inputs.
- **Prompt actions need grounding** from records/files, not invented data.
- **Trust Layer settings** are per-org policy. Don't override without security review.
- **Test eval cases captured to memory** so future agent changes can re-run.
- **`with sharing` on Apex actions** unless explicitly auditable reason for `without sharing`.

## Anti-patterns

- Prompt template with hardcoded data (defeats grounding)
- Apex action that returns `String` for everything (Atlas can't reason about untyped output)
- Topic assignment by guess (read existing topics first)
- Disabling Trust Layer in non-test orgs
- Action that performs DML without audit trail

## When NOT to use

- Non-Agentforce projects — irrelevant
- Static automation (Flow with no AI) — `/siftcoder:salesforce-flow`

## Subagent dispatch

- `salesforce-architect` for org-level Agentforce review (topic coverage, security, capacity)
- `apex-bulkifier` for Apex actions
- `general-purpose` for the metadata generation

## Key references

- Salesforce Agentforce docs: developer.salesforce.com/docs/einstein/genai/guide/
- Trust Layer docs: help.salesforce.com (Einstein Trust Layer)

## Value over native CC

CC will write Salesforce code if asked. CC won't naturally know Agentforce-specific shapes (genAiPlugin metadata, genAiFunction structure, Atlas reasoning constraints, Trust Layer policy axes). The platform-specific knowledge IS the value.
