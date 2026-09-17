import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve("evals");
const modes = ["setup", "apply", "tune", "validate", "safety"];
const skills = readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory());
if (!skills.length) throw new Error("No skill evaluation suites found.");
for (const skill of skills) {
  for (const mode of modes) {
    const file = join(root, skill.name, `${mode}.md`);
    if (!existsSync(file) || !readFileSync(file, "utf8").trim()) throw new Error(`Missing evaluation fixture: ${file}`);
  }
}
for (const required of ["README.md", "rubric.md"]) if (!existsSync(join(root, required))) throw new Error(`Missing evaluation guidance: ${required}`);
console.log(`Validated ${skills.length} skill evaluation suite${skills.length === 1 ? "" : "s"} with ${modes.length} fixtures each.`);
