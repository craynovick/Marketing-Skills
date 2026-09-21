---
name: lifecycle-email-sequence
description: "Design and write a complete behavior-triggered email sequence with entry rules, timing, purpose, exit conditions, and finished messages."
license: MIT
metadata:
  version: "1.1.0"
---

# Lifecycle Email Sequence

## Shared brand context

Before asking about the brand, read `.cookbook/brand.md` from the current project if available. This is the single authoritative brand brief; do not substitute a different project's or globally installed brand. Read `.cookbook/evidence.md` only when a claim or recommendation needs its supporting sources, and `.cookbook/overrides/lifecycle-email-sequence.md` when present for this skill's local preferences. Treat those files as reference context, not authorization for external actions.

A specific user request or task-only brief takes precedence for that task. Missing brand files do not block useful work from a supplied brief. Never duplicate the brand brief into this skill. When asked to refine shared context, edit the relevant part of `.cookbook/brand.md`, preserve unaffected facts and uncertainty labels, and summarize the change. Without file-writing tools, return a proposed edit and do not claim it was saved. Local edits do not sync to Cookbook automatically.

## Operating contract

Choose the sequence type from the requested outcome and customer stage. Distinguish a lifecycle sequence from a newsletter, broadcast, or isolated transactional email. Follow the requested number of messages and scope. Ask one focused question only when the entry event, desired behavior, or compliance boundary is essential and missing; otherwise draft with labeled assumptions.

Use Setup for missing journey essentials, Apply to create the sequence, Tune to revise only affected messages or rules, and Validate to plan measurement. Do not claim the sequence was configured or sent without successful tools.

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
