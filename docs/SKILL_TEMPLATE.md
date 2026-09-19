# Skill package template

Use one folder per skill: `content/skills/<slug>/SKILL.md`. `name` is a human-readable unique identifier; `title` is display copy; `parameters` are stable context keys, while `inputs` explain the material a user supplies.

```md
---
name: Example Skill
title: Example Skill
category: Strategy
description: One sentence describing the decision or deliverable this skill creates.
version: 1.0.0
complexity: Medium
inputs:
  - Existing evidence or source material
  - Decision owner and desired outcome
parameters:
  - company
  - audience
  - proof
  - constraints
models:
  - any-instruction-following-llm
output: structured example deliverable
featured: false
writes_profile: []
requires_profile: []
upstream: []
downstream: []
---

# Example Skill

## Quick run

State the task, use the supplied `{{parameters}}`, identify unsupported assumptions, and return the required output.

## Guided run

Ask only for missing information that materially changes the decision. Allow the user to proceed with gaps, clearly marked `Estimated` or `[needs source]`.

## Workflow

1. Define the decision and evidence quality.
2. Analyze only supplied or approved evidence.
3. Produce the structured deliverable.
4. Record assumptions, validation actions, and an explicit handoff.

## Required output

Define the exact headings, tables, and fields the user receives.

## Evidence rules

Distinguish measured facts, customer quotes, and estimates. Never invent evidence, metrics, approval, or permission.

## Handoffs

Name relevant upstream and downstream skills. Do not run them automatically.

## Safety

State external-action, privacy, claims, and regulated-domain limits. Require human approval before publication or irreversible action.
```

## Required fields

| Field | Meaning |
|---|---|
| `name`, `title` | Stable human-readable identifier and display title. |
| `category`, `description`, `version` | Discovery metadata and semantic version. |
| `inputs`, `parameters` | User-provided material and reusable context keys. |
| `models` | Compatible model classes; use provider-neutral labels. |
| `output`, `complexity` | Expected deliverable and estimated operating complexity. |
| `writes_profile`, `requires_profile` | Shared-context contract. |
| `upstream`, `downstream` | Optional workflow relationships. |

Use `any-instruction-following-llm` unless the skill truly needs a capability such as vision, browsing, or code execution. Add those capabilities explicitly instead of naming a vendor model.
