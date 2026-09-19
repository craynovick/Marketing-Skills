# Docs and About: push and publication checklist

Verified locally on 2026-09-19. The copy is ready for GitHub review alongside the integration implementation. This is not approval to publish the launch copy independently or deploy production.

## Completed locally

- [x] Docs, FAQ, and About preserve recipes, foundations, and reviewed deliverables as the core story. Connections remain an additional way to work.
- [x] All nine affected routes render. Mobile checks covered every docs page and About at a measured 354px viewport; FAQ and self-hosting were also checked at 409px. Fixed long inline code wrapping in the self-hosting guide. Mobile menu, FAQ navigation, current-page semantics, and the licensing anchor work. No browser console errors were captured.
- [x] Production `pnpm build` succeeds, including TypeScript and static generation. Standalone TypeScript checking also passes.
- [x] Full ESLint completes with zero errors and 28 existing warnings outside the edited docs/About files. Edited docs/About lint is clean. `git diff --check` passes.
- [x] Fourteen database/API/integration checks pass, covering project ownership, scopes, approved versus pending context, atomic proposals, paid saves, downgrade reads, scan allowances, and failed scan release.
- [x] Four MCP checks pass, covering remote and local transports, redirect refusal, hidden key entry, private credential files, and simulated Codex/Claude Code registrations. An earlier macOS interactive harness timeout was resolved in concurrent integration work; the updated suite passes.
- [x] Sixteen chat, streaming, and saved-work checks pass.
- [x] Connector source build succeeds; CLI help matches the documented commands. Package dry-run succeeds. No real credentials or client registrations were created by this task.
- [x] Source paths, repository remote, feature flags, and documented contracts reviewed. Removed premature open-source wording from the integration guide and README while preserving unrelated edits and prices.

## Required before public launch

- [ ] Make the intended repository publicly accessible and recheck all GitHub links. The configured URL, `https://github.com/craynovick/Marketing-Skills`, returned HTTP 404 to an unauthenticated request during verification. This does not establish whether it is private or missing.
- [ ] Declare a repository license and its scope. Update the licensing page, FAQ, README, and About consistently. Until then, do not describe the project as open source or grant reuse permissions.
- [ ] Run configured-preview checks with real free and paid accounts: sign-in, foundation review and acceptance, scan allowance, paid deliverable save/reload, downgrade access, revocation, and project isolation. Local tests do not verify deployed credentials or entitlements.
- [ ] Test actual Codex, Claude Code, and manual client setup against that preview. Automated registration checks use simulated client CLIs.
- [ ] Publish and verify a versioned connector archive and checksum, then document its exact download/install command. The release workflow was reviewed but not executed. Its current package file list includes test bundles under `dist`; narrow the published files before the release. Source-build instructions are already documented.
- [ ] Exercise self-hosting against a fresh Supabase installation with migrations, authentication URLs, model configuration, durable workflow runtime, backups, and restore. No configured local `.env.local` was available for this check.
- [ ] Verify Docker separately before recommending it for production. Compose supplies runtime environment variables; public Next.js variables need build-time configuration. The repository currently lacks `.dockerignore`, so exclude local secrets and generated artifacts from the build context before building with real credentials. Container startup was not verified.
- [ ] Apply additive migrations to staging before production and enable feature flags only after preview checks pass. Hosted production must use `COOKBOOK_DEPLOYMENT=hosted`. Disable the integration flag for rollback; preserve stored data.

## Push handoff

No commit, push, release tag, deployment, or production migration was performed. The working tree includes substantial concurrent changes; review and stage the intended complete change set rather than using an indiscriminate `git add .`. A push that automatically deploys production must wait for the publication prerequisites above.

Documentation remains static server-rendered content with shared navigation and page rendering; no additional dependencies or client-side behavior were introduced for the copy or mobile fix.
