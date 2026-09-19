# Self-host Cookbook

The repository contains the marketing skills, Cookbook agent instructions, web application, API, and MCP connector. You operate your own installation, credentials, database, upgrades, and backups. No managed self-hosting service is included.

## Database and configuration

Use a separate Supabase project, or a local Supabase installation. Apply every SQL file in `supabase/migrations` in filename order. With a linked Supabase CLI project, review `supabase db push --dry-run` before `supabase db push`. Local Supabase can apply the same migrations. Never run a reset against a database holding user data.

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: your database's public app settings.
- `SUPABASE_SERVICE_ROLE_KEY`: server only; required for background workers, connection authentication, and quota transactions. Never expose it to the browser or MCP client.
- `NEXT_PUBLIC_APP_URL`: the exact public origin, such as `https://cookbook.example.com`; use `http://localhost:3000` for local development. Configure Supabase Auth redirect URLs for this origin.
- `COOKBOOK_V2_ENABLED=true`: after applying and verifying the guided-brand migration.
- `COOKBOOK_INTEGRATIONS_ENABLED=true`: after applying and verifying the integration migration.
- `COOKBOOK_DEPLOYMENT=self-hosted`: disables commercial hosting gates on the server. Authentication, ownership checks, bounded requests, and operational rate limits remain enabled. Hosted production must use `hosted`.
- `AI_GATEWAY_API_KEY`: required only for generation inside the hosted app, using the existing gateway adapter. External MCP clients use their own model access.

Provider-specific OpenAI, Anthropic, and Google BYOK routing is not implemented by this integration. Supplying those keys alone does not enable the internal runner. Using recipes in your own AI app needs no Cookbook model key.

## Run

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

For production, use `pnpm build` and `pnpm start`. The included Docker Compose setup is a starting point, not a verified production deployment: before building, exclude local secrets from the Docker build context and supply public `NEXT_PUBLIC_*` configuration at build time. Compose's `env_file` supplies runtime variables only. Verify container startup, authentication, and Supabase connectivity before relying on it. Terminate HTTPS at your hosting platform or reverse proxy. Do not expose a development server publicly.

The background workflow runtime must be configured and verified for your hosting environment; REST/MCP data access does not require model generation or background workflows. Test guided generation separately before claiming full runner availability.

## Operations

Keep database backups and any attachment-storage backups together. Test a restore into a separate project before relying on it. Apply migrations to staging first. Set up regular cleanup of old failed scan reservations, cached scan evidence, expired connection operations, and rate windows according to your retention policy; preserve document history and active idempotency records.

Connection keys expire after 90 days and can be revoked in Settings. Rotate service credentials through your hosting secrets system. Never place `.env.local`, keys, or private brand material in GitHub releases.

Use `/docs/connect` or `docs/cookbook-integration.md` for the local connector and remote MCP configuration. The same connector accepts `--url` for your deployment. No SQLite or cloud-to-local data synchronization is provided.
