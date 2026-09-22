import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runEvaluations } from "../scripts/run-skill-evals.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "cookbook-behavior-"));
  mkdirSync(join(root, "content/skills/example"), { recursive: true });
  mkdirSync(join(root, "evals/example"), { recursive: true });
  writeFileSync(join(root, "content/skills/example/SKILL.md"), "# Skill\nProduce the requested draft.");
  for (const mode of ["setup", "apply", "tune", "validate", "safety"]) {
    writeFileSync(join(root, "evals/example", `${mode}.md`), `## Brief\nA fictional brand.\n## Request\n${mode} the draft.\n## Expected behavior\nEVALUATOR_ONLY_SENTINEL\n`);
  }
  const runner = join(root, "runner");
  writeFileSync(runner, `#!${process.execPath}\nconst fs = require('node:fs'); const input = JSON.parse(fs.readFileSync(0, 'utf8')); if (JSON.stringify(input).includes('EVALUATOR_ONLY_SENTINEL')) process.exit(4); console.log(input.canonicalDraft ? 'Tuned: ' + input.canonicalDraft.trim() : 'Canonical actual draft');`, { mode: 0o700 });
  return { root, runner, model: "mock-contract-only", output: join(root, "results") };
}

test("all modes keep evaluator expectations out of stdin and Tune receives actual Apply", () => {
  const options = fixture();
  try {
    const result = runEvaluations(options);
    assert.equal(result.failed, false);
    assert.equal(result.manifest.runs.length, 5);
    assert.ok(result.manifest.runs.every(r => r.status === "generated" && r.outputHash));
    const tune = JSON.parse(readFileSync(join(options.output, "example/tune/input.json"), "utf8"));
    assert.equal(tune.canonicalDraft, "Canonical actual draft\n");
    assert.ok(!JSON.stringify(tune).includes("EVALUATOR_ONLY_SENTINEL"));
    assert.throws(() => runEvaluations(options), /already exists/);
  } finally { rmSync(options.root, { recursive: true, force: true }); }
});

test("failed Apply blocks Tune and never records a behavioral pass", () => {
  const options = fixture();
  try {
    writeFileSync(options.runner, `#!${process.execPath}\nprocess.exit(3);`, { mode: 0o700 });
    const result = runEvaluations({ ...options, mode: "tune" });
    assert.equal(result.failed, true);
    assert.deepEqual(result.manifest.runs.map(r => r.status), ["failed", "blocked"]);
    assert.ok(result.manifest.runs.every(r => !r.outputHash));
  } finally { rmSync(options.root, { recursive: true, force: true }); }
});
