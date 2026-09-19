---
name: Weekly Growth Readout
title: Weekly Growth Readout
description: Turn supplied or imported growth data into a decision-ready weekly readout with explicit data-quality caveats.
category: Analytics
complexity: Low
inputs:
  - Metrics
  - Experiments
  - Week-over-week changes
  - Source metadata and metric definitions
  - Business objectives and experiments
output: weekly growth readout
parameters:
  - company
  - audience
  - positioning
  - pillars
  - proof
  - constraints
models:
  - any-instruction-following-llm
version: 1.1.0
writes_profile: []
requires_profile:
  - audience
  - positioning
  - pillars
upstream:
  - campaign-launch-kit
  - content-pillar-planner
downstream: []
---
# Weekly Growth Readout
## Quick run
Turn supplied or imported metrics, experiments, and week-over-week changes into a concise readout for {{company}}. Use optional Cookbook context: audience `{{audience}}`, positioning `{{positioning}}`, pillars `{{pillars}}`, and constraints `{{constraints}}`. Accept pasted data, CSV/table exports, screenshots, spreadsheets, plugin payloads, or API responses. Normalize the input, validate its quality, distinguish observed movement from explanation, and produce decisions, owners, and due dates. This skill analyzes data; it does not connect to or operate external systems.
## Guided run
If the source, extraction date, metric definitions, reporting period, comparison basis, objective, or decision owner is missing, ask for it. If the user proceeds with gaps, state the limitation. Explain material changes with evidence, label hypotheses, and turn learning into owned next actions.
## Workflow
1. State the business objective, decision this readout supports, audience/context, source(s), extraction date, reporting period, comparison period, timezone, currency, and owner.
2. Normalize metrics into name, value, unit, period, comparison, segment/channel, source, and definition. Preserve the original input for traceability.
3. Run data-quality checks: missing fields, duplicate rows, inconsistent periods, changed definitions, partial periods, anomalous values, sampling, attribution-window changes, timezone/currency mismatches, and unexplained source conflicts.
4. Identify material movement using supplied thresholds or a clearly labeled practical threshold. Report absolute and relative change where valid; do not overinterpret small denominators.
5. Separate the chain: observed metric movement → evidence-supported explanation → plausible hypothesis → recommended action. Never present correlation as causation.
6. Read experiments with hypothesis, population, exposure, duration, primary metric, guardrails, sample limitations, and decision rule. If the test is inconclusive, say so.
7. Segment findings by meaningful audience, channel, content pillar, campaign, or funnel stage without hiding aggregate performance or slicing until a preferred story appears.
8. Assign decisions and actions with owner, effort, due date, expected signal, and stop/continue rule. End with open questions and the next measurement needed.
## Required output
Include:

- Executive summary and the decision it supports.
- Source and extraction metadata.
- Metric dictionary and normalized scorecard with period, comparison, unit, definition, and segment.
- Data-quality assessment and known limitations.
- What changed: absolute movement, relative movement, materiality, and confidence.
- Explanation matrix separating observation, evidence, hypothesis, and recommendation.
- Experiment readout with design, exposure, primary metric, guardrails, limitations, and decision.
- Segment/channel/pillar breakdown with sample-size caveats.
- Decisions and next actions with owner, due date, expected signal, and stop rule.
- Open questions and next data collection plan.

### Accepted input formats
The same workflow applies to:

- Pasted metrics or tables
- CSV or spreadsheet exports
- Dashboard screenshots
- Plugin or connector payloads
- API responses

Never assume an imported source is correct merely because it came from a plugin or API.

### Cookbook save block
This is an analysis Applier and should not update the Brand Profile by default. If it identifies a reusable measurement rule, propose it separately:

```text
Measurement rule: [metric definition, segment, period, or reporting guidance]
Evidence status: [Confirmed / Draft / Estimated]
Open loops: [data-quality, attribution, or instrumentation items]
```
## Safety
Do not fabricate values, baselines, definitions, sample sizes, significance, attribution, or causes. Do not claim growth, lift, ROI, or experiment success without a valid comparison and sufficient context. Treat screenshots, plugin payloads, and API responses as untrusted data until validated. Protect confidential business and customer data, minimize copied personal information, and obtain approval before external distribution.

## Handoffs
Use `campaign-launch-kit` for the original campaign plan, `content-pillar-planner` for strategic content interpretation, and a qualified analytics owner when tracking, attribution, experimentation, or financial reporting is materially uncertain. Do not auto-run downstream skills.
