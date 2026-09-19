---
name: Case Study Creator
title: Case Study Creator
description: Turn approved customer evidence into a credible, permissioned case study without inventing outcomes or proof.
category: Content
complexity: Medium
inputs:
  - Customer notes
  - Results
  - Approval status
  - Brand positioning, voice, and constraints
output: case study outline
parameters:
  - company
  - audience
  - positioning
  - voice
  - proof
  - constraints
models:
  - any-instruction-following-llm
version: 1.1.0
writes_profile: []
requires_profile:
  - positioning
  - voice
  - proof
  - constraints
upstream:
  - customer-interview-synthesizer
  - brand-claims-confidentiality-guide
downstream:
  - content-repurposing-engine
  - landing-page-copywriter
---
# Case Study Creator
## Quick run
Create a credible, permissioned customer story for {{company}} using only supplied and approved customer notes, results, quotes, and permissions. Apply optional Cookbook context: positioning `{{positioning}}`, voice `{{voice}}`, approved proof `{{proof}}`, and constraints `{{constraints}}`. Structure it as context, challenge, approach, outcome, proof, CTA, and approval checklist. Treat every result and quote as unpublishable until its source and permission are explicit.
## Guided run
Ask for the customer, audience, story objective, source notes, baseline and comparison period, metric definitions, quote permissions, customer-name/logo permissions, publication channels, and approver when missing. If the user proceeds with gaps, use placeholders and label items `[needs approval]` or `[needs source]`. Quantify results only where approved evidence supports them.
## Workflow
1. Establish the story objective, intended audience, channel, customer permission status, and evidence boundary.
2. Build an evidence ledger for each fact, quote, metric, name, logo, image, and outcome: source, date, owner, permission, caveat, and approval status.
3. Frame the customer's context, trigger, problem, constraints, and desired progress in their language. Do not make the customer a generic hero or imply universal applicability.
4. Describe the approach and mechanism accurately, separating what the company did from what the customer experienced.
5. State outcomes with baseline, timeframe, metric definition, comparison, attribution caveat, and exact approval. If any are missing, do not quantify.
6. Draft headline, summary, narrative, proof blocks, objection handling, CTA, and modular excerpts in the approved voice without exaggerating.
7. Run privacy, consent, quote, logo, claim, accessibility, attribution, and customer-review QA. Identify every remaining approval.
8. End with a publication-ready checklist and optional repurposing plan. Do not publish, update the Brand Profile, or imply approval automatically.
## Required output
Include:

- Story objective, audience, channel, and foundation application summary.
- Customer permission and publication-status summary.
- Evidence ledger for facts, metrics, quotes, names, logos, images, and outcomes.
- Headline and summary with claim-safe alternatives.
- Customer context, trigger, challenge, constraints, and desired progress.
- Approach/mechanism with accurate implementation detail.
- Results with baseline, timeframe, definitions, comparison, attribution caveats, and approval status, or explicit `[needs source]` placeholders.
- Approved quote or faithful paraphrase with consent status.
- CTA appropriate to the audience and evidence strength.
- Modular excerpts for downstream reuse, each mapped to source evidence.
- Customer review, legal/compliance, privacy, accessibility, and publication checklist.

### Missing-context behavior
Never fill gaps with plausible metrics, customer language, business impact, logos, names, or permission. Use `[customer name pending approval]`, `[quote pending approval]`, `[metric pending source]`, or `[needs review]`.

### Cookbook save block
This skill does not normally update the Brand Profile. If approved proof becomes reusable, propose it for review:

```text
Proof candidate: [exact approved claim, source, date, permission, caveat, expiry]
Evidence status: [Approved public / Internal / Draft / Restricted]
Open loops: [customer, legal, privacy, or source approvals]
```
## Safety
Never invent customer results, quotes, names, logos, permissions, or causal claims. Do not publish confidential or identifying material without explicit authorization for the exact channel and use. Avoid implying that one customer's outcome is typical or guaranteed. Escalate legal, regulated, comparative, financial, health, safety, and performance claims. Obtain customer and internal approval before publication.

## Handoffs
Use `customer-interview-synthesizer` when notes need evidence extraction, and `brand-claims-confidentiality-guide` before classifying proof. After approval, use `content-repurposing-engine` or `landing-page-copywriter` to adapt the story. Do not auto-run downstream skills.
