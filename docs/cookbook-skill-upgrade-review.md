# Cookbook skill upgrade review

Date: 2026-09-19. Implementation complete for the Markdown/catalog scope; full authenticated production behavior is not certified by this review.

## Delivered

- Upgraded all 15 existing skill sources with incremented versions, consistent portable run modes, context-sensitive commercial judgment, proportionate output, and a quality check.
- Added `go-to-market-strategy`, `offer-pricing-strategy`, and `sales-enablement-playbook` at version 1.0.0. All are non-foundational with no declared profile writes. Existing chat loading, recipe API, and MCP tools expose them without new public interfaces.
- Updated the authoring template and shared agent, playbook, format, brand, chat, and evaluation guidance. Explicit routing cues distinguish GTM choices, offer/pricing decisions, sales assets, and campaign execution.
- Removed generator policy injection. Raw Markdown, generated recipe content, API responses, and loaded skill instructions share one source. Declared previously used context placeholders without adding new context keys.
- Added full inventory fixture coverage: 18 skills × five modes = 90 fixtures, plus cross-skill chat scenarios. The validator rejects missing modes, empty required sections, and orphan suites.
- Updated the quality rubric to prioritize strategic judgment, brand specificity, useful deliverables, evidence, proportionality, and correct workflow.

Nonagraf informed the level of specificity: buyer situations, value mechanisms, evidence, tradeoffs, channel execution, and sales relevance. Its private content, facts, geographic scope, approval owners, and brand style were not copied into reusable instructions. Fictional fixtures explicitly test against brand contamination.

## Structural and integration verification

| Check | Result | What it establishes |
|---|---|---|
| `pnpm build:skills` | Pass: 18 skills | Metadata, versions, handoff targets, declared parameters, regenerated exports |
| `pnpm eval:skills` | Pass: 90 fixtures | Every source skill has complete fixture structure; no model is called |
| Skill consistency tests | Pass | Exact portable/source export equality, catalog versions, non-foundational GTM status, validator failure cases |
| Chat tests | Pass | GTM descriptions discoverable, optional and explicitly selected skills use source instructions, cancellation and task-context boundaries |
| REST/API tests | Pass | Three new recipes returned with canonical Markdown, no additional database access for public recipe reads |
| Database integration tests | Pass | Existing permission, proposal/versioning, scan, and delivery boundaries in the local test database |
| MCP tests | Pass | Actual local MCP client/server and stdio transport expose recipes; source parity and existing credential protections |
| `pnpm lint` | Pass with 28 warnings, zero errors | Existing application warnings remain outside this Markdown-focused change |
| Targeted lint on modified scripts/tests | Pass with no output | No lint findings in the changed validation/integration test code |
| Scoped `git diff --check` | Pass | No whitespace errors in changed tracked content and scripts |

The bundled Node executable had to be added to PATH. MCP initially failed because the filesystem/network sandbox denied the temporary loopback listener; rerunning with approved local test-server access passed. This was an environment failure, not a recipe assertion failure.

## Portable behavioral sample

Exact inputs, outputs, version/hash metadata, and scoring evidence are preserved in [the forward-check record](skill-quality-forward-check-2026-09-19.md). An independent skill-authoring evaluation agent generated outputs before opening expectations and then scored them. Scores are qualitative judgments, not a measured production reliability rate.

| Scenario | Score | Result |
|---|---:|---|
| Three finished consumer-brand posts | 100 | Pass |
| Targeted post-two revision | 100 | Pass; posts one and three preserved verbatim |
| Technical B2B GTM pilot | 92.5 | Pass; could be more concise |
| Service offer/pricing with missing costs | 90 | Pass; eventual price-test population and decision thresholds need refinement |
| Product-business objection response and discovery | 100 | Pass |
| Commercial weekly readout | 92.5 | Pass; correct contribution arithmetic, more detail than necessary |
| Consumer-brand voice and rewrites | 100 | Pass |

No critical failure was observed in this sample. Three GTM routing choices were also simulated; the routing exercise was not blind and did not execute a hosted model/tool loop. Programmatic loader tests separately verify that the selected recipes can be loaded, not that a hosted model will always select them.

## Limits and remaining release checks

- Seven portable outputs were exercised, not all 90 fixtures. The remaining 83 fixture executions, including dedicated safety cases, remain unexecuted in this review.
- No authenticated hosted UI/model run, real save/version conflict, failed website crawl, or live task-only switch was performed. Existing mocked/local integration checks do not replace those acceptance runs.
- The exact serving model identifier was unavailable to the evaluator and is recorded as unknown. Tool saving, publication, and CRM actions were not exercised by portable fixtures.
- No deployment, migration, new dependency, live brand update, outreach, or pricing change was performed.

## Maintainability and risk review

The main simplification is removing generated behavior that differed from the source skills. Each portable source contains its short mode contract intentionally, so it works independently; no shared-reference loader or framework library was introduced. The generator remains dependency-free and now rejects incomplete metadata rather than silently exporting it.

Hosted chat retains optional skill loading and the browser receives only catalog metadata. Individual skills are roughly 600–1,100 words; the entire library is not added to each prompt. No new data store or runtime service affects scale.

Evidence and approval protections remain explicit. Frameworks and buyer psychology support decisions without invented proof or coercive tactics. Follow-up tuning should use observed behavior: reduce GTM/readout verbosity and make pricing validation concrete when the necessary economics are known, rather than adding universal questionnaires or unsupported numerical thresholds.
