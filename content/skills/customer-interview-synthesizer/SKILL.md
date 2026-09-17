---
name: Customer Interview Synthesizer
description: Synthesize customer conversations into traceable themes, buying evidence, and validated open questions.
category: Research
complexity: Medium
inputs:
  - Interview notes
  - Research goal
  - Customer segment
  - Research question and decision
output: interview synthesis
version: 1.1.0
writes_profile:
  - audience
  - proof
requires_profile: []
upstream: []
downstream:
  - ideal-customer-profile-builder
  - audience-strategy-playbook
  - brand-claims-confidentiality-guide
---
# Customer Interview Synthesizer
## Quick run
Synthesize the supplied interviews into traceable themes, tensions, buying evidence, implications, and open questions for {{company}}. Use optional Cookbook context: audience `{{audience}}`, positioning `{{positioning}}`, offer `{{offer}}`, proof `{{proof}}`, and constraints `{{constraints}}`. Separate participant evidence from interpretation and recommendation. Preserve exact meaning and label anything not directly supported as `Estimated`.
## Guided run
Ask for the research decision, interview count, participant selection, dates, customer/prospect status, transcript or notes, consent/usage permissions, and known biases when missing. If the user proceeds with gaps, state the limitations. Tag observations by participant ID, context, evidence strength, and theme. Use quotes only with consent and remove identifying details.
## Workflow
1. State the research question, decision, sample size, recruitment method, participant context, recency, and limitations.
2. Create an observation ledger. Preserve participant wording, distinguish direct observation from analyst interpretation, and attach source location or interview ID.
3. Tag moments by trigger, job, pain, desired outcome, alternative, objection, buying role, proof statement, and constraint where supported.
4. Cluster themes using recurrence, intensity, specificity, and strategic relevance. Do not treat repetition alone as market prevalence.
5. Compare segments and divergent views. Surface disconfirming evidence and cases that do not fit the leading story.
6. Derive implications separately for ICP, audience strategy, positioning, content pillars, and proof. Mark recommendations as hypotheses, not findings.
7. Create an open-questions and validation plan with the next people to interview, evidence needed, and decision it will inform.
8. End with a proposed Cookbook update for audience/proof only when the evidence supports it. Never overwrite confirmed profile content automatically.
## Required output
Include:

- Research question, decision, sample/method caveats, consent status, and evidence limitations.
- Observation ledger with interview ID, anonymized participant context, exact or faithful paraphrase, source location, and evidence label.
- Theme table with recurrence, intensity, representative evidence, contradictions, and confidence.
- Trigger events, jobs, pains, desired outcomes, alternatives, objections, buying roles, and proof statements.
- Segment differences and disconfirming evidence.
- Separate implications for ICP, audience strategy, positioning, pillars, and proof.
- Quotes only when permission exists; otherwise use anonymized faithful paraphrases.
- Open questions, assumptions, and prioritized follow-up interviews or tests.

### Evidence labels
Use:

- `Customer quote`: participant wording, with permission status.
- `Measured`: a count or pattern within this supplied sample, not a market statistic.
- `Estimated`: analyst interpretation or hypothesis.
- `[needs source]`: material claim not supported by the supplied interviews.

### Cookbook save block
```text
Audience evidence: [supported audience, situation, job, pain, and desired outcome]
Proof candidates: [quotable or measurable evidence with permission status]
Evidence status: [Customer quote / Measured in sample / Estimated]
Limitations: [sample and method caveats]
Open loops: [questions and next interviews]
```
## Safety
Remove names, contact details, account identifiers, and sensitive personal information unless explicit authorization supports the exact use. Do not expose confidential transcripts. Never turn a small, self-selected, or mixed sample into a universal claim; report contradictions and caveats. Do not invent quotes, counts, consent, or customer outcomes. Obtain approval before downstream publication or profile updates.

## Handoffs
Use `ideal-customer-profile-builder` for audience qualification, `audience-strategy-playbook` for prioritization, and `brand-claims-confidentiality-guide` before reusing quotes, metrics, logos, or customer details. Do not auto-run downstream skills.
