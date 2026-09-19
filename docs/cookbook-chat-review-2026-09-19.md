# Cookbook chat and skills review — September 19, 2026

## Result

Implemented locally: separate Chats and Skills navigation; direct marketing chats; optional agent skill loading; clearer task entry, search recovery, connection state, and workspace styling. Existing skill records remain in Skills. No database migration, new dependency, commit, push, or deployment was performed.

## Production evidence

Vercel showed the current production deployment as Ready at commit `a5ade0a8387a30706bc35be3c47ccb1aa4b15c62`, matching the local starting commit.

- Deployment: https://vercel.com/craytreez/marketing-skills/93V88H3XWg9UXyNNru2BC1SeqVgF
- Test conversation: https://www.cookbook.to/create?task=8573f75b-7f73-410c-8815-62dcc654b83c
- Used a fictional brand, Paper Harbor. Requested three LinkedIn posts under 100 words, warm and specific, without invented certifications or impact statistics.
- Production routed this request to Content Format Planner, then saved a large “LinkedIn Introduction Playbook.” It contained the posts but also strategy, carousel/video briefs, channel adaptations, production checklists, approval guidance, and a Cookbook save block. This is a scope failure even though generation completed.
- Opened the saved draft and reloaded the page. Both the conversation and draft reference were restored successfully. No browser errors were reported by the console check during generation.
- The test draft remains saved and unaccepted. No content was published or sent externally.

## Root causes and fixes

1. Every new prompt first required a model-based skill classification. The selected skill then dictated the entire output template. New chats now bypass this classification and use an explicit marketing-chat operating mode. The old routing endpoint remains for compatibility with already-open older clients.
2. Sidebar records mixed content conversations and reusable skill work under “Your tasks.” New chats use a reserved, server-validated identity and user-specific titles; existing skill/legacy records remain separate. Archives work across both sections.
3. Marketing chats can load a catalog skill through a bounded tool when specialized guidance helps. Loaded guidance does not override the requested deliverable. The tool checks active run state, only accepts published catalog slugs, and records a visible skill event.
4. Chat instructions prioritize requested count, channel, tone, word limits, factual accuracy, and direct revisions. Approved skill foundations remain available as context. A different or fictional brand must not inherit unrelated account facts.
5. Global public-site CSS leaked into the workspace: nav alignment centered sidebar contents, and global header colors made the workspace header dark. Explicit workspace styles now isolate those properties.
6. The conversation's skill dropdown actually opened a new task. It is now a static mode label inside existing conversations; the new-chat screen retains an explicit skill picker.
7. Added no-results search guidance, accurate connection failure status, duplicate-create protection, and a Cookbook page title. Connection failure no longer silently redirects a submission to sign-in.
8. Scoped React-only ESLint overrides to JSX/TSX files so the CommonJS regression tests do not cause a plugin-resolution failure.

## Verification

- Final Next.js production build and TypeScript: pass.
- Seven regression tests: pass. Cover stable chat identity after rename, legacy skill resolution, chat/skill/archive separation, bounded creation titles and durable RPC use, invalid skill rejection, allowed skill loading, tool refusal after cancellation, and exclusion of other chats from reusable brand context.
- Full ESLint: zero errors, 27 existing warnings on links, images, and React effects.
- Existing skill fixture validator: one suite with five fixtures passes. This checks fixture structure, not generated model quality.
- Local browser: separate navigation sections, skill browsing, empty-search recovery, mobile layout, desktop collapse/reopen, and persistent connection recovery notice verified.
- Measured CSS viewport widths: 354px and 1309px; no horizontal document overflow at either. Browser scaling meant requested 390px/1440px sizes were not the actual CSS widths. Temporary viewport override was reset.
- Browser verification briefly stopped when automatic approval review hit a usage limit, then resumed after the user requested continuation.

## Remaining release checks

Local Supabase/model credentials are not configured. The new chat mode was not exercised against a real model or database from local code. The unit tests use database/model test doubles. Do not treat the existing production run as verification of the new mode.

On a configured preview, repeat the Paper Harbor request: expect exactly three useful posts in the draft, no strategy playbook. Revise only post two, reload, and verify the content and chat remain isolated from another conversation. Test skill creation, optional skill loading, stop/retry, file attachment extraction, edit/accept/export, session expiry, and restore. These paths were not all exercised in this pass.

## Next priorities

- Keep the MVP centered on chat → useful draft → revision. Do not make foundation setup mandatory for clear content requests.
- Add model-output evaluations that score scope, useful completion, factual fidelity, brand separation, and unnecessary questions. The existing fixture validator is not an agent-quality evaluation.
- Paginate conversation history and avoid fetching a full latest document for every sidebar entry. The current workspace endpoint makes one document query per record and sends document content to populate the sidebar.
- Split client catalog metadata from complete skill instructions to reduce browser payload.
- Validate refresh-during-run behavior: source inspection indicates polling refreshes task data but does not explicitly replace the chat hook's messages. Completed reload recovery passed; mid-run reconnection remains unverified.
- More detailed error diagnostics and actual request timing should precede changes to model selection or runtime timeouts.

## GitHub Desktop handoff

Commit all implementation files, new chat instructions, tests, and this review together. Suggested summary: `Separate marketing chats from skills and refine Cookbook agent flow`.

No Supabase migration or new environment variable is required for this change. Existing production credentials are reused. After Vercel reports Ready, run the Paper Harbor prompt above through New chat and confirm it appears under Chats; create an explicit skill through Browse and confirm it appears under Skills. The new mode's live model behavior remains a post-deployment verification item.
