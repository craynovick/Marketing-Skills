---
name: Landing Page Copywriter
description: Apply approved positioning, audience, voice, and proof to a focused landing page that earns a clear next action.
category: Conversion
complexity: Medium
inputs:
  - Offer
  - Audience
  - Proof points
  - Brand context and constraints
output: landing page copy deck
version: 1.1.0
writes_profile: []
requires_profile:
  - audience
  - positioning
  - voice
  - proof
upstream:
  - brand-positioning-workshop
  - brand-voice-guide
  - brand-claims-confidentiality-guide
downstream:
  - content-format-planner
---
# Landing Page Copywriter
## Quick run
Draft conversion copy for {{company}} using the optional Cookbook foundation: audience `{{audience}}`, positioning `{{positioning}}`, offer `{{offer}}`, voice `{{voice}}`, pillars `{{pillars}}`, approved proof `{{proof}}`, formats `{{formats}}`, and constraints `{{constraints}}`. Apply the foundation consistently; do not improve or replace it silently. Include hero, problem, mechanism, benefits, proof, objections, CTA variants, and claim QA.
## Guided run
If any required context is missing, ask for the page goal, audience, offer, desired action, alternatives, approved proof, and constraints. If the user proceeds with gaps, label assumptions and use placeholders rather than inventing brand context. Lead with the audience's desired progress, state the mechanism, prioritize supplied proof, and write modular sections suitable for testing.
## Workflow
1. Define page goal, audience, buying situation, awareness/readiness, desired action, and constraints.
2. Extract the approved positioning and translate it into a page message hierarchy. Do not introduce a new category, promise, or audience.
3. Build the page around the buyer's problem, desired progress, mechanism, benefits, proof, objections, and action.
4. Apply the saved voice and terminology. Mark any section that requires a brand decision or missing proof.
5. Create modular copy and 2–3 test variants where a decision is genuinely uncertain; do not generate arbitrary synonym variants.
6. Run claim, accessibility, clarity, and conversion QA. Separate copy recommendations from facts requiring approval.
## Required output
Include:

- Page brief: goal, audience, situation, readiness, desired action, and constraints.
- Message hierarchy tied to the approved positioning.
- Hero: headline, subhead, primary CTA, and optional proof cue.
- Problem and stakes using audience language where available.
- Mechanism/how it works; distinguish capability from customer outcome.
- Benefit sections mapped to approved pillars and proof.
- Objection handling and alternatives, including doing nothing where relevant.
- Social proof and proof-source requirements; never invent a quote, metric, logo, or result.
- CTA variants with rationale and friction notes.
- Implementation notes for layout, evidence placement, and testing.
- Claim, accessibility, voice, and approval QA checklist.

### Foundation application summary
Before the copy, state how the output uses:

| Foundation | Applied in |
|---|---|
| Audience | |
| Positioning | |
| Voice | |
| Pillars | |
| Proof | |
| Constraints | |

### Missing-context behavior
List missing or draft fields explicitly. Use `[needs input]` or `[needs source]`; never fill a gap with invented positioning, voice, proof, customer results, or competitive claims.
## Safety
Use only approved or clearly labeled substantiated claims. Do not invent testimonials, metrics, customer names, logos, awards, urgency, scarcity, or superiority. Respect accessibility and privacy requirements, and obtain human approval before publication.

## Handoffs
Use `brand-positioning-workshop` when the page lacks a clear strategic position, `brand-voice-guide` when the voice is missing, and `brand-claims-confidentiality-guide` when proof or approvals are unclear. After approval, `content-format-planner` can adapt the message to other formats. Do not auto-run downstream skills.
