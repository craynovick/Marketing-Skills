# API and MCP implementation verification

Implemented locally on September 19, 2026. No commit, push, GitHub release publication, remote database migration, or production flag change was performed.

## Implemented

- Shared versioned REST and MCP services over existing Cookbook foundations, proposals, tasks, and documents.
- Project-bound hashed keys, scoped access, expiry/revocation, private cache headers, origin checks, bounded bodies, pagination, and transactional retry protection.
- Review-only foundation writes with integration provenance; paid deliverable storage; preserved read access after downgrade.
- Remote stateless MCP using mcp-handler 2.2.0 and server SDK 2.0.0. Legacy SDK 1.30.0 is a development-only compatibility-test dependency.
- Standalone stdio connector, hidden key entry, user-only credential files, Codex/Claude Code registration, manual configuration, and a tag-triggered GitHub release workflow.
- Shared hosted access checks and website quota accounting. Successful evidence import precedes quota consumption; failures release reservations. Four successful same-site scans are allowed for free setup, with unfinished-foundation/evidence-gap checks on follow-ups.
- Bounded public website fetching with DNS pinning, redirect validation, private-address rejection, and timeouts.
- Connection settings, setup allowance display, public connection/self-hosting docs, and the self-hosted commercial-gate setting.

The workspace also contains pre-existing and concurrent guided-brand, navigation, and content work. This report describes integration verification, not a separate review of every unrelated change.

## Evidence

- Production build: passed with `next build --webpack`, including TypeScript and all new routes. The initial sandboxed Turbopack build stalled and was stopped. A missing client directive in the settings error boundary was corrected before the successful build.
- Full ESLint: no errors. Existing unrelated warnings remain.
- App/API/database/stream checks: 27 tests passed across chat (10), foundation database (4), integration database (5), API/access/scraper (6), and stream (2) suites.
- MCP/connector checks: four tests passed using a real legacy SDK client and both HTTP/stdio transports. These include resources, prompts, review-only proposals, paid-operation denial, redirect rejection, and interactive installation with isolated mock Codex/Claude executables. The terminal harness uses Python's standard-library PTY support on macOS/Linux.
- The interactive test verified that keys are not echoed or embedded in registration arguments, credentials are mode 0600, registration preserves existing named connections, and the command completes. The initial PTY harness hung even for `echo`; replacing that harness resolved the false timeout.
- Live network scraper smoke check: example.com returned one bounded page with usable text. No account data or scan allowance was used.
- Local production HTTP checks: public recipe listing returned 15 recipes and HTTP 200; unauthenticated Pantry and MCP calls returned HTTP 401 with `no-store`.
- Browser: the local production connection guide rendered with setup instructions, permissions, API contracts, and review guidance.
- Standalone output tracing includes the existing agent and skill Markdown needed by the internal runner.
- Connector archive built successfully; contents are only package metadata, README, and bundled CLI. No credentials, test bundles, or repository data are included.

## Required configured-preview checks

No Supabase URL, publishable key, service-role key, or AI Gateway key was available in the local environment. Therefore these checks remain pending:

1. Apply the additive migrations to a disposable Supabase preview and enable both feature flags there.
2. Use two actual accounts and free/paid subscription states to verify private API access, row isolation, expiry/revocation, downgrade behavior, and concurrent writes/scans.
3. Connect actual Codex and Claude Code installations to that preview. Read context, propose a change, open its review link, accept it in Cookbook, and read the accepted version back.
4. Exercise website imports and follow-up scans through the actual agent; verify useful foundation outputs, failure recovery, and UI quota messaging. Test a paid deliverable and reload its saved link.
5. Publish the connector release and enable production only after preview acceptance passes. Keep current Stripe prices unchanged.

The migration is `supabase/migrations/20260919003000_cookbook_integrations.sql`. Connection/setup instructions and rollback guidance are in `docs/cookbook-integration.md`; environment setup is in `docs/self-hosting.md`.
