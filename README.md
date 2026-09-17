# Marketing Skills

A static-first Next.js catalog of curated, reviewed marketing workflows.

## Run locally

```bash
pnpm install
pnpm dev
```

The catalog content lives in `content/skills/*/SKILL.md`. `scripts/build-skills.mjs` reads the Markdown sources and generates `lib/generated-skills.ts` for the site. Edit skills as normal Markdown, then run `pnpm build:skills` to update the catalog.

The library follows a workflow order. Foundational skills establish evidence, audience, positioning, voice, pillars, and proof/constraints. Applied skills consume that context to create content, campaigns, formats, and readouts. Every skill also works standalone: its Guided run asks for missing context in the agent chat.

## V1 boundaries

There is no database, tracking, account system, model execution, or server-side collection of configurator inputs. The Cookbook profile is currently stored only in the user’s browser and is optional. Deploy with `pnpm build` to produce a static export.
