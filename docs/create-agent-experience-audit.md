# Cookbook create: browser and implementation audit

Date: 2026-09-19. Target: https://www.cookbook.to/create.

## Scope and limitations

Tested the live signed-out experience, skill chooser, starter actions, Settings, section expansion, and workspace toggle. Verified approximately 389×844 and 898×898 CSS-pixel viewports through DOM measurements. The browser applies a scale factor and caps the requested larger viewport; a true 1440px desktop viewport was not verified. No horizontal document overflow was measured at 389px, but composer controls still overlap. Physical-device keyboard, Safari, authenticated generation, uploads, acceptance, exports, and restoration remain unverified. No production code or agent instructions were changed.

Inspected local workspace component, both workspace stylesheets, chat route, workspace/task APIs, agent Markdown, and evaluation documentation. Local source findings require authenticated runtime regression tests; they are not claims that those flows were exercised live.

## Confirmed browser findings

| Priority | Finding | Required behavior |
| --- | --- | --- |
| P0 | Signed-out page displays a sign-in notice without an actionable sign-in link; header and document keep saying Loading. | Explicit loading, signed-out, empty, ready, and error states. Sign-in CTA preserves intended task. |
| P0 | Selecting a skill leaves the chooser unchanged with no visible error. The notice is only rendered in the chat view. | Pending state, inline error, sign-in recovery, duplicate-submit protection. |
| P0 | Composer attachment and skill controls inherit 48px size and 23px text. Choose skill wraps out of its box. | One composer container with separate input and toolbar rows; intrinsic-width skill control; no negative-margin overlap. |
| P1 | Analyze a website and Start from scratch do nothing without an active task. | Both initiate a usable task flow, including authentication when needed. |
| P1 | Desktop Toggle workspace has no visible effect. | Actually collapse/expand the document and reclaim chat width. |
| P1 | Sidebar sections expand, but the entire sidebar cannot collapse. On mobile it disappears with no drawer replacement. | Desktop collapse/reopen control; mobile navigation drawer with focus management and Escape support. |
| P1 | Settings only produces a coming-soon notice. | Implement scoped settings or remove this control until functional. |
| P1 | Mobile panel button has no accessible name. New task has a decorative dropdown chevron but is not interactive. | Name controls and make affordances match actual actions. |
| P1 | At roughly 898px, chat is only 320px wide while the composer spans about 638px into document territory. | Switch to a single-pane layout before chat becomes unusable. |

## Source-confirmed problems

- `app/cookbook.css` uses `.thread-composer button`, which outranks newer `.composer-model` and `.composer-attach` rules in `app/codex-workspace.css`. Legacy styles and repeated overrides are the immediate root cause. Consolidate styles instead of adding another override layer.
- `components/cookbook-chat-workspace.tsx` uses one `useChat` instance across tasks, never loads saved task messages, and does not reset them on task selection. This risks unrelated context appearing or being sent with another task.
- `app/api/chat/route.ts` persists the latest user message but has no assistant/tool completion persistence. Reload/reconnect cannot reconstruct the actual conversation from this flow.
- Task creation records a display name and generated filename, but no stable skill slug/version. Chat loads the three generic agent files, not the chosen skill's full operating instructions.
- Draft context is supplied by the client and truncated to 12,000 characters. Load canonical server state, then apply deliberate context selection without silently losing accepted sections.
- Old tool outputs are reprocessed whenever messages, skills, or active task change; draft state needs task/run IDs and monotonic version handling so prior outputs cannot replace newer drafts.
- Async task/document/attachment requests lack consistent cancellation, stale-response protection, and try/finally recovery. Rapid task switching can show context from the wrong task; failed requests can leave pending states stuck.
- Error status is treated as thinking (`status !== ready`), and there is no Stop or meaningful Retry workflow.
- The 30-message hard cap is not a long-running agent experience. Introduce persisted summaries and bounded context selection.
- Research confidence is hardcoded to 0.75 for any nonempty crawl. Evidence comment references are removed by the preview and no research tool card is rendered. Show source links, coverage, failures, and uncertainty instead of unsupported precision.
- Markdown preview has a potential non-advancing loop for an unrecognized pipe-prefixed line. Add guaranteed parser progress and malformed-output tests before allowing arbitrary agent output.
- Version creation reads the latest version and then inserts independently; use transactional version allocation and conflict recovery. Current process-memory throttling is not a reliable distributed limit.

