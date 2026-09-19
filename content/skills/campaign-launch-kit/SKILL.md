---
name: Campaign Launch Kit
title: Campaign Launch Kit
description: Turn an approved marketing objective into a coordinated, measurable, and reviewable campaign launch plan.
category: Campaigns
complexity: High
inputs:
  - Campaign goal
  - Offer
  - Timeline
  - Audience, positioning, and brand context
  - Proof, budget, and approval constraints
output: campaign launch kit
parameters:
  - company
  - audience
  - positioning
  - offer
  - proof
  - constraints
models:
  - any-instruction-following-llm
version: 1.1.0
writes_profile: []
requires_profile:
  - audience
  - positioning
  - voice
  - pillars
  - proof
  - constraints
upstream:
  - brand-positioning-workshop
  - content-pillar-planner
  - content-format-planner
  - brand-claims-confidentiality-guide
downstream:
  - weekly-growth-readout
---
# Campaign Launch Kit
## Quick run
Turn {{company}}'s campaign goal, offer, and timeline into a coordinated launch kit using optional Cookbook context: audience `{{audience}}`, positioning `{{positioning}}`, voice `{{voice}}`, pillars `{{pillars}}`, approved proof `{{proof}}`, formats `{{formats}}`, and constraints `{{constraints}}`. Define the strategic choice, message architecture, channel roles, asset requirements, owners, dependencies, budget assumptions, measurement, risks, and approval gates. This is a plan, not an authorization to publish, send, or spend.
## Guided run
If the objective, audience, offer, positioning, desired action, timeline, budget, proof, owner, or approval authority is missing, ask for it. If the user continues with gaps, label assumptions and stop short of recommending irreversible commitments. Define one launch decision, build one message architecture before adapting it by channel, and flag approvals, consent, budget, tracking, and dependency risks.
## Workflow
1. Define the business objective, audience, buying situation, offer, desired behavior, timeline, budget boundary, success threshold, and decision owner.
2. Apply the approved positioning, voice, content pillars, proof, formats, and constraints. State what is confirmed, drafted, estimated, or `[needs source]`.
3. Build one message architecture: core promise, audience problem, mechanism, reasons to believe, objection handling, CTA, and explicit non-claims.
4. Assign each channel a job. Select assets and formats based on audience stage and objective; do not add channels because they are popular.
5. Create an asset matrix with brief, owner, source/proof, production status, dependency, approval authority, and due date.
6. Define measurement: primary outcome, leading indicators, guardrails, attribution limits, baseline, comparison period, and decision rule. Do not promise causality from weak measurement.
7. Add launch gates for claims, privacy, consent, accessibility, brand, legal, budget, tracking, and operational readiness.
8. Define contingencies and stop conditions. End with a launch-readiness checklist and explicit human approval request.
## Required output
Include:

- Decision brief: objective, audience, situation, offer, desired action, timeline, budget boundary, and owner.
- Foundation application summary for audience, positioning, voice, pillars, proof, formats, and constraints.
- Message architecture and claims/non-claims register.
- Audience/message/channel matrix with the role, format, CTA, and evidence for each channel.
- Asset production matrix with owner, status, dependency, approval authority, and due date.
- Measurement plan: primary metric, leading indicators, guardrails, baseline, attribution limits, and decision rules.
- Risk register covering claims, privacy, consent, accessibility, brand, budget, tracking, timing, and operational capacity.
- Pre-launch gates, launch-day checklist, post-launch review, and stop conditions.
- Explicit missing inputs, assumptions, and decisions requiring approval.

### Cookbook save block
This is an Applier and should not update the Brand Profile by default. If the campaign reveals reusable guidance, propose it separately:

```text
Campaign rules: [reusable audience, channel, format, or approval guidance]
Evidence status: [Confirmed / Draft / Estimated]
Open loops: [source, approval, measurement, or validation items]
```
## Safety
Never publish, send, spend, contact people, or change live campaigns. Confirm claims, permissions, consent/opt-in, customer privacy, accessibility, budget, tracking, owners, and qualified legal or compliance review where relevant. Do not invent performance forecasts, attribution, urgency, scarcity, or approval status.

## Handoffs
Use `brand-positioning-workshop` when the strategic position is unclear, `content-pillar-planner` when the campaign lacks a content role, `content-format-planner` for asset briefs, and `brand-claims-confidentiality-guide` for proof or approvals. After launch, use `weekly-growth-readout` to evaluate supplied results. Do not auto-run downstream skills.
