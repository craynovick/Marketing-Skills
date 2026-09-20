# Cookbook Create: live agent and UI evaluation

Date: September 20, 2026  
Surface tested: `https://www.cookbook.to/create`  
Scope: agent execution, task lifecycle, recovery, desktop UI, and mobile UI

## Executive summary

The redesigned Create entry screen is substantially clearer than the previous workflow-first experience. It leads with the work, keeps brand context visible, and gives users a usable single composer. The production agent path is not ready for normal use, however: a new social-post request remained queued, the live stream failed to reconnect, and the interface showed mutually contradictory run states. This reliability problem should be treated as the release blocker; polish work should follow immediately behind it.

## Test scenario

1. Opened an existing task and inspected its recovery state.
2. Started a new Create conversation under the Wings Over the Rockies brand.
3. Selected the Social post recipe.
4. Submitted: “Invite Denver families to Wings Over the Rockies this weekend. Write one Instagram post in a warm, energetic voice with a clear call to action. Keep it under 120 words.”
5. Observed initial submission, queueing, stream reconnect, refresh/re-entry, failure state, and mobile layout.
6. Inspected browser errors and mapped the behavior to the local implementation.

## Screenshot log and observations

Screenshots were captured throughout the live test in the task conversation.

| State | What the screenshot showed | Assessment |
| --- | --- | --- |
| Existing task | “This run did not finish” and “This task is working in the background” at the same time; Retry disabled, Stop enabled | Critical state-model contradiction |
| Fresh Create | Strong headline, visible active brand, four recipe shortcuts, and one primary composer | Clear and focused |
| Recipe selected | Selected Social post button plus a second “Social Post ×” chip | Redundant selection treatment |
| Complete brief | Prompt, recipe, brand, and send action were understandable | Good happy-path composition |
| Opening conversation | Composer disabled with a small “Opening your conversation…” notice | Understandable, but lacks progress timing or recovery |
| Reviewing request | Header said “Ready to start” while the body said the agent was reviewing and offered Stop generation | Conflicting status sources |
| Reconnected task | Sidebar said Queued and the content area stayed at “Opening your task…” before returning to Reviewing | Recovery is slow and visually indeterminate |
| Mobile task | Truncated title, compressed brand controls, unlabeled plus button, and a clipped “Marketing chat” row | Functional skeleton, weak information hierarchy |
| Mobile loading | “Opening your brands…” rendered above the marketing footer | App loading state leaks the public-site shell |
| Final failure | Error panel and background-working panel appeared together; the original prompt was restored in the composer | Prompt preservation works, recovery controls do not |

## Findings

### P0 — Agent execution and recovery

1. **Background runs remain queued or fail to reconnect.** The test did not produce an assistant response after more than one minute. The browser recorded `Error in chat GET reconnectToStream TypeError: network error`.
2. **A single run can be presented as failed and active simultaneously.** The UI renders the generic stream error whenever `useChat` reports an error, then separately renders the database-backed active-run notice when the saved run is still `queued` or `running`.
3. **Retry is unavailable exactly when it is needed.** `Retry request` is disabled because `busy` includes the database run, while Stop remains enabled.
4. **The client has multiple status authorities.** The header, stream state, and database run state update independently. This produced `Ready to start`, `Queued`, `Working…`, `Reviewing your request…`, and “did not finish” for the same run.
5. **Queued-stream responses are treated like network failures.** The stream route returns HTTP 503 while `workflow_id` is missing. A temporary queue state should be retried with bounded backoff, not surfaced as a terminal network error.

Relevant code:

- `components/cookbook-chat-workspace.tsx`: `TaskThread`, `runActive`, `busy`, `resumeStream`, error and background notices.
- `app/api/cookbook/runs/route.ts`: queues the run and starts the workflow.
- `app/api/cookbook/runs/[runId]/stream/route.ts`: returns 503 when the workflow ID is not attached.
- `lib/cookbook-foundations.ts`: sidebar/header task status labels.
- `lib/workflows/cookbook.ts` and `lib/workflows/cookbook-steps.ts`: workflow claim, execution, persistence, and final status.

### P1 — UI clarity

1. **Recipe selection is duplicated.** The pressed recipe button already communicates selection; the extra removable recipe chip adds another line without adding useful context.
2. **Long prompts become task titles.** The header and sidebar use the request text verbatim, creating truncation and poor scanability. Generate a short title after submission and keep the full prompt in the thread.
3. **The main waiting state lacks useful progress.** “Reviewing your request…” does not distinguish queueing, starting, generating, saving, or reconnecting.
4. **Failure recovery is split across two panels.** Present one state card with a single primary action and optional secondary action.
5. **Task history becomes noisy.** Multiple queued and draft items with similar titles make the sidebar difficult to scan. Improve title generation and group or filter unfinished runs.

