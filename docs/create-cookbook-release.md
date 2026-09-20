# Create / Cookbook release

## Changes

Create and Cookbook share a brand selector. Cookbook includes starter skills, saved tuning work and the searchable catalog. New brands have separate projects, files, task history and approved context. Social drafts can create seven independently versioned platform adaptations. Sidebar and homepage annotations are included.

## Database and rollout

Apply `20260921000000_brands_and_adaptations.sql` before deploying the app. Preserve existing projects and documents. The original profile is imported only into the original project. Apply `20260921001000_brand_connections.sql` only after the existing integration migration; it prevents ambiguous multi-brand connector creation.

`COOKBOOK_BRANDS_ENABLED=true` enables new-brand creation and adaptations. It defaults off, independently of the durable-agent flag. Existing single-brand work remains available. Disable the flag to stop new brands/adaptations while retaining saved work. Do not roll back to a client that silently chooses the first project after multiple brands exist.

## Local verification

40 targeted tests passed: chat, database, stream, integration, API and skill suites. ESLint: zero errors, 32 warnings (including existing hooks and image warnings). Production build and TypeScript passed with `next build --webpack`; the default local Turbopack build stalled and was stopped. No dependencies added. Homepage inspected in the built local browser: horizontal header logo, compact cards with arrows, updated catalog copy.

## Hosted acceptance

Hosted status: the brands/adaptations migration was applied successfully in a transaction and recorded in migration history before the application push. The integration follow-up remains unapplied because its prerequisite RPC is absent.

Before enabling broadly, verify new brand from header and Cookbook, resume the three starter skills, approve exact versions, generate a social draft and adaptations, edit one adaptation, switch brands during a durable run, reload and verify no context mixing. Use fictional test materials. Check Stop, Retry, upload errors, and interrupted runs. Model behavior fixtures are in `evals/create-experience.json` and require real hosted generations; unit tests do not establish model quality.

The hosted integration RPC was absent during preflight. Do not enable integrations until its existing migration and brand-scoping follow-up are applied together and tested. Website scan allowances remain account-level billing limits.
