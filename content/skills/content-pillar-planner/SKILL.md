---
name: Content Pillar Planner
title: Content Pillar Planner
description: Turn approved audience, positioning, voice, and proof into a focused content pillar system.
category: Content
complexity: High
inputs:
  - Business priorities
  - Audience problems
  - Available proof and formats
  - Brand context and constraints
output: content pillar plan
parameters:
  - company
  - audience
  - positioning
  - voice
  - proof
  - pillars
  - constraints
models:
  - any-instruction-following-llm
version: 1.1.0
writes_profile:
  - pillars
requires_profile:
  - audience
  - positioning
  - voice
  - proof
upstream:
  - audience-strategy-playbook
  - brand-positioning-workshop
  - brand-voice-guide
downstream:
  - seo-content-brief
  - content-format-planner
  - content-repurposing-engine
  - campaign-launch-kit
---
# Content Pillar Planner
## Quick run
Build an evidence-led content pillar plan for {{company}} using optional Cookbook context: audience `{{audience}}`, positioning `{{positioning}}`, voice `{{voice}}`, existing pillars `{{pillars}}`, approved proof `{{proof}}`, formats `{{formats}}`, and constraints `{{constraints}}`. Connect high-value buyer questions and situations to differentiated messages, proof, formats, CTA roles, publishing mix, and validation. Treat existing pillars as a draft unless confirmed.
## Guided run
If context is missing, ask for the audience's highest-value questions, the buying stages or situations to support, the approved positioning and proof, target outcomes, channels, and constraints. If the user continues with gaps, label assumptions `Estimated` and mark proof gaps `[needs source]`. Do not generate pillars from generic trends alone.
## Workflow
1. Define the business objective, audience, buying situations, positioning, voice, available proof, formats, and constraints.
2. Extract the audience's recurring questions and information needs across awareness, consideration, decision, adoption, and retention where relevant.
3. Cluster questions into three to five distinct pillars. Each pillar must have a clear audience problem, strategic role, point of view, and boundary. Remove overlap and topics that do not support the strategy.
4. Map each pillar to desired progress, message, proof, evidence gaps, formats, channels, CTA role, and appropriate funnel or buying stage.
5. Balance the publishing mix by audience value and business priority, not by arbitrary percentages. Distinguish foundational, proof-led, educational, and conversion content.
6. Define exclusions, freshness rules, repurposing opportunities, and a selection test for future topics.
7. End with three validation actions and a proposed Cookbook update. Do not overwrite existing pillars automatically.
## Required output
Include:

- Strategy summary and audience/buying-context assumptions.
- Three to five prioritized pillars with names, audience question, desired progress, point of view, boundaries, and commercial role.
- Pillar-to-proof matrix with `Confirmed`, `Customer quote`, `Estimated`, or `[needs source]` labels.
- Recommended formats, channels, CTA role, and buying stage for each pillar.
- Publishing mix with rationale and explicit exclusions.
- Topic selection test and anti-generic-content rules.
- Repurposing opportunities for downstream skills.
- Three validation actions with owner, evidence source, measure, and timeframe.

### Foundation application summary
| Foundation | Applied in |
|---|---|
| Audience | |
| Positioning | |
| Voice | |
| Proof | |
| Formats and constraints | |

### Cookbook save block
```text
Pillars: [3-5 pillars, each with audience question and strategic role]
Priority: [which pillar matters most now and why]
Formats: [approved formats/channels by pillar]
Evidence status: [Confirmed / Draft / Estimated]
Exclusions: [topics, claims, or audiences not in scope]
Open loops: [needs-source and validation items]
```

### Missing-context behavior
List missing or draft foundation fields explicitly. Never invent audience demand, proof, customer outcomes, or channel performance.
## Safety
Do not invent customer stories, results, audience demand, channel performance, or approval status. Keep strategic content hypotheses separate from approved claims. Respect voice, privacy, accessibility, and legal constraints; obtain human approval before publication.

## Handoffs
Use `audience-strategy-playbook` when buyer situations are unclear, `brand-positioning-workshop` when the point of view is weak, and `brand-voice-guide` when expression is undefined. After approval, hand pillars to `seo-content-brief`, `content-format-planner`, `content-repurposing-engine`, or `campaign-launch-kit`. Do not auto-run downstream skills.
