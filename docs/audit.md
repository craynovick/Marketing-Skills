# Repository audit and skill catalog

Audited September 18, 2026. The repository contains 15 canonical `SKILL.md` files, a Next.js catalog app, Supabase/Stripe integrations, evaluation fixtures, and generated/build artifacts (`.next/`, `out/`, `node_modules/`) that are not source.

## Skill inventory

| Skill | Target use case | Required inputs | Expected output | Current structure |
|---|---|---|---|---|
| Audience Strategy Playbook | Beachhead audience and message choice | Customers, offer, research evidence | Audience strategy playbook | Workflow, evidence rules, handoffs |
| Brand Claims & Confidentiality Guide | Claims, proof, privacy governance | Claims, constraints, owner, context | Claims/confidentiality guide | Workflow, safety, handoffs |
| Brand Positioning Workshop | Differentiated positioning | Product, audience, competitors, proof | Positioning brief | Workflow, safety, handoffs |
| Brand Voice Guide | Repeatable voice rules | Company, writing samples, tone constraints | Brand voice guide | Workflow, safety, handoffs |
| Campaign Launch Kit | Coordinated campaign planning | Goal, offer, timeline, brand context | Campaign launch kit | Workflow, launch gates, handoffs |
| Case Study Creator | Permissioned customer story | Customer notes, results, approval | Case study outline | Workflow, safety, handoffs |
| Competitive Intelligence Brief | Competitor and market analysis | Competitors, market, research notes | Intelligence brief | Standalone workflow |
| Content Format Planner | Channel and production choices | Objective, sources, channels, context | Format playbook | Workflow, safety, handoffs |
| Content Pillar Planner | Focused content system | Priorities, audience problems, proof | Pillar plan | Workflow, safety, handoffs |
| Content Repurposing Engine | Source-to-channel adaptation | Source content, channels, audience | Repurposing plan | Workflow, safety, handoffs |
| Customer Interview Synthesizer | Traceable research themes | Interview notes, goal, segment | Interview synthesis | Workflow, evidence rules, handoffs |
| Ideal Customer Profile Builder | Testable ICP | Customer signals, offer, constraints | Ideal customer profile | Workflow, safety, handoffs |
| Landing Page Copywriter | Conversion page copy | Offer, audience, proof, context | Landing page copy deck | Workflow, safety, handoffs |
| SEO Content Brief | Search-aware editorial brief | Topic, audience, intent, context | SEO content brief | Workflow, safety, handoffs |
| Weekly Growth Readout | Growth-data decision support | Metrics, experiments, changes, metadata | Weekly growth readout | Workflow, data-quality rules |

## Standardization completed

Every canonical skill now includes `title`, `parameters`, and `models` alongside its existing `name`, `category`, `description`, `version`, `inputs`, `output`, complexity, profile, and workflow metadata. The catalog generator parses these list fields and publishes them into generated metadata.

The canonical path remains `content/skills/<slug>/SKILL.md` so skill-local assets and evaluation notes can live together. For an open-source release surface, export the same files to this structure rather than keeping two handwritten copies:

```text
skills/
  analytics/weekly-growth-readout/SKILL.md
  campaigns/campaign-launch-kit/SKILL.md
  content/<skill>/SKILL.md
  conversion/landing-page-copywriter/SKILL.md
  governance/brand-claims-confidentiality-guide/SKILL.md
  research/<skill>/SKILL.md
  strategy/<skill>/SKILL.md
docs/
evals/<skill>/{setup,apply,tune,validate,safety}.md
runner/                      # future provider-neutral BYOK runner
```

## Product gaps before public managed launch

- The existing Stripe plans are Free / $29 Pro / $79 Team; they have not been migrated to the proposed $6 managed plan.
- The app accepts an optional AI Gateway key, but a provider-neutral BYOK runner and usage ledger do not yet exist.
- Add an OSI-approved license, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and CI before publishing.
