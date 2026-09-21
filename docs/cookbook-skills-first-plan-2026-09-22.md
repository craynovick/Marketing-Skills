# Cookbook: skills first, brand context that travels

Date: September 22, 2026. Status: proposed implementation plan; no application changes or deployments made.

**Product decision: Cookbook should produce excellent marketing skills and a researched, editable brand pack that users take into their own AI app.** The website's primary completion event is a successful installation and useful first result in that app.

## 1. What the research establishes

Reviewed the local repository at `a68cec7`, the live homepage and authenticated `/create`, Vercel's production overview, Supabase's horganization/project listing, the four competitor repositories, representative skill instructions, and the installation specification. This is a product/source review, not a completed comparative output benchmark or production security audit.

The live page leads with “What do you want to work on?”, social/newsletter/page shortcuts, attachments, and a marketing-chat selector. Its navigation combines content conversations, foundation tasks, drafts, accepted work, queued runs, and failures. There is no prominent install outcome on that entry screen. The visual shell is fairly sparse; the larger problem is that it asks users to operate another marketing agent.

Vercel shows the production deployment Ready at `a68cec7`, matching the local checkout. Supabase lists the CookBook project. These observations do not establish research reliability, applied migrations, row-level authorization, or end-to-end installation. Earlier September 19–20 audits report runtime problems; they are historical evidence, not newly reproduced failures. Current navigation still displays queued and needs-attention tasks, but I did not run generation or diagnose those jobs.

### Competitive findings

