# Marketing Skills

Open, model-agnostic marketing workflows for turning evidence into usable strategy, content, campaigns, and reporting. Each skill is a portable `SKILL.md`: give it to an instruction-following LLM, supply the requested context, and receive a structured deliverable with evidence and safety guardrails.

## What is included

- 18 marketing skills, from interview synthesis and ICP definition through campaigns and growth readouts, including GTM strategy, offer/pricing, and sales enablement.
- A Next.js catalog for browsing and running the skill specifications.
- Five evaluation fixtures per skill, chat scenarios, an automated metadata validator, and source/export consistency tests.
- A Dockerized catalog deployment for self-hosting.

The repository includes the self-hosted application, but no source license is currently declared. Do not infer modification, redistribution, or commercial reuse permissions from source availability. Server-side generation currently uses AI Gateway; provider-specific BYOK routing remains future work. A Managed Cloud plan is specified in [docs/pricing.md](docs/pricing.md): $6/month for hosting, updates, and team workspaces, plus transparent model usage.

## Use a skill locally

1. Pick a file under `content/skills/`.
2. Paste its contents into your preferred agent or make it available as that agent's skill/instruction file.
3. Supply the input listed in frontmatter; the Guided run will collect missing essentials.
4. Review the structured result before using it externally. Skills never authorize publishing, outreach, spend, or unreviewed claims.

For the catalog app:

```bash
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Rebuild catalog metadata after editing a skill:

```bash
pnpm build:skills
pnpm eval:skills
pnpm test:skills
```

## Self-host with Docker

Copy `.env.example` to `.env.local`, set only the integrations you use, then run:

```bash
docker compose up --build
```

The catalog is available at `http://localhost:3000`. The current app supports the optional `AI_GATEWAY_API_KEY` analysis integration; provider-specific BYOK routing (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `GOOGLE_GENERATIVE_AI_API_KEY`) is documented as the next runner milestone and is not yet wired into the server routes. You can always use the portable Markdown skills directly with any provider.

Do not put API keys in skill files, commits, client-side environment variables, or browser storage. Keep them server-side in your self-hosted deployment.

## Skill format

Source skills live in `content/skills/<slug>/SKILL.md`. The supported schema and copy-ready template are in [docs/SKILL_TEMPLATE.md](docs/SKILL_TEMPLATE.md). The build script reads frontmatter into `lib/generated-skills.ts`; edit the source Markdown, never the generated file.

## Contribute

1. Open an issue to propose a workflow or identify a gap.
2. Create `content/skills/<your-skill>/SKILL.md` from the template.
3. Include clear inputs, a deterministic deliverable shape, evidence rules, safety limits, and handoffs.
4. Add evaluation fixtures under `evals/<your-skill>/` for setup, apply, tune, validate, and safety modes.
5. Run `pnpm build:skills`, `pnpm eval:skills`, and `pnpm lint`, then open a pull request.

Contributions must be original, model/provider neutral, and safe to redistribute. Do not include customer-confidential material, API keys, or unlicensed content.

## Repository map

```text
content/skills/       Canonical skill Markdown
docs/                 Packaging, audit, and pricing documents
evals/                Skill quality fixtures and rubric
scripts/              Catalog generation and validation
app/, components/     Next.js catalog and hosted-app UI
lib/                  Catalog, billing, and integration code
supabase/migrations/  Optional managed/self-hosted persistence schema
```

See [docs/audit.md](docs/audit.md) for the current skill inventory and architecture findings.

## Connect your AI app

The API and MCP integration exposes recipes, approved brand context, reviewable foundation proposals, and paid hosted deliverable storage. See [connection and API instructions](docs/cookbook-integration.md) and [self-hosting](docs/self-hosting.md). Enable integrations only after migrations and configured-preview checks.