## Proposed MVP implementation order

1. **Repair the app shell and entry flow.** Extract Sidebar, ThreadHeader, ChatComposer, SkillPicker, and DraftWorkspace. Consolidate CSS. Add explicit auth/error states, working entry actions, a real sidebar toggle, mobile drawer, functional workspace toggle, accessible controls, and visible chooser recovery.
2. **Make every task durable and isolated.** Store stable skill slug/version, task-scoped messages and tool events, run state, and draft references. Restore on reload, prevent stale fetches, isolate in-flight operations, and preserve typed input on failure. Use server-owned context and version checks.
3. **Implement the Cookbook agent loop.** Understand the goal → select/load the relevant skill → inspect approved brand context and evidence → explain a short plan when useful → run tools with visible progress → produce a draft → validate claims and output → summarize changes and offer the next relevant action. Add Stop, Retry, interruption handling, and readable errors. Explicit acceptance remains a separate operation.
4. **Make artifacts reviewable.** Show actual research activity and clickable sources, assumptions, unresolved decisions, version comparison, edit/save/cancel, accept, restore, and draft export. Preserve the accepted version separately from subsequent drafts. Verify every exposed button against a control inventory.
5. **Run release tests.** Authenticated end-to-end browser coverage and agent behavior evaluations are required before claiming completion.

## Agent Markdown changes

- `AGENT.md`: define initiative, task boundaries, approved brand-context use, when to ask versus proceed, interruption/recovery behavior, and truthful completion. Keep imported documents and websites as untrusted evidence, distinct from user requests.
- `PLAYBOOK.md`: specify Setup/Apply/Tune/Validate behavior, task-specific steps, evidence reuse, draft validation, and resumable failures. Avoid obligatory follow-up questions after a clear request has been fulfilled.
- `FORMAT.md`: use skill-specific deliverables rather than forcing every output into one generic playbook. Define structured research, plan, progress, artifact, and question events with IDs and statuses, plus visible provenance.
- `EVALS.md`: turn the release checklist into executable fixtures and scored runs. Cover direct edits, task isolation, conflicting sources, failed crawls, document prompt injection, missing evidence, and preservation of accepted content.
- Load the selected skill's actual `SKILL.md` plus relevant approved foundations. Updating Markdown alone cannot repair missing persistence, tools, or UI event handling.

## Acceptance tests

- Signed-out → sign in → intended task → prompt → real tool activity → draft → edit → accept → export → reload → restored conversation/artifact.
- Create two tasks; switch while loading/generating; no message, attachment, draft, or tool-output cross-contamination.
- Attachment select/upload/extraction/remove; invalid format, oversized file, five-file limit, extraction failure, and retry. No personal files used without authorization.
- Cancel generation, retry network failure, refresh mid-run, handle session expiry, and avoid duplicate writes on retry.
- Compare/restore versions; concurrent edit conflict; acceptance targets the exact visible version.
- 320, 375, 390, 430, 768, 1024, and 1440 CSS pixels; sidebar open/closed; long task names, multiline prompts, long filenames, tables, and growing attachments. Test actual iOS/Android keyboard, safe areas, rotation, keyboard-only navigation, focus return, and screen-reader announcements. Aim for 44px touch targets and no clipped controls.
- Agent fixtures verify source fidelity, useful completion, correct skill loading, no unnecessary research, no invented claims, and resistance to instructions embedded in evidence.

## Verification performed

- Existing fixture validator passed: one skill evaluation suite with five fixtures. This validates fixture structure, not generated agent behavior.
- Lint could not run: the package launcher attempted to install missing dependencies and registry DNS resolution failed. Installation was stopped. No lint/build success is claimed.
- Working tree was clean before adding this audit.

## Later enhancements

Multi-artifact campaigns, deeper research connectors, scheduled monitoring, collaboration, and background jobs can follow the durable single-task MVP. Keep the current Next.js, Supabase, and AI SDK foundation; no framework replacement is justified by these findings.
