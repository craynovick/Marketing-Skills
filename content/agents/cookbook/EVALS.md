# Cookbook release evaluations

Run the fixture validator and the executable agent evaluation runner before release. Fixture coverage is not evidence of successful model behavior.

Exercise all 15 skill contracts with concrete input, plus strong/sparse/conflicting sites, unsupported regulated claims, ambiguous goals, wording-only revision, failed crawl, document prompt injection, and preservation of accepted content. Verify actual tools used, saved artifact quality, source fidelity, useful completion, and recovery. A critical failure (invented evidence, leaked private content, false completion, unauthorized acceptance, or cross-task writes) fails release regardless of aggregate score.

Run authenticated UI and database tests separately for task isolation, persistence, cancellation, version conflicts, restoration, and upload failures. Record model, skill version, prompt version, results, and any unexecuted scenarios. Keep the previous deployment available for rollback.
