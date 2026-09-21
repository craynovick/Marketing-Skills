# Portable brand packs release

## Scope

The default `/create` is Describe → Review → Install. The previous workspace remains reachable at `/create?legacy=1` and existing task/view/mode/workflow links. Its data and approvals are not migrated or overwritten.

22 marketing skills ship under `skills/`, generated from `content/skills/`. Both are MIT licensed; the license does not cover application code. `cookbook-brand-context` maintains `.cookbook/brand.md`; every marketing skill reads it. Evidence and local procedural overrides remain separate. Local context is authoritative after export, with no automatic website synchronization.

The public command is `npx skills add https://www.cookbook.to` using the public well-known skill distribution. The private flow downloads a self-contained installer, then runs `node ~/Downloads/cookbook-install.mjs --agent codex` or `--agent claude-code` in the user's project. This is a download plus one command, not a published npm package. The download contains private brand context: keep it private along with the installed brief.

## Runtime and rollout

1. Apply `supabase/migrations/20260922000000_portable_brand_packs.sql` once. It creates two new RLS-protected tables and a transactional owner/version-checked mutation function. No existing tables or records are changed.
2. Existing Supabase public configuration, service role, and Vercel AI Gateway configuration must be valid. The service role is used only inside durable workflow steps.
3. Set `COOKBOOK_BRAND_PACKS_ENABLED=true` on the target Vercel environment after the schema is present; deploy the application. The default is false. Public installation works independently of this flag.
4. Verify a signed-in create, website research, review/save, and private installer download. Verify non-owner access fails. Retry a failed run and cancel an active run. Finish with a browser smoke check of existing workspace links.
5. Verify the public CLI command against the deployed well-known index. Synchronize the committed source to GitHub when repository write access is available.

For a standalone Node deployment, copy `public/` and `.next/static/` into `.next/standalone/` before starting its server. Vercel handles these assets automatically.

## Resource and integrity limits

- 20 packs per account per rolling day; four research attempts per rolling day, including failed attempts.
- Research reads at most six same-host public pages through the existing DNS-pinned scraper. Redirects are revalidated. Public search uses public excerpts, never the private intake brief. Synthesis uses the selected model and supplied private context.
- Model calls have bounded output, timeouts, and no automatic model retries. Independent search failure is reported in coverage and permits official-source-only synthesis.
- Stored evidence is bounded; generated citation IDs and URLs must refer to supplied evidence. This checks references, not whether every claim is entailed by its source. Users review provisional output.
- Duplicate workflow starts cannot claim the same attempt twice. Cancelled or superseded workers cannot write late results. A stalled queued run can be stopped after returning to the page.
- Saves require a matching revision. Conflicts preserve the editor's local draft for copying.
- Private exports require the owner and use no-store responses. Installer payloads are data, not interpolated code. The installer rejects traversal, symlinks, unrelated brands, and conflicting local files before writing. Updates replace only unchanged managed skill files. Removal retains brand context, evidence, and overrides.

## Verification evidence

- Production Next.js build and TypeScript check passed.
- Full pre-existing and new test suite passed; final counts are recorded in the task's release report.
- Actual generated installer was downloaded from the standalone production server and executed in a temporary project by automated tests; both Codex and Claude Code paths, updates, dry runs, collisions, and removal were verified.
- Desktop and 390px mobile browser checks covered the setup page, installation app selector, copy feedback, and homepage navigation.
- SQL tests execute the actual migration in PGlite, including owner isolation, direct-write rejection, quotas, idempotency, stale saves, and cancellation.
- Workflow tests simulate duplicate starts, a cancellation during synthesis, superseded jobs, market-search failure, and dispatch failure. These are distinct from deployed provider verification.
- The independent Brand Context forward test is retained under `docs/evaluations/brand-context-2026-09-22/`. It is not a competitor benchmark. Fixture validation covers 22 skills in five modes; that checks coverage, not generated-output quality across all skills.

## Rollback

Set `COOKBOOK_BRAND_PACKS_ENABLED=false` and redeploy, or restore the prior Vercel deployment. Leave the additive tables intact so users' packs and collected evidence remain recoverable. Do not drop them as part of rollback. Local installations remain usable independently.

## Follow-on work

A comparative output benchmark across business models is needed before claiming the library is better than competitors. Additional search/citation quality evaluations and durable workflow telemetry are useful next steps. More hosted editing controls, automatic two-way synchronization, and a custom npm CLI are deliberately outside this release.

## Hosted verification — 2026-09-22

- Supabase migration `20260922000000` was applied transactionally and recorded in `supabase_migrations.schema_migrations`. Its stored SQL MD5 matches the repository: `17c424b9ae55179f3d43612081133e90`. RLS is enabled and authenticated direct INSERT is revoked.
- `COOKBOOK_BRAND_PACKS_ENABLED=true` is configured in Vercel Production.
- Deployment `dpl_6WPP4AbfvGfctx8zW9rwpQdYx1s5` / `marketing-skills-guypvwmqj-craytreez.vercel.app` was promoted and verified on cookbook.to. Later release revisions preserve the same migration and environment setup.
- A separate Release QA pack was created through the signed-in UI. The initial run collected sources but rejected a generated citation. Its draft and evidence survived, and saving provisionally reached the install step. URL normalization and category-based queries were corrected and regression-tested.
- The retry completed with six official pages and six public search excerpts, producing all six sections with positioning tradeoffs, buyer objections, two original voice examples, a resource-bounded content plan, source IDs, and evidence limitations. The resulting brief saved and reached installation.
- The private download emitted a browser download event; an unauthenticated request to the same export returned 401. Actual package execution is covered by local installer tests.
- The official skills CLI discovered and installed all 22 skills from `https://www.cookbook.to` into an isolated project for both Codex and Claude Code. No private brand context was included in that public distribution.
- The previous workspace still opens with the existing brands and saved work.
- All 74 tests pass. GitHub's Verify Cookbook workflow passed for the same code tree used by the verified deployment. Targeted citation tests also cover canonical URLs, Markdown/code delimiters, grouped IDs, and ranges.

The QA pack is intentionally labeled separately and retained for inspection. No existing brand or foundation was modified by this verification. Comparative superiority and broad live-provider reliability across multiple business models remain unproven.
