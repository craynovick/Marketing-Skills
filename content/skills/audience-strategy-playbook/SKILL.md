---
name: Audience Strategy Playbook
title: Audience Strategy Playbook
description: Prioritize beachhead audiences, buying situations, and message opportunities using evidence.
category: Strategy
complexity: High
inputs:
  - Current customers or prospects
  - Offer and market
  - Sales or research evidence
output: audience strategy playbook
parameters:
  - company
  - audience
  - offer
  - proof
  - constraints
models:
  - any-instruction-following-llm
featured: true
version: 1.2.0
writes_profile:
  - audience
requires_profile: []
upstream:
  - ideal-customer-profile-builder
  - customer-interview-synthesizer
downstream:
  - brand-positioning-workshop
  - content-pillar-planner
---
# Audience Strategy Playbook
## Quick run
Create a commercially useful audience strategy for {{company}} using the optional Cookbook context: audience `{{audience}}`, offer `{{offer}}`, proof `{{proof}}`, and constraints `{{constraints}}`. Choose a beachhead, map buying situations and committee needs, identify alternatives and objections, define qualification and Anti-ICP signals, and propose message opportunities. Label every finding `Measured`, `Customer quote`, or `Estimated`; mark unsupported claims `[needs source]`.

## Guided run
Ask only what materially changes prioritization. The user may proceed with gaps; label assumptions `Estimated`.

1. Which segment and buying situation should the business win first, and what evidence supports it?
2. What trigger, job, pain, desired outcome, and status-quo alternative appear in customer evidence?
3. Who is Champion, Economic Buyer, User, and Blocker, and what does each need to believe?
4. What proof is approved for reuse, and what claims or audiences are constrained?
5. Which signals qualify a prospect, which disqualify them, and what should be validated next?

If no persona evidence exists, run ideal-customer-profile-builder first. Do not build for "everyone".

## Workflow
1. Frame the strategic choice and evidence limitations.
2. Compare no more than three candidate segments using Pain × Reachability × Serviceability (1-3). Explain each score and label unsupported scores `Estimated`.
3. Select one beachhead. State who is included, why now, desired progress, and why other segments are deferred.
4. Map push, pull, anxiety, and habit for the buying switch. Tie each force to evidence or label it `Estimated`.
5. Map the committee and decision criteria without inventing personas.
6. Build an objection-to-reframe matrix. Reframes are message hypotheses, not approved claims.
7. Define observable qualification signals and an Anti-ICP. Do not use sensitive-trait inference.
8. End with three validation actions, assumptions, and a clear handoff to positioning.

## Required output
| Segment | Situation + trigger | Concerns + desired outcome | Message angle + proof [label] | Qualifier / disqualifier | Validation |
|---|---|---|---|---|---|
| Primary buyer | | | | | |
| Priority 2 | | | | | |
| Priority 3 | | | | | |

Plus: strategic choice; scoring rationale; buying situation; committee; objection/reframe matrix; qualification signals; Anti-ICP; assumptions; validation plan.

### Cookbook save block
End with a copy-paste block the user can save into their Brand Profile:
```
Audience: [1-2 sentences: who, role, trigger]
Segments: [primary + 2 priorities with qualifier]
Exclusions: [Anti-ICP]
Proof used: [labels]
Open loops: [needs source items]
```

## Evidence rules
Label every finding Measured (own analytics), Customer quote (pasted note), or Estimated (your inference, say so). Never invent metrics, quotes, or win rates. Preserve buyer wording for top objections.

## Handoffs
Upstream: ideal-customer-profile-builder, customer-interview-synthesizer. Primary next: brand-positioning-workshop, turn segments + forces into positioning statement and message house. Then content-pillar-planner, turn situations into 3-5 pillars. Do not auto-run downstream; present the save block first.

## Safety
Do not infer sensitive traits or unsupported claims. Flag unsupported superiority or category claims. Respect customer privacy, anonymize names unless approval is explicit. Get human approval before external publication.