| Library | Observed strengths | Implication for Cookbook |
| --- | --- | --- |
| [Corey Haines](https://github.com/coreyhaines31/marketingskills) | Broad marketing coverage, straightforward CLI installation, connected workflows. Its [product-marketing skill](https://github.com/coreyhaines31/marketingskills/blob/main/skills/product-marketing/SKILL.md) already builds and versions shared context; [copywriting](https://github.com/coreyhaines31/marketingskills/blob/main/skills/copywriting/SKILL.md) reads that context before asking questions. | Shared brand context alone is not differentiation. Benchmark actual strategic decisions and finished work against this library. |
| [Kostja](https://github.com/kostja94/marketing-skills) | Advertises 160+ focused skills, extensive SEO/page coverage, and a project-context template. Its README explicitly says CLI installation does not install the separate templates/docs. | Make context delivery part of the product, eliminate setup gaps, and resist multiplying small skills merely to match a count. |
| [ScaleBrick](https://github.com/ScaleBrick/founder-marketing-skills) | Four founder-focused workflows and simple installation. The sampled [strategy skill](https://github.com/ScaleBrick/founder-marketing-skills/blob/main/skills/strategy/SKILL.md) gives concrete execution guidance but defaults to a substantial TikTok publishing operation and appends a vendor promotion. | Retain specificity while choosing channels and workload from actual buyer behavior and capacity. Keep vendor advertising out of users' deliverables. |
| [AgentKits](https://github.com/aitytech/agentkits-marketing) | Packages agents, commands, skills, training, and workflow infrastructure; its README describes 18 agents, 93 commands, and 28 skills. | Learn from workflow coverage, without requiring users to configure a parallel operating system. These are repository claims, not independently verified quality measures. |

Corey and ScaleBrick skill bodies were sampled; Kostja and AgentKits findings primarily reflect their repository documentation. No claim that Cookbook currently outperforms any of them is justified yet.

### Assets and gaps in this repository

- **21 source skills**, six reusable brand sections, version/proposal handling, a catalog generator, fixtures, and a useful quality rubric already exist. README still says 18.
- `evals/README.md` correctly distinguishes structural validation from behavioral evaluation. Prior portable exercises are useful but are not competitive benchmarking.
- `lib/cookbook-brand-discovery.ts` produces name, offer, and website. Its fallback can select the first search result. This is discovery, not deep market research; an ambiguous brand must not silently become the wrong company.
- `lib/cookbook-scraper.ts` reads up to six pages from one site. It has DNS/redirect restrictions worth preserving. Independent market, customer, and competitor evidence requires a separate, bounded research capability.
- `components/cookbook-chat-workspace.tsx` has 1,335 lines and `/create` directly mounts it. Reuse its underlying services, not its conversation state as the new setup UI.
- Saved Markdown documents and the MCP connector exist. A saved output document is not automatically an installable procedural skill.
- Source frontmatter uses human-readable `name` values. The [Agent Skills specification](https://agentskills.io/specification) requires a lowercase, hyphenated identifier matching the directory. Keep display titles, but normalize distribution metadata and verify packages in real clients.
- No root license file was found; README acknowledges this, while the homepage says “open source.” Resolve the license decision and copy before public distribution claims.

## 2. The product boundary

**Promise:** “Marketing skills that understand your brand. Install them in the AI app you already use.”

| Cookbook owns | The user's AI app owns |
| --- | --- |
| Skill methods, examples, references, and measured quality | Everyday conversations and content creation |
| Initial brand research and evidence-backed context | Follow-up research using the user's tools |
| Review, export, install, version provenance | Local context edits and skill refinement |
| Optional paid research refresh/team distribution later | Files, artifacts, connectors, and execution |

The MVP does not need a hosted general-purpose chat, model picker, task orchestration dashboard, social adaptation workspace, or required MCP setup. Preserve existing customer work and integrations during migration; remove them from the primary onboarding journey first.

An install remains useful without a Cookbook connection. Research and generation may require the destination app's network/tools; “portable” does not mean that every task runs offline.

## 3. Replace `/create` with three understandable steps

**Describe → Review → Install**

1. **Describe.** Heading: “Tell us about your brand.” One textarea: “What do you offer, who is it for, and what would you like to achieve? Include your website if you have one.” One primary action: “Build my brand pack.” Optional supporting files are tucked behind “Add context.” Retain the text through authentication; request sign-in only before running hosted research/saving private work.
2. **Review.** A compact brand summary, positioning recommendation, audience priorities, voice examples, evidence, and clearly marked assumptions. Expand details only when useful. One optional correction field: “What should we change?” Offer “Use this version” and “Continue with a provisional pack.” Confirmation records user acceptance; it does not magically verify a claim.
3. **Install.** Show the chosen destination, one installation command, a copy button, what will be installed, and a ready-to-use first prompt. Provide a private downloadable bundle as a fallback. Show success only after a real installer result or a user confirmation, not after clicking Copy.

Research progress uses named stages and an elapsed indicator, not fabricated percentages: identifying the business, gathering evidence, developing the brief, checking claims. Failed or partial research offers retry, a provisional pack, or continuation inside the user's AI app.

```text
Tell us about your brand
[ One short description, website optional                    ]
[ Build my brand pack ]                          Add context

                     ↓

Your brand pack
Brand summary · audience · positioning · voice examples
Sources and assumptions [expand]
[ Optional correction                                      ]
[ Use this version ]                     Continue provisionally

                     ↓

Use your skills in your AI app
[ Codex | Claude Code | Other ]
[ installation command                               Copy ]
First prompt: “Use my brand pack to improve our homepage.”
Download bundle
```

Homepage: lead with skills and an installation command, then “Customize for my brand.” Keep the Cookbook identity, but replace workflow complexity badges and internal terminology with useful examples and previewable outputs. Do not imply that Claude browser chat and Claude Code share the same installation capability; document only tested destinations.

## 4. Make one prompt produce useful strategic context

One prompt should begin the work, not promise access to facts the user never supplied. Ask a short follow-up only for identity ambiguity or a fact that materially changes the recommendation. A business without a website can still receive a provisional pack.

Use a bounded research pipeline:

1. Resolve the business, geography, offer, and canonical website. Preserve the user's entire brief rather than turning it into only a name search.
2. Collect official offer/product/pricing/about evidence and representative writing. Extract short cited evidence, not an unbounded website dump.
3. Research relevant alternatives and demand signals from independent sources. Stop at a defined evidence/budget limit; record inaccessible sources and disagreement.
4. Apply commercial judgment: segment attractiveness, buying situation/JTBD, alternatives including doing nothing, differentiation, offer economics where known, purchase friction, plausible distribution, and resource constraints. Use frameworks to make decisions, not to fill a document with MBA headings.
5. Produce brand-specific examples and a short recommendation with a testable next step. Separate what is observed, user-supplied, inferred, recommended, and unknown.
6. Validate identity, trace claims, detect contradictions, and present the pack for correction/export.

Keep the existing six sections: brand, audience, voice, content, proof, guardrails. Include goals, business model, offers, competitive alternatives, and commercial constraints inside them rather than creating another taxonomy. Each important assertion carries a source/date or an explicit assumption label. A user can approve a strategic hypothesis without converting it into an observed market fact.

Proposed operating limits for the first trial: a few competitor businesses, a bounded source/page budget, capped model usage, and a resumable research job. Calibrate exact limits against measured quality, latency, and cost in the first ten trials. Do not call six same-site pages “deep research.” A search/data provider remains an implementation dependency to evaluate before promising broader research.

## 5. Package skills, brand context, and local edits separately

The user experiences customized skills. Underneath, avoid maintaining a rewritten copy of every skill for every brand.

```text
Installed skill directories
  cookbook-brand-context/SKILL.md       how to read/refine local context
  landing-page-copywriter/SKILL.md      reusable, versioned method
  .../references/                       loaded only when needed

Project-owned private context
  .cookbook/brand.md                    concise working brief
  .cookbook/evidence.md                 sources and claim status
  .cookbook/overrides/                  user-owned skill preferences
  .cookbook/manifest.json               schema, versions, hashes
```

Every marketing skill explicitly resolves project context when available and works from an ordinary brief when absent. No mandatory global bootstrap execution. Context loading must be tested, not assumed from the presence of files. Missing context should not block a narrow, well-specified task.

One brand per project for MVP; avoid global private brand installs. Install private context with a local Git exclusion by default, and explain how a team can deliberately share it. Do not replace a project's existing `AGENTS.md` or `CLAUDE.md`. Local preferences live outside vendor-managed files; updates show diffs and preserve them. Directly edited vendor files need a backup/conflict workflow, never silent replacement.

After installation, local context is authoritative for that project. The website holds the initial snapshot; no automatic bidirectional sync in MVP. Later exports/imports explicitly resolve version conflicts. This avoids both update loss and a permanent dependency on Cookbook's approval UI.

### One-command distribution

Use the established [skills CLI](https://github.com/vercel-labs/skills) for public skills. It documents repository/local sources, agent targeting, and updates. Proposed public command after packaging/access checks:

```sh
npx skills add craynovick/Marketing-Skills
```

This is a target command, not a verified working release. Verify discovery of `content/skills`, stable names, complete reference files, and installation from a clean project. If root discovery is unreliable, publish a generated standard `skills/` distribution from the same canonical sources rather than manually maintaining two libraries.

**Private brand delivery is a separate problem.** Do not publish customer-specific repositories or put permanent connection keys into commands. First spike a minimal installer that authenticates through the browser, retrieves the owner's selected brand snapshot, places context outside managed skills, and reuses the standard installer for public skills. Its scope ends at installation/update/export; it is not another agent runtime.

Illustrative command only, with package name and availability to be established before release:

```sh
npx <published-cookbook-installer> install --brand <non-secret-brand-id>
```

One command can initiate a short authentication/destination choice; it should not mean hidden authorization. Credentials must be brief-lived, scoped, excluded from logs, and cleared appropriately. Until private installation is implemented and verified, label the download-and-local-install fallback honestly. Do not claim the generic public command includes a user's private brand.

MCP remains an optional advanced connection for people who want hosted sync/storage. It is not required for activation, local brand changes, or ongoing writing.

## 6. Build the best library through measured improvement

Start with the 21 existing skills. Concentrate the first quality cycle on positioning, audience/ICP, voice, GTM, offer/pricing, landing-page copy, lifecycle email, conversion audit, and competitive research. Keep the rest available; do not rebrand an unmeasured library as “the best.”

Each skill needs: precise triggers and boundaries; a short method with decision criteria; relevant context retrieval; good and bad examples; a clear output contract; proportional handling of narrow requests; and an evidence/quality check. Put deep references and examples in companion files. Keep essential portability guidance inside each installed skill, without duplicating a giant operating manual.

Candidate coverage gaps for subsequent releases: technical/search and AI-search audits, paid acquisition and creative, dedicated social writing, retention, and measurement setup. Validate demand and distinguish these from existing workflows before adding them. A skill must add a meaningful capability rather than inflate the catalog.

### Competitive evaluation protocol

- Begin with 12 matched briefs across SaaS, local services, ecommerce, and nonprofit/cultural brands. Include limited budgets, sparse evidence, non-English audience needs, conflicting evidence, and narrow edits.
- Compare base model, Cookbook, and the closest relevant competitor skill on the same model, brief, tools, and budget. Supply necessary companion references. Record competitor commits; no mismatched task selected to manufacture a win.
- Separate **method quality** (identical supplied context) from **end-to-end customization quality** (same starting brand prompt and research budget).
- Use blind pairwise review plus the existing weighted rubric: commercial judgment, brand specificity, deliverable usefulness, evidence, clarity, and workflow correctness. Record editing effort, unnecessary questions, latency, and token/cost usage.
- Proposed release gate: every released skill meets the current 80/100/no-zero/no-critical-failure rule on its fixtures. Flagship comparison target: win more than 60% of matched comparisons excluding ties, report ties and uncertainty, and avoid regressions in evidence fidelity. A 12-brief pilot is directional; expand samples before broad superiority claims.
- Preserve actual inputs/outputs and evaluations. Static tests and self-review alone cannot establish competitive advantage. Validate behavior in Codex and Claude Code independently; model benchmark success does not prove installation/discovery success.

## 7. Implementation sequence and acceptance gates

| Phase | Concrete work | Completion evidence |
| --- | --- | --- |
| 1. Prove portability | Normalize distribution metadata; verify references, licensing, public installation, private installation prototype, and local context resolution. Reuse the generator and source skills. | Clean-project install in both target apps; a brand-specific output; updates preserve private context and user preferences. |
| 2. Establish quality | Run baseline comparisons, tighten flagship skills, add useful examples and context contracts. | Saved scored outputs, weaknesses fixed, honest published coverage. |
| 3. Build brand research | Extend discovery into a bounded research-to-pack job; reuse six sections, evidence, versions, and auth. Keep job status explicit and resumable. | Correct identity, cited facts, labeled hypotheses, partial/failure recovery, user correction, stable export. |
| 4. Replace the primary UI | Build a small dedicated `/create` flow; revise homepage, skill details, install docs, and navigation around Describe → Review → Install. | New user finishes without navigating chats, foundations, mode selectors, or integrations. Keyboard/mobile checks pass. |
| 5. Migrate and release | Provide existing-brand export, preserve historical tasks, redirect old links safely, release behind a feature flag. | Existing work remains accessible; preview acceptance passes; rollback restores the previous entry point without data loss. |

Suggested first implementation slice: **one brand + three flagship skills + working install + one successful external-agent result**. Prove this before rebuilding every screen or expanding the library. Then extend the same mechanism to the full catalog.

Likely code boundaries:

- Preserve `content/skills`, `scripts/build-skills.mjs`, `evals`, and the catalog, with standards/export improvements.
- Reuse `lib/cookbook-foundations.ts`, version services, Supabase auth, and evidence protections.
- Add focused research-job, brand-pack serializer, and installation modules; avoid chat/task dependencies in these contracts.
- Replace the mount in `app/create/page.tsx` with the new intake/review/install component. Place legacy tasks behind an explicit history path, preserving task deep links during transition.
- Adapt `components/saved-cookbook.tsx` to distinguish brand context, procedural skills, and saved deliverables.
- Retain existing MCP/API behavior initially. Remove workflow/chat code and dependencies only after checking references, historical access, and remaining research use.
- Keep Next.js, Vercel, and Supabase. No infrastructure migration is justified by this product change.

## 8. Risks, verification, and product measures

**Privacy and security:** verify per-owner pack access and cross-brand isolation; keep context out of public Git, URLs, telemetry, and logs; treat source text as evidence rather than instructions. Preserve DNS/redirect protections when adding multi-domain research. Validate downloaded paths, sizes, and integrity; do not overwrite unrelated files.

**Reliability and cost:** website discovery may be wrong, sparse, blocked, or stale. Record coverage and research date. Jobs need cancellation, retry/idempotency, cost limits, and a recoverable partial result. Supabase/Vercel readiness alone does not demonstrate these properties.

**Performance:** load only the relevant skill and compact brief, then retrieve evidence as needed. Reuse extraction within a research job. Avoid per-brand duplication of the whole library and avoid running generation during installation.

**Migration:** preserve accepted brand versions separately from drafts, carry existing provenance into exports, keep historical work readable, and do not delete production tables as part of simplifying navigation. Verify pricing/entitlement copy no longer forces paid hosted deliverable execution into the portable path.

**Release checks:** clean installs, repeat installs, expired auth, failed downloads, read-only directories, uninstall without loss of brand files, conflicting local edits, two brands in separate projects, missing internet/tools, cancelled research, wrong-brand discovery, and attempts to retrieve another owner's pack. Verify mobile/keyboard flow and old links. Run applicable skill, database/integration, lint, and build checks after implementation changes.

Measure research-to-review completion, review-to-install completion, time to first useful brand-specific output, correction/editing burden, and repeat use in destination apps through opt-in feedback. Copy clicks are intent, not installs; downloads are not activation. Do not add invasive agent telemetry to measure retention.

Commercial hypothesis to validate later: free useful skills, paid high-quality research/refresh and optional team distribution. Avoid redesigning subscriptions before the first portable workflow proves useful.

## 9. Planning outcome

Proceed with a skills-and-brand-pack product direction. The most valuable simplification is ending the default web experience at a successful handoff to the user's AI app. Preserve the current skill and context investments; direct further effort into demonstrably better methods, reliable brand research, and frictionless private installation.

This document is the plan requested before implementation. No product code, production data, deployment settings, or accounts were changed during this review.
