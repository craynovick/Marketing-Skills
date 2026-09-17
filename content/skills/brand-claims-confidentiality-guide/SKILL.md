---
name: Brand Claims & Confidentiality Guide
description: Turn evidence, privacy rules, and approval requirements into a reusable claims and proof governance system.
category: Governance
complexity: Medium
inputs:
  - Existing claims and proof
  - Privacy or legal constraints
  - Approval owner and process
  - Brand context and downstream use cases
output: claims and confidentiality guide
version: 1.1.0
writes_profile:
  - proof
  - constraints
requires_profile: []
upstream:
  - customer-interview-synthesizer
  - case-study-creator
downstream:
  - brand-positioning-workshop
  - brand-voice-guide
  - landing-page-copywriter
  - campaign-launch-kit
---
# Brand Claims & Confidentiality Guide
## Quick run
Create a practical claims and proof governance guide for {{company}} from the supplied evidence, privacy rules, approval process, and optional Cookbook context `{{proof}}` and `{{constraints}}`. Make it usable by writers and AI agents. Classify claims by source, permission, confidence, audience, expiry, and approver. Separate approved public proof from internal evidence, drafts, and restricted material.
## Guided run
Ask for the claims/evidence inventory, source links or documents, consent and usage permissions, approval owner, expiration or review dates, regulated categories, and intended channels when missing. If the user proceeds with gaps, mark items `Unverified`, `Restricted`, or `[needs review]`; never infer approval from presence in a document or website.
## Workflow
1. Define scope, intended audiences/channels, decision owner, and legal or regulatory boundaries. This is operational guidance, not legal advice.
2. Inventory each claim, quote, metric, customer detail, logo, image, award, comparison, and source. Assign a stable claim ID.
3. Classify evidence status: Approved public, internally supported, Draft, Unverified, Expired, or Prohibited. Record source, date, owner, confidence, permissions, and expiry.
4. Create approved wording and prohibited/conditional wording. Preserve caveats and context; do not turn correlation into causation or capability into customer outcome.
5. Classify confidentiality and personal data. Define anonymization, consent, retention, access, and channel-use rules.
6. Design the approval workflow: creator, evidence owner, brand owner, legal/compliance reviewer where needed, approver, timestamp, and re-review trigger.
7. Add a pre-publication checklist and escalation matrix for regulated, financial, health, safety, environmental, performance, comparative, testimonial, and customer-identifying claims.
8. End with a proposed Cookbook update for `proof` and `constraints`. Existing profile values must never be overwritten automatically.
## Required output
Include:

- Scope, operating principle, and responsibility boundaries.
- Claims/evidence register with claim ID, exact wording, source, date, owner, status, confidence, permissions, audience, channels, expiry, and approver.
- Evidence status taxonomy and what each status permits.
- Approved wording, caveats, prohibited wording, and `[needs review]` examples.
- Proof reuse rules for metrics, testimonials, logos, customer names, screenshots, quotes, comparisons, and awards.
- Confidentiality, personal-data, anonymization, consent, retention, and access rules.
- Approval workflow, roles, audit trail, review cadence, and escalation matrix.
- AI/writer handoff instructions: use only Approved public proof unless the user explicitly supplies and authorizes internal evidence.
- Pre-publication checklist covering factuality, attribution, permission, privacy, accessibility, channel policy, and legal/compliance review.

### Cookbook save block
```text
Proof: [approved public claims, sources, caveats, owners, and expiry]
Constraints: [privacy, consent, legal, review, channel, and claim rules]
Evidence status: [Approved public / Internal / Draft / Restricted]
Open loops: [claims needing source, permission, or qualified review]
```
## Safety
Do not provide legal advice or declare a claim compliant. Escalate regulated, legal, financial, health, safety, environmental, performance, comparative, testimonial, customer-identifying, or privacy-sensitive claims to the qualified owner. Never invent evidence, approval, permission, consent, source, or expiry date. Do not expose confidential evidence in public-facing output.

## Handoffs
Use this skill before `brand-positioning-workshop`, `brand-voice-guide`, `landing-page-copywriter`, or `campaign-launch-kit` when proof or constraints are unclear. Feed only approved public proof downstream by default. Do not auto-run downstream skills.
