# Marketing Skills

A Next.js catalog of curated, reviewed marketing workflows with optional Supabase-backed Cookbook sync.

## Run locally

```bash
pnpm install
pnpm dev
```

The catalog content lives in `content/skills/*/SKILL.md`. `scripts/build-skills.mjs` reads the Markdown sources and generates `lib/generated-skills.ts` for the site. Edit skills as normal Markdown, then run `pnpm build:skills` to update the catalog.

The library follows a workflow order. Foundational skills establish evidence, audience, positioning, voice, pillars, and proof/constraints. Applied skills consume that context to create content, campaigns, formats, and readouts. Every skill also works standalone: its Guided run asks for missing context in the agent chat.

## Cookbook accounts

Visitors can draft a Cookbook in browser storage without an account. Signing in with an email and password saves one account-owned Cookbook and automatically applies it across skills. When an account has no saved profile, a local draft is migrated on sign-in. An existing account Cookbook always wins, so a device-local draft is never silently overwritten into the account.

Create the `cookbooks` table and row-level-security policy by applying [supabase/migrations/20260917000000_cookbooks.sql](supabase/migrations/20260917000000_cookbooks.sql). Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_TEAM=
SUPABASE_SERVICE_ROLE_KEY=
AI_GATEWAY_API_KEY= # optional; enables website analysis
```

In Supabase Auth, enable the Email provider, add `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/update-password`, and the corresponding production URLs as redirect URLs, and set the production URL as the Site URL. Apply the billing migration, create matching Stripe recurring prices, and configure the Stripe customer portal. Register `/api/webhooks/stripe` as a Stripe webhook for checkout completion and subscription lifecycle events. The first website analysis remains optional for free users; Pro and Team users can analyze unlimited public websites. Model execution and publishing integrations are still out of scope.
