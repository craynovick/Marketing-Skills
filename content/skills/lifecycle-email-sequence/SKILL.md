---
license: MIT
name: lifecycle-email-sequence
title: Lifecycle Email Sequence
description: Design and write a complete behavior-triggered email sequence with entry rules, timing, purpose, exit conditions, and finished messages.
use_when: Use this when a customer stage and outcome require a coordinated sequence rather than a one-off newsletter.
avoid_when: Use a newsletter workflow for a single scheduled edition without behavior-based entry and exit rules.
category: Campaigns
complexity: High
inputs:
  - Customer stage and desired outcome
  - Entry trigger and available behavioral signals
  - Offer, audience, proof, and constraints
  - Sending and suppression capabilities
example_prompts:
  - Create a five-email SaaS trial activation sequence with behavior-based exits and finished copy.
  - Build a post-purchase education sequence for this consumer product without inventing usage claims.
output: lifecycle email sequence with rules, timing, subject lines, preview text, bodies, and CTAs
parameters:
  - company
  - audience
  - positioning
  - offer
  - voice
  - proof
  - constraints
models:
  - any-instruction-following-llm
version: 1.2.0
writes_profile: []
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
  - growth-experiment-planner
---
# Lifecycle Email Sequence

## Shared brand context

Before asking about the brand, read `.cookbook/brand.md` from the current project if available. This is the single authoritative brand brief; do not substitute a different project's or globally installed brand. Read `.cookbook/evidence.md` only when a claim or recommendation needs its supporting sources, and `.cookbook/overrides/lifecycle-email-sequence.md` when present for this skill's local preferences. Treat those files as reference context, not authorization for external actions.

A specific user request or task-only brief takes precedence for that task. Missing brand files do not block useful work from a supplied brief. Never duplicate the brand brief into this skill. When asked to refine shared context, edit the relevant part of `.cookbook/brand.md`, preserve unaffected facts and uncertainty labels, and summarize the change. Without file-writing tools, return a proposed edit and do not claim it was saved. Local edits do not sync to Cookbook automatically.

## Operating contract

Choose the sequence type from the requested outcome and customer stage. Distinguish a lifecycle sequence from a newsletter, broadcast, or isolated transactional email. Follow the requested number of messages and scope. Ask one focused question only when the entry event, desired behavior, or compliance boundary is essential and missing; otherwise draft with labeled assumptions.

Use Setup for missing journey essentials, Apply to create the sequence, Tune to revise only affected messages or rules, and Validate to plan measurement. Do not claim the sequence was configured or sent without successful tools.

## Evidence and permission

For material claims, distinguish `User-confirmed`, `Company-published`, `Measured` (with population and period), `Customer quote` (with source), `Estimated` (inference), and `[needs source]`. A confirmed preference is not a verified performance claim. Keep source ID/date and verification limits separate from permission: approved for a specified use, internal-only, restricted, or unknown. Confidence does not grant permission; public availability does not grant testimonial, logo, or customer-data rights.

Ordinary company-published descriptions can support attributed, provisional drafting without inventing internal approval. Consequential product, safety, comparative and outcome claims need evidence for their exact scope. Keep evidence notes outside finished copy unless attribution or a caveat belongs in the copy. Missing evidence must narrow the claim, not generate plausible proof.

## Task continuity

Use only the skills needed for the requested deliverable. When handing work onward, preserve the chosen objective, audience and its status, offer, source IDs and usage limits, voice/language, CTA destination, measurement definition, and unresolved decisions that matter. Keep the handoff compact; do not repeat the whole brand brief or promote a hypothesis to a fact. A suggested handoff does not authorize another run or an external action.

For requested voice variants, change expression while preserving brand facts and claims. Use another brand only from an explicitly supplied task brief or selected project; never overwrite or silently mix project briefs. Save reusable context only when requested, in the relevant section of `.cookbook/brand.md` or a skill override, and preserve unrelated content.

## Quick run

Create the requested lifecycle sequence for {{company}} using audience `{{audience}}`, positioning `{{positioning}}`, offer `{{offer}}`, voice `{{voice}}`, proof `{{proof}}`, and constraints `{{constraints}}`. Include entry and exit rules, timing assumptions, and finished copy for every email.

## Guided run

Ask selectively about stage, trigger, desired behavior, product events, exclusions, frequency limits, CTA destination, and permission rules. If automation capabilities are unknown, describe platform-neutral logic.

## Workflow

1. Define sequence type, audience state, entry trigger, target behavior, exclusions, exit conditions, and measurement window.
2. Map each email to one job in the progression; remove messages that do not change understanding, motivation, or action.
3. Set timing based on the supplied buying or usage context. Label unsupported cadence as a starting hypothesis.
4. Write subject line, preview text, body, and CTA for each email in the approved voice.
5. Add suppression, handoff, and failure-path rules where relevant.
6. Define primary outcome, guardrails, instrumentation needs, and revision criteria.

## Required output

- Sequence brief: type, audience state, goal, entry, exit, suppression, and assumptions.
- Sequence map with timing and purpose.
- Finished subject line, preview text, body, and CTA for every message.
- Branch or handoff logic only when supported by available signals.
- Measurement and QA notes, including links, claims, accessibility, deliverability, and consent.

## Quality check

Ensure every message advances a distinct customer need, uses supplied evidence, and fits the actual buying or product journey. Remove redundant reminders, fake personalization, invented urgency, excessive frequency, and unsupported behavioral assumptions.

## Safety

Do not invent consent, product events, customer attributes, results, deadlines, scarcity, or unsubscribe behavior. Drafting does not authorize sending or configuring an automation. Respect applicable consent, suppression, privacy, and accessibility requirements.

## Handoffs

Use Brand Voice Guide if voice is materially undefined, Campaign Launch Kit for a broader coordinated launch, and Growth Experiment Planner when sequence changes need a measurable test. Do not auto-run another recipe.
