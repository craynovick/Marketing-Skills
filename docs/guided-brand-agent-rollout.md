# Guided brand agent: implementation and release

Implemented September 19, 2026. The new experience is gated by `COOKBOOK_V2_ENABLED=true`; it defaults off. This document distinguishes local verification from the required hosted acceptance run.

## Implemented

- Three optional setup paths share the marketing conversation. The composer remains available for direct work. Returning users see foundation progress.
- Your Cookbook opens six readable foundations with proposals, source links, editing, history, acceptance, and Markdown export. Narrow screens use a full-width document panel. Document opening takes keyboard focus; Escape closes the panel when not editing.
- Brand proposals save atomically as drafts. Keep checks the exact displayed versions; Skip does not change confirmed memory. Operation keys prevent duplicate document versions. Existing profile fields import as confirmed documents with provenance; older skill artifacts remain available separately for review.
- Confirmed foundations inform brand work. A task-only choice, explicit unrelated-brief detection, and an identity-routing step isolate unrelated briefs. The active policy preserves deliverable counts and unaffected revisions.
- Authenticated submissions queue durable WorkflowAgent execution using `openai/gpt-5.6-sol`. Steps persist messages, questions, tool results, document writes, and run state. Stream endpoints enforce ownership and replay through the SDK's UI chunk cursor transform. Navigation does not cancel work; Stop cancels the persisted run before cancelling its workflow.
- Worker writes use server-only credentials and derive ownership from persisted run records. Write transactions reject stopped runs. Failures preserve completed work and do not claim an empty draft exists.
- Sidebar loading uses paginated metadata, with stable timestamp/ID cursors. Full Markdown is loaded when needed. Client skill navigation ships metadata rather than all skill instructions.

## Local verification

Final result: 16 tests passed (10 chat, 4 database, 2 stream); production build and its TypeScript check passed, compiling 32 durable steps and one workflow. ESLint completed with zero errors and 35 warnings, including existing UI warnings and generated Workflow files. `git diff --check` passed. Concurrent connector work was present in the shared checkout; a missing JSX closing brace and the test loader's relative-import support were repaired for integration verification.

- Chat tests: proposal bounds, task statuses, explicit unrelated context, existing chat identity, skill resolution, sidebar grouping, task creation, agent cancellation, and foundation exclusion.
- PostgreSQL tests using PGlite: migration/import, atomic proposals, exact-version confirmation, rollback on conflict, retry idempotency, cancellation, service-only write access, cross-account isolation, and metadata-only listing.
- SDK stream tests: immediate acknowledgment/reconnect and replay at every UI chunk boundary.
- Browser: desktop and 390px mobile setup layout, website/guided prompt prefills, Your Cookbook navigation, and unavailable-connection recovery. No horizontal overflow at 390px.

Local authenticated browser testing is blocked by missing Supabase and AI Gateway environment configuration. Browser checks used the built UI with the feature flag enabled. They do **not** establish that live model calls, uploads, database saves, or Vercel background execution pass.

## Preview rollout

### Hosted database configuration — September 19, 2026

Applied `20260919002000_guided_brand_agent.sql` through the Supabase SQL Editor to the user-selected CookBook production project `pcgtbvvmlhivuejzxnwp`, inside one transaction. Prerequisite workspace columns and RPC signatures were present, the ten-minute legacy timeout was installed, and no legacy runs were active. Created a protected `supabase_migrations.schema_migrations` history table and recorded this migration only; earlier manually installed migrations have not been backfilled into history. Refreshed the PostgREST schema cache.

Hosted checks passed: all seven added columns, all six invoker RPCs, proposal ownership policies and RLS, authenticated proposal privileges, and service-only worker execution. Imported six accepted foundation documents from the existing saved profile; 21 legacy conversations remain. No credentials were changed or copied. Integration migration `20260919003000` was not applied by this task. Vercel deployment/environment configuration and the live acceptance matrix remain pending; database configuration alone does not enable the new application experience.

