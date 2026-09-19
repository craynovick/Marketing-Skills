# Connect your AI app to Cookbook

Cookbook supplies recipes, approved brand context, and storage. Your AI app generates the content using its own subscription or model credentials. No external integration can accept brand changes or publish content.

## Install the connector

Requirements: Node.js 22 or later, and Codex CLI or Claude Code available in your terminal.

From the source repository (see `/docs/self-host#licensing` for the current licensing status):

```sh
git clone https://github.com/craynovick/Marketing-Skills.git
cd Marketing-Skills
corepack enable
pnpm install --frozen-lockfile
pnpm build:mcp
npm install -g ./packages/cookbook-mcp
```

Maintainers can publish the built connector through the `cookbook-mcp-v*` GitHub release workflow. A release includes `cookbook-mcp-connector-VERSION.tgz` and its SHA-256 checksum. Download a published release asset, verify its checksum, then run `npm install -g ./cookbook-mcp-connector-VERSION.tgz`. Do not assume a release exists until it appears in GitHub Releases.

## Connect

In Cookbook, open **Settings → Connect your AI app**. Create a named connection with the permissions you want. Copy its key; it is shown only once and expires after 90 days.

In a terminal, or the terminal available to your AI app, run one of:

```sh
cookbook connect --client codex
cookbook connect --client claude-code
```

Paste the key into the hidden prompt. Do not paste it into an AI conversation, a shell argument, a repository, or browser storage. Restart the AI app if necessary. The command verifies the connection before registering it and refuses to overwrite an existing `cookbook` registration. Use `--name cookbook-work` for another registration.

For a self-hosted installation:

```sh
cookbook connect --client codex --url https://cookbook.example.com
```

For other clients, `cookbook connect --client manual` prints an MCP configuration containing only the local executable and credential-file path. It does not print the key. The credential file is restricted to your local user (mode 0600); protect your operating-system account. Revoke the connection in Cookbook Settings if the file is exposed.

Copyable prompt for an AI app:

> Help me connect this app to Cookbook using the official repository's connector. Use the documented client-specific setup command and let me enter the connection key privately in my terminal. Once connected, list recipes and read my approved brand context. Do not accept or publish any changes.

Direct remote clients may connect to `https://www.cookbook.to/mcp` with an Authorization bearer header. This launch uses manually configured connection keys, not OAuth. Browser-only clients that require OAuth are not supported yet. Codex and Claude Code are the initial verification targets; other clients are not guaranteed until tested.

## Use

Ask your AI app to list Cookbook recipes, load one, and read your approved brand context. It can propose changes with `update_brand_context`; follow the returned review URL to Keep, Edit, or Skip them. Only kept versions are returned as approved context.

Free hosted accounts have foundational storage and one successful website import plus three successful same-site follow-ups, each capped at six pages. Follow-ups must name an unfinished foundation and missing evidence. Marking setup complete ends free scanning. Manual and external-agent foundation editing remains available. General deliverable storage and non-foundational hosted workflows require paid hosting. All recipes remain available for use in your own AI app.

## API contract

`GET /api/v1/skills` and `GET /api/v1/skills/:slug` are public when integrations are enabled. Private endpoints use `Authorization: Bearer <connection key>` and return `Cache-Control: no-store`.

- `GET /api/v1/connection`: connection, permissions, and entitlements.
- `GET /api/v1/pantry`: all six sections, approved content/version, latest draft version, and pending-update status.
- `PATCH /api/v1/pantry`: `{requestId, updates:[{key, content, expectedVersion, sources}], agentName?}`.
- `POST /api/v1/artifacts`: `{requestId, skillSlug, title, contentMarkdown, metadata?, agentName?}`.
- `GET /api/v1/artifacts?limit=20&cursor=...`: summaries and an opaque `nextCursor`.
- `GET /api/v1/artifacts/:id`: an owned deliverable with its latest document.

Section keys: `brand`, `audience`, `voice`, `content`, `proof`, `guardrails`. Foundation content needs one Markdown H1 and at most 20,000 characters. Deliverables allow 60,000 characters; metadata allows 8,000 serialized characters. Sources are up to 20 public HTTP(S) reference URLs; storing a source does not fetch it.

Use a stable UUID request ID when retrying a write. Identical retries return the original result; changed payloads return `IDEMPOTENCY_CONFLICT`. For updates, pass `latestVersion` as `expectedVersion`, not `approvedVersion`. On `STALE_VERSION`, retrieve and review the newer context before issuing a new request.

Connection scopes: `context:read`, `foundations:write`, `artifacts:write`. A write scope does not bypass the hosting plan. There is no accept scope. Each connection is bound to one owned project. Recipe metadata follows the catalog's categories; complexity is normalized to lowercase.

MCP tools: `list_recipes`, `get_recipe`, `get_brand_context`, `update_brand_context`, `save_deliverable`, `list_deliverables`, `get_deliverable`. Recipe modes: setup, apply, tune, validate. Resources: `cookbook://pantry/brand-context`, `cookbook://recipes/{slug}`. The `customer-interview-synthesizer` prompt takes `interview_notes` and optional `research_goal`; rendering it makes no model request.

## Maintainer rollout

1. Preserve and verify the existing guided-brand changes; apply migrations in filename order through `20260919003000_cookbook_integrations.sql` on a preview database.
2. Configure the environment described in `docs/self-hosting.md`. Enable `COOKBOOK_V2_ENABLED` and `COOKBOOK_INTEGRATIONS_ENABLED` on that preview only.
3. Run chat, database, integration, protocol, lint, and production-build checks. Use two actual test users and active/free subscriptions to verify keys, isolation, proposals, review links, quota limits, and downgrade reads.
4. Connect actual Codex and Claude Code installations. Propose a voice change, confirm it remains pending, accept it in Cookbook, and read it again. Save a paid deliverable and reload its link.
5. Apply the additive production migration and enable the flags only after these checks pass. Monitor operation status/latency, conflicts, quota exhaustion, and authentication failures. Logs must not contain keys, full request payloads, or foundation content.

Rollback: disable `COOKBOOK_INTEGRATIONS_ENABLED`; existing stored data remains intact. This also restores the prior hosting policy, so monitor usage during rollback. Do not drop the new tables during rollback.

The SQL tests run real PostgreSQL-compatible transactions in PGlite. They do not establish that your deployed Supabase credentials, Vercel configuration, or real AI-client installations work. Those are separate preview release checks.
