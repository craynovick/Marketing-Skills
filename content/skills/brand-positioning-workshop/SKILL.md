---
name: Brand Positioning Workshop
description: Develop a differentiated, evidence-backed positioning hypothesis for a defined audience and buying situation.
category: Strategy
complexity: High
inputs:
  - Company or product
  - Target audience
  - Competitive context
  - Proof and constraints
output: positioning brief
featured: true
version: 1.1.0
writes_profile:
  - positioning
requires_profile:
  - audience
upstream:
  - audience-strategy-playbook
  - ideal-customer-profile-builder
  - competitive-intelligence-brief
downstream:
  - brand-voice-guide
  - content-pillar-planner
  - landing-page-copywriter
---

# Brand Positioning Workshop

## Quick run
Develop a defensible positioning hypothesis for {{company}} using optional Cookbook context: audience `{{audience}}`, existing positioning `{{positioning}}`, offer `{{offer}}`, proof `{{proof}}`, and constraints `{{constraints}}`. Define the buying situation, frame of reference, alternatives including do nothing, desired customer progress, differentiated value, reasons to believe, message hierarchy, tradeoffs, and validation plan. Treat existing positioning as a draft unless confirmed.

## Guided run
Ask only these questions when context is missing: Who is the audience and buying situation? What progress do they want? What alternatives do they use? What capabilities are genuinely distinctive? What proof is approved? Who is this not for? If the user proceeds with gaps, label hypotheses `Estimated`.

## Workflow
1. State the positioning decision and evidence quality.
2. Define the chosen audience, buying situation, desired progress, and frame of reference.
3. Map alternatives, including status quo, by outcome, risk, switching cost, and reason to choose.
4. Identify differentiated value and a specific mechanism; avoid adjectives such as better or innovative.
5. Attach approved proof or evidence gaps to every material benefit.
6. Draft the positioning statement and message hierarchy, including tradeoffs and exclusions.
7. Pressure-test against alternatives, audience language, constraints, and objections.
8. End with three validation actions and a proposed Cookbook update. Never overwrite the profile automatically.

## Required output
Positioning hypothesis using `For [audience] in [situation] who [need/progress], [company] is a [frame of reference] that [differentiated value] because [reason to believe]`; audience and buying context; alternatives including do nothing; differentiated value and mechanism; benefits-to-proof table; message hierarchy; tradeoffs; claims needing validation; assumptions; validation plan.

### Cookbook save block
```text
Positioning: [one-sentence hypothesis]
Audience: [chosen audience and buying situation]
Differentiated value: [specific value/mechanism]
Proof: [approved reasons to believe]
Tradeoffs: [who this is not for / what we do not claim]
Evidence status: [Confirmed / Draft / Estimated]
Open loops: [validation and needs-source items]
```

## Handoffs
After approval, use `brand-voice-guide`, `content-pillar-planner`, or `landing-page-copywriter` to apply the position. Do not auto-run downstream skills.

## Safety
Avoid unsupported category claims. Verify factual claims, respect customer privacy, and get human approval before external publication.
