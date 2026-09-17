---
name: Brand Voice Guide
description: Turn approved positioning, audience context, and writing evidence into usable, brand-specific voice rules.
category: Strategy
complexity: Medium
inputs:
  - Company context
  - Existing writing samples
  - Audience and tone constraints
output: brand voice guide
version: 1.1.0
writes_profile:
  - voice
requires_profile:
  - audience
  - positioning
upstream:
  - brand-positioning-workshop
  - audience-strategy-playbook
downstream:
  - content-pillar-planner
  - content-format-planner
  - landing-page-copywriter
---
# Brand Voice Guide
## Quick run
Create a practical voice guide for {{company}} using optional Cookbook context: audience `{{audience}}`, positioning `{{positioning}}`, existing voice `{{voice}}`, and constraints `{{constraints}}`. Use writing samples as evidence. If samples are absent, create a provisional hypothesis labeled `Draft — confirm`; never pretend to know how the brand sounds.
## Guided run
Ask for 2–5 representative writing samples, the audience response desired, words to use/avoid, and important channel or legal constraints. If the user proceeds without samples, label recommendations `Draft — confirm`.
## Workflow
1. State the communication job, audience, positioning, and evidence available.
2. Extract patterns in directness, warmth, certainty, technicality, rhythm, point of view, and evidence use. Do not overfit one sample.
3. Define three to five voice attributes. For each, provide a meaning, do rule, don’t rule, and example.
4. Define stance, vocabulary, terminology, accessibility, and claim guidance.
5. Adapt expression by channel without changing the underlying voice.
6. Add anti-patterns, generic-AI phrase checks, and an editorial rewrite test.
7. End with a proposed Cookbook update; preserve existing voice unless replacement is explicitly approved.
## Required output
Voice status (`Confirmed`, `Draft`, or `Draft — confirm`); voice statement; brand stance; three to five attributes with do/don’t rules; grounded examples; vocabulary and accessibility guidance; channel adaptations; anti-patterns; editorial checklist; evidence gaps; approval questions.

### Cookbook save block
```text
Voice status: [Confirmed / Draft — confirm]
Voice: [2-4 sentence operating description]
Attributes: [3-5 attributes with concise rules]
Use: [preferred words, rhythm, stance, evidence style]
Avoid: [words, patterns, unsupported certainty]
Channel notes: [important adaptations]
Open loops: [examples or decisions still needed]
```

## Handoffs
After approval, use `content-pillar-planner`, `content-format-planner`, or `landing-page-copywriter` to apply the voice. Do not auto-run downstream skills.
## Safety
Do not imitate a living writer or invent brand proof.
