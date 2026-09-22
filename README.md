# Cookbook — Marketing Skills

22 marketing skills for creating clear strategy, on-brand content, campaigns, and growth reports in Codex, Claude Code, and other AI agents.

[Cookbook](https://www.cookbook.to) helps you discover and install the skills. Brand setup, day-to-day work, and refinements happen in your own AI app, with one shared brand brief for the project.

## Install

```sh
npx skills add https://www.cookbook.to
```

Choose your agent when prompted, or add `--agent codex` or `--agent claude-code`. No Cookbook account is required. See the [install guide](https://www.cookbook.to/docs/install) for setup and the downloadable offline installer.

Installation makes the skills available; it does not automatically start a conversation. Ask your AI app to use a skill for your next task. For initial brand setup, ask it to use `cookbook-brand-context`.

## One shared brand brief

Brand Context is the foundational skill. It reviews existing project context, asks for missing essentials, and can research your business when browsing tools are available. Review the proposed brief before using it across your marketing work.

- `.cookbook/brand.md` — the project's shared brand identity, audience, voice, content direction, proof, and guardrails.
- `.cookbook/evidence.md` — supporting sources and research limitations.
- `.cookbook/overrides/<skill-name>.md` — your preferences for an individual skill.

Keep one brand per project. Refine the brief in your AI app as the business changes; every marketing skill reads the same context. Local changes do not sync to the website.

## What is included

- 22 portable `SKILL.md` packages covering brand context, customer research, positioning, writing, campaigns, conversion, sales enablement, and growth analysis.
- A searchable website catalog with skill details and one-command installation.
- A downloadable installer for Codex and Claude Code that preserves existing local brand context and refuses to overwrite conflicting skill edits.
- Five evaluation fixtures per skill, metadata validation, source/export consistency checks, and automated regression tests. Fixtures support quality assessment; they do not establish superiority over other libraries.

The skills guide work using the tools available in your AI app. They do not add browsing or publishing capabilities, and they do not authorize outreach, spending, or external publication. Review claims and outputs before use.

## License

The marketing skills in `content/skills/` and generated `skills/` are MIT licensed; see [the skill-library license](content/skills/LICENSE). The website application and hosted services are not covered by that license; no application license is declared.

## Develop the catalog

Requires Node.js 22+ and pnpm. To run the Next.js app:

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
content/skills/        Canonical skill Markdown and library license
skills/                Generated installable skill packages
public/.well-known/skills/  Public skill discovery and distribution
evals/                 Skill evaluation fixtures and rubrics
scripts/               Generation and validation tools
app/, components/      Next.js catalog and application UI
lib/                   Catalog and application services
packages/cookbook-installer/  Self-contained download installer
docs/                  Setup, format, and architecture documentation
supabase/migrations/   Hosted application persistence schema
```

## Optional application infrastructure

This repository also retains hosted account, saved-pack, and API/MCP infrastructure. These are optional and are not required to install the library or maintain brand context in your AI app. The default `/create` route leads to the install guide.

For application deployment, see [self-hosting](docs/self-hosting.md). For the optional integration surface, see [API/MCP documentation](docs/cookbook-integration.md). Configure only the services you use, and keep credentials out of skill files and client-side code.
