import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve("evals");
const skillRoot = resolve("content/skills");
const modes = ["setup", "apply", "tune", "validate", "safety"];
const directories = (folder) => readdirSync(folder, { withFileTypes: true })
  .filter(entry => entry.isDirectory()).map(entry => entry.name);
const skills = directories(skillRoot);
if (!skills.length) throw new Error("No source skills found.");
const suites = directories(root);
for (const suite of suites) {
  if (!skills.includes(suite)) throw new Error(`Evaluation suite has no source skill: ${suite}`);
}
for (const skill of skills) {
  if (!existsSync(join(skillRoot, skill, "SKILL.md"))) throw new Error(`Missing source skill: ${skill}`);
  for (const mode of modes) {
    const file = join(root, skill, `${mode}.md`);
    if (!existsSync(file)) throw new Error(`Missing evaluation fixture: ${file}`);
    const fixture = readFileSync(file, "utf8");
    for (const section of ["Brief", "Request", "Expected behavior"]) {
      const body = fixture.match(new RegExp(`(?:^|\\n)## ${section}\\n([\\s\\S]*?)(?=\\n## |$)`))?.[1];
      if (!body?.trim()) throw new Error(`Missing ${section} in fixture: ${file}`);
    }
  }
}
for (const required of ["README.md", "rubric.md", "chat-scenarios.md"]) {
  const file = join(root, required);
  if (!existsSync(file) || !readFileSync(file, "utf8").trim()) throw new Error(`Missing evaluation guidance: ${required}`);
}
console.log(`Validated ${skills.length} source skill suites with ${modes.length} fixtures each. This is structural coverage, not a model evaluation.`);