### P1 — Mobile usability

1. **Header controls compete for one row.** The title, brand selector, new-brand control, and workspace affordance do not fit comfortably at 390 px.
2. **The plus-only New brand control is ambiguous.** It needs an accessible visual label or should move into the brand menu on narrow screens.
3. **The conversation mode label is clipped.** “Marketing chat” appears as a thin, low-contrast strip under the brand row.
4. **Loading uses the marketing shell.** Replace the public header/footer flash with a full-height workspace skeleton.
5. **Primary content begins too low.** Two stacked header rows consume valuable vertical space before the conversation.

## Update plan

### Phase 1 — Make agent runs trustworthy (release blocker)

1. Define one client-visible lifecycle enum derived from the persisted run: `starting`, `queued`, `running`, `awaiting_input`, `completed`, `failed`, `cancelled`.
2. Treat the chat stream as transport detail, not a second source of lifecycle truth. Do not render a terminal error while the persisted run is active.
3. Change the stream endpoint’s missing-`workflow_id` behavior from a generic 503 into a typed retry response, or delay the initial response until the workflow ID is attached.
4. Add bounded reconnect with jitter and a clear threshold: for example, retry for 20–30 seconds, then refresh persisted status and offer recovery.
5. Reconcile impossible combinations on load. If the stream fails but the database run is active, show one reconnecting state. If the run is terminal, enable Retry and remove Stop.
6. Add a watchdog for runs stuck in `queued` or `running`; mark them interrupted with a user-safe error and retain the prompt.
7. Log structured stages with `taskId`, `runId`, workflow ID, status transition, stream cursor, and elapsed time. Add Vercel/Supabase alerts for queue age and failure rate.

Acceptance checks:

- A new request leaves `queued` within an agreed threshold.
- Refreshing or switching tasks resumes without duplicate output.
- No screen can show failed and running at the same time.
- Retry is enabled for every terminal failure.
- Stop is shown only for active cancellable runs.

### Phase 2 — Unify progress and recovery UI

1. Create a single `RunStatusCard` driven only by the reconciled lifecycle.
2. Use stage-specific copy: “Starting,” “Waiting for an agent,” “Drafting,” “Saving your draft,” and “Reconnecting.”
3. Show elapsed time after five seconds and a calm recovery hint after fifteen seconds.
4. Replace separate error/background banners with one card containing one primary action: Retry, Reconnect, or Review request.
5. Keep the composer readable during a run, but disable submission with an explicit explanation. Preserve the prompt only after a failure or cancellation.

### Phase 3 — Tighten the Create interface

1. Remove the duplicate selected-recipe chip. Keep the pressed shortcut and add a small clear action inside it if needed.
2. Generate concise task titles of roughly 4–8 words; update them asynchronously without blocking generation.
3. Convert the active brand and scope into one compact context control: `Wings Over the Rockies · Brand context`.
4. Move “New brand” into the brand selector on mobile; retain the labeled button on desktop.
5. Reduce the visual distance between recipe choice and composer so the start screen reads as one action.
6. Add empty-state examples below the composer only when they improve specificity; do not restore a second workflow picker.

### Phase 4 — Mobile and loading polish

1. Use a compact first row with navigation, short task title, and overflow menu; place context in a second, intentionally styled row only when needed.
2. Keep Chat/Draft tabs sticky beneath the header once a draft exists.
3. Replace the marketing-shell loading flash with the workspace skeleton and reserve the final layout dimensions.
4. Ensure all icon-only buttons have visible tooltips and accessible names; preserve 44 px targets.
5. Test at 320, 390, 768, 1024, and 1440 px, including safe-area insets and software keyboard behavior.

## Verification suite to add

- Integration test: queued run receives a workflow ID and transitions to running.
- Integration test: stream endpoint returns a typed retry state before attachment and resumes from a cursor afterward.
- UI test: stream error plus active database run renders only Reconnecting.
- UI test: terminal failure renders Retry enabled and no Stop action.
- UI test: refresh during generation preserves one user message and one assistant response.
- End-to-end test: Social post request creates a draft, opens Chat/Draft navigation, and survives a reload.
- Responsive visual tests for fresh Create, queued, running, awaiting input, completed draft, and failed states.
- Observability check: alert when p95 queue-to-running exceeds the target or stuck runs exceed the watchdog threshold.

## Recommended implementation order

1. Fix run lifecycle and stream reconnection.
2. Add the stuck-run watchdog and production telemetry.
3. Replace conflicting banners with the unified status card.
4. Fix task titles and recipe-selection duplication.
5. Rework the mobile header and loading skeleton.
6. Add automated lifecycle and responsive regression coverage.

Do not spend time polishing generated draft presentation until the agent reliably reaches a terminal or input-needed state. Reliability is the current user-value bottleneck.
