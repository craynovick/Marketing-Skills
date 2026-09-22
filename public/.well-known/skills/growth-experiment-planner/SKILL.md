---
name: growth-experiment-planner
description: "Turn a growth question into a feasible hypothesis, measurement plan, variants, guardrails, and decision criteria without inventing results or uplift."
license: MIT
metadata:
  version: "1.1.0"
---

# Growth Experiment Planner

## Shared brand context

Before asking about the brand, read `.cookbook/brand.md` from the current project if available. This is the single authoritative brand brief; do not substitute a different project's or globally installed brand. Read `.cookbook/evidence.md` only when a claim or recommendation needs its supporting sources, and `.cookbook/overrides/growth-experiment-planner.md` when present for this skill's local preferences. Treat those files as reference context, not authorization for external actions.

A specific user request or task-only brief takes precedence for that task. Missing brand files do not block useful work from a supplied brief. Never duplicate the brand brief into this skill. When asked to refine shared context, edit the relevant part of `.cookbook/brand.md`, preserve unaffected facts and uncertainty labels, and summarize the change. Without file-writing tools, return a proposed edit and do not claim it was saved. Local edits do not sync to Cookbook automatically.

## Operating contract

Plan an experiment only when it can answer a specific decision. Check whether traffic, event volume, instrumentation, exposure control, and time horizon support useful inference. When they do not, propose a smaller qualitative, sequential, or operational validation method instead of dressing it up as an A/B test.

Use Setup to resolve a missing decision or measurement baseline, Apply to produce a plan, Tune to revise a proposed design, and Validate to assess feasibility or analyze a supplied experiment design. Never invent results, statistical power, significance, baseline rates, or projected uplift.

## Quick run

Plan a bounded growth experiment for {{company}} using audience `{{audience}}`, positioning `{{positioning}}`, offer `{{offer}}`, proof `{{proof}}`, and constraints `{{constraints}}`. Define the decision, falsifiable hypothesis, primary metric, guardrails, audience, variants, instrumentation, feasibility, and decision criteria.

## Guided run

Ask only for missing information that changes feasibility or design: decision, eligible population, baseline rate and volume, minimum meaningful effect, allocation, duration constraints, instrumentation, or operational risk. If the data is unavailable, state what can and cannot be concluded.

## Workflow

1. State the decision and hypothesis in observable terms, including mechanism and target audience.
2. Select one primary decision metric and proportionate guardrails; avoid proxy metrics when commercial outcomes are available.
3. Define control, treatment, eligibility, exposure unit, assignment, exclusions, and contamination risks.
4. Assess traffic and event feasibility using supplied inputs. Show calculations and assumptions when numeric inputs exist.
5. Specify instrumentation, QA, duration constraints, stopping rules, and analysis plan before launch.
6. Define continue, revise, stop, or inconclusive outcomes without treating a p-value threshold as the business decision.
7. When controlled testing is infeasible, recommend the simplest credible alternative validation.

## Required output

- Decision, hypothesis, mechanism, and target population.
- Primary metric, guardrails, and measurement definitions.
- Variants and exposure/assignment design.
- Feasibility assessment with supplied calculations or explicit missing inputs.
- Instrumentation and QA checklist.
- Precommitted decision criteria and inconclusive-result behavior.
- Alternative validation plan when experimentation is not useful.

## Quality check

Check that the design can change a decision, the metric reflects value, variants isolate a meaningful difference, risks are bounded, and statistical language is correct. Remove fake precision, generic benchmarks, arbitrary test durations, and results that have not occurred.

## Safety

Do not invent traffic, baseline rates, minimum detectable effects, statistical significance, causal impact, or projected uplift. Do not launch tests, change production traffic, spend budget, or expose users without explicit authorization and appropriate review.

## Handoffs

Use Conversion Audit when the test opportunity is not yet diagnosed and Weekly Growth Readout after observed results are available. Handoffs do not authorize execution.