1. Keep the production flag off. Create a Vercel preview from the reviewed working tree through the existing GitHub flow. Use Node 22 or later. Pin dependencies using the committed lockfile.
2. Apply `supabase/migrations/20260919002000_guided_brand_agent.sql` after the earlier workspace migrations on the disposable preview database. Apply unrelated newer migrations only as part of their own reviewed change. Verify Supabase migration history and RPC signatures against the schema check below.
3. Configure preview `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, server-only `SUPABASE_SERVICE_ROLE_KEY`, `AI_GATEWAY_API_KEY`, and `COOKBOOK_MODEL=openai/gpt-5.6-sol`. Enable `COOKBOOK_V2_ENABLED=true` only after schema checks. Public environment settings require rebuilding.
4. Run `pnpm test:chat`, `pnpm test:database`, `pnpm test:stream`, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`. Review any unrelated concurrent changes independently.
5. With disposable accounts, complete the live acceptance matrix below. Inspect Vercel Workflow runs and metadata logs; never log brand content or credentials. The generated Workflow routes use platform-managed duration; individual external calls still need to fit platform/model limits.
6. Promote only after acceptance passes. Apply the production migration separately before enabling the flag. Verify one production smoke run with authorized test data.

## Live acceptance matrix — pending

| Scenario | Required result |
| --- | --- |
| Website, PDF/DOCX/TXT/MD, guided setup | Useful sourced proposals, one material question at a time, state survives reload |
| Keep/Edit/Skip | Only displayed exact versions confirmed; edits create a new draft; Skip preserves memory |
| Concurrent browser edits and duplicate requests | Recoverable version conflict; no partial acceptance or duplicate versions |
| New chat and unrelated brief | Confirmed facts reused; pending drafts and unrelated account context excluded |
| Paper Harbor | Ask: “For fictional stationery brand Paper Harbor, write exactly three Instagram posts, each under 60 words, no hashtags.” Then: “Revise only post two to sound warmer.” Verify count, length, and byte-identical posts one and three |
| Failure and injection | Invalid website, unsupported file, extraction failure, contradictory evidence, and instructions embedded in sources recover without unauthorized changes |
| Long execution | A run exceeding 60 seconds completes after task switching and closing/reopening the page; no duplicate streamed content |
| Stop/failure | Stop prevents subsequent document writes; terminal UI shows no active save spinner or nonexistent saved work |
| Accessibility and compatibility | Keyboard proposal review, focus restoration, mobile document sheet, history, export, and existing skills work |
| Account isolation | Another account cannot read/write documents, attachments, proposals, runs, or event streams, including task-ID stream fallback |

## Schema parity check

Run read-only in the target database before enabling the flag:

```sql
select version from supabase_migrations.schema_migrations order by version;
select table_name, column_name, data_type
from information_schema.columns
where table_schema='public' and (
  (table_name='cookbook_skills' and column_name in ('foundation_key','context_scope','scope_reviewed')) or
  (table_name='cookbook_agent_runs' and column_name in ('workflow_id','draft_version','model_id','metrics'))
);
select p.proname, pg_get_function_identity_arguments(p.oid), p.prosecdef
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in
('cookbook_propose_brand','cookbook_review_brand','cookbook_queue_run',
 'cookbook_worker_write','cookbook_read_foundations','cookbook_list_tasks');
select has_function_privilege('authenticated',
  'public.cookbook_worker_write(uuid,text,jsonb)','execute') as must_be_false;
```

## Rollback and limits

Disable `COOKBOOK_V2_ENABLED` and redeploy to restore the existing chat path. Keep additive tables, documents, and versions. Existing authenticated stream/Stop endpoints remain available for in-flight work; inspect or cancel outstanding runs before replacing Workflow code. Do not drop the new schema during rollback.

The Workflow/AI SDK integration is beta, so a real preview run is a release requirement. PostgreSQL emulation does not prove hosted Supabase configuration or Workflow behavior. Model output quality, injection resistance, and unrelated-brand routing require the live evaluations above. Multiple brands, publishing, and autonomous campaigns remain outside this change.
