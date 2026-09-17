---
name: SEO Content Brief
description: Translate an approved content pillar and positioning into a useful, search-aware editorial brief.
category: Content
complexity: Medium
inputs:
  - Target topic
  - Audience
  - Search intent
  - Brand context and constraints
output: SEO content brief
version: 1.1.0
writes_profile: []
requires_profile:
  - audience
  - positioning
  - voice
  - pillars
  - proof
upstream:
  - content-pillar-planner
  - brand-positioning-workshop
  - brand-voice-guide
downstream:
  - landing-page-copywriter
  - content-format-planner
  - content-repurposing-engine
---
# SEO Content Brief
## Quick run
Create an original, useful SEO content brief for {{company}} using optional Cookbook context: audience `{{audience}}`, positioning `{{positioning}}`, voice `{{voice}}`, pillars `{{pillars}}`, approved proof `{{proof}}`, formats `{{formats}}`, and constraints `{{constraints}}`. Define the searcher’s job, intent, audience stage, differentiated editorial angle, outline, evidence, links, CTA, and editorial QA. Search demand informs the opportunity; audience needs, positioning, usefulness, and proof determine the content. Do not promise rankings.
## Guided run
If the query, audience, pillar, search evidence, business goal, or approved proof is missing, ask for it. If the user proceeds with gaps, label assumptions and use `[needs input]` or `[needs source]`. Clarify the primary query, audience stage, and conversion goal. Map questions into an information flow and use original evidence without imitating competitor text or producing keyword filler.
## Workflow
1. Define the business decision, audience, buying situation, content pillar, audience stage, desired action, and constraints.
2. Establish the searcher’s task and intent: informational, navigational, commercial investigation, transactional, or mixed. Explain the evidence for the classification.
3. Map the primary query and supporting language to real audience questions. Treat search volume, rankings, or keyword tools as directional demand signals—not proof of customer importance.
4. Identify the editorial opportunity: what the reader needs that existing results, internal knowledge, or generic summaries do not provide. Anchor it to the approved positioning and pillar.
5. Build an evidence-led outline with a logical information gain sequence, original examples, expert input, internal links, external sources, and proof requirements.
6. Define the conversion role and CTA. Match it to audience readiness; do not force a sales CTA onto an early-stage information need.
7. Add voice, accessibility, claim, source, internal-link, and SEO QA. Flag ranking, traffic, or competitive claims that require verification.
8. End with assumptions, missing inputs, and a handoff to production. This skill creates a brief; it does not write or publish the article.
## Required output
Include:

- Business objective, audience, buying situation, audience stage, pillar, and desired action.
- Primary query, supporting queries, searcher task, intent classification, and evidence for the classification.
- Editorial angle tied to approved positioning, including what the piece will and will not cover.
- Title options and a useful meta description draft without clickbait.
- Detailed outline showing reader question, purpose, information gain, evidence, and internal-link opportunity for each section.
- Original examples, data, expert input, visuals, or tools required.
- Approved proof and source plan with `Confirmed`, `Customer quote`, `Estimated`, or `[needs source]` labels.
- CTA and conversion path appropriate to audience readiness.
- Voice and content-pillar application summary.
- Editorial, accessibility, source, internal-link, and SEO QA checklist.
- Assumptions, missing context, and handoff notes for the writer or editor.

### Foundation application summary
| Foundation | Applied in |
|---|---|
| Audience | |
| Positioning | |
| Voice | |
| Content pillar | |
| Proof and constraints | |

### Cookbook save block
This Applier does not normally update the Brand Profile. If it reveals a reusable editorial rule, propose it separately for human review:

```text
Editorial rules: [reusable audience, topic, voice, or format guidance]
Evidence status: [Confirmed / Draft / Estimated]
Open loops: [source, approval, or validation items]
```
## Safety
Do not promise rankings, traffic, citations, or conversions. Do not treat keyword volume as customer evidence. Do not copy competitor text, imitate search-result structure without adding value, invent sources, or make unsupported comparative claims. Verify current SEO/platform guidance where relevant, respect copyright and privacy, and obtain human editorial approval before publication.

## Handoffs
Use `content-pillar-planner` when the topic is not anchored to a strategic pillar, `brand-positioning-workshop` when the editorial angle lacks differentiation, and `brand-voice-guide` when expression is undefined. After approval, hand the brief to a writer, `content-format-planner`, or `landing-page-copywriter`. Do not auto-run downstream skills.
