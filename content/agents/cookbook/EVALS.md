# Cookbook release evaluations

Validate source metadata and full inventory fixture coverage before release. Exercise the source skill contracts and chat scenarios with concrete inputs, then score actual responses using `evals/rubric.md`: at least 80/100, no zero category, and no critical failure. Fixture coverage is not evidence of successful model behavior; there is no automated model evaluation runner in this repository yet.

Cover all 18 skills across Setup, Apply, Tune, Validate, and Safety. Include technical B2B, consumer, services, and product briefs; sparse/conflicting evidence; unavailable pricing data; constrained resources; three finished posts; precise revision preservation; and in-chat selection of each GTM skill. Verify raw Markdown, generated recipes, and hosted loading use the same source instructions. Do not let reference-brand facts or stylistic rules contaminate another brand.

Exercise failed research, document prompt injection, unsupported claims, and preservation of accepted content. Inspect actual tools used, artifact quality, source fidelity, useful completion, and recovery. Invented evidence, leaked private content, false completion, unauthorized acceptance, or cross-task writes fail regardless of aggregate score.

Run authenticated UI and database checks separately for task isolation, persistence, cancellation, version conflicts, restoration, and upload failures. Record model/configuration when known, skill versions, prompt hashes, actual outputs, category scores, tool traces, and unexecuted scenarios. Keep structural, mocked integration, portable model, and hosted results distinct. Preserve the prior deployment for rollback; Markdown changes do not authorize deployment.
