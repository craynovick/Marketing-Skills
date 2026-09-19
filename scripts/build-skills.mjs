import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
const root = resolve("content/skills");
const WORKFLOW_ORDER = ["customer-interview-synthesizer", "ideal-customer-profile-builder", "audience-strategy-playbook", "brand-claims-confidentiality-guide", "brand-positioning-workshop", "brand-voice-guide", "content-pillar-planner", "content-format-planner", "seo-content-brief", "landing-page-copywriter", "content-repurposing-engine", "campaign-launch-kit", "case-study-creator", "weekly-growth-readout", "competitive-intelligence-brief", "go-to-market-strategy", "offer-pricing-strategy", "sales-enablement-playbook"];
const FOUNDATIONAL = new Set(["customer-interview-synthesizer", "ideal-customer-profile-builder", "audience-strategy-playbook", "brand-claims-confidentiality-guide", "brand-positioning-workshop", "brand-voice-guide", "content-pillar-planner"]);
const LIST_KEYS = ["inputs", "parameters", "models", "writes_profile", "requires_profile", "upstream", "downstream"];
const value = (text) => text.trim().replace(/^['"]|['"]$/g, "");

// Deliberately support the small frontmatter subset documented in SKILL_TEMPLATE.md.
function parse(file) {
  const raw = readFileSync(file, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter: ${file}`);
  const meta = {};
  let list;
  for (const line of match[1].split("\n")) {
    if (line.startsWith("  - ")) {
      if (!list) throw new Error(`Unexpected list item: ${file}`);
      list.push(value(line.slice(4)));
      continue;
    }
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`Invalid frontmatter line: ${file}`);
    const key = line.slice(0, separator);
    const entry = value(line.slice(separator + 1));
    list = undefined;
    if (LIST_KEYS.includes(key)) {
      if (entry && entry !== "[]") throw new Error(`Use block lists or [] for ${key}: ${file}`);
      list = [];
      meta[key] = list;
    } else if (key === "featured") {
      if (!["true", "false"].includes(entry)) throw new Error(`Invalid featured flag: ${file}`);
      meta[key] = entry === "true";
    } else {
      meta[key] = entry;
    }
  }
  for (const key of LIST_KEYS) {
    if (!Array.isArray(meta[key])) throw new Error(`Missing list ${key}: ${file}`);
  }
  const body = match[2].trim();
  const section = (heading) => body.match(new RegExp(`(?:^|\\n)## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`))?.[1]?.trim() ?? "";
  const slug = file.split("/").at(-2);
  const foundational = FOUNDATIONAL.has(slug);
  return {
    slug, ...meta, foundational, order: WORKFLOW_ORDER.indexOf(slug),
    goal: meta.description,
    tags: [meta.category, "strategy", meta.complexity, ...(foundational ? ["foundational"] : [])],
    time: meta.complexity === "Low" ? "15 min" : meta.complexity === "Medium" ? "30 min" : "45 min",
    agents: ["Codex", "Claude", "Cursor"],
    when: `Use this when you need a clear, credible ${meta.output} without starting from a blank page.`,
    safety: section("Safety"), quick: section("Quick run"), guided: section("Guided run"),
    skill: raw,
  };
}

const files = readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isDirectory()).map(entry => join(root, entry.name, "SKILL.md"));
const skills = files.map(parse).sort((a, b) => a.order - b.order);
const required = ["name", "title", "description", "category", "complexity", "inputs", "parameters", "models", "output", "version", "safety", "quick", "guided", "skill"];
for (const skill of skills) {
  for (const key of required) {
    if (!skill[key] || (Array.isArray(skill[key]) && !skill[key].length)) {
      throw new Error(`Invalid skill: ${skill.slug} (${key})`);
    }
  }
}
// Fail before writing generated files when the portable contract is incomplete.
const slugs = new Set(skills.map(skill => skill.slug));
if (slugs.size !== WORKFLOW_ORDER.length || WORKFLOW_ORDER.some(slug => !slugs.has(slug))) {
  throw new Error("Workflow order must contain every skill exactly once.");
}
for (const skill of skills) {
  if (!/^\d+\.\d+\.\d+$/.test(skill.version)) throw new Error(`Invalid version: ${skill.slug}`);
  if (!["Low", "Medium", "High"].includes(skill.complexity)) throw new Error(`Invalid complexity: ${skill.slug}`);
  for (const target of [...skill.upstream, ...skill.downstream]) {
    if (!slugs.has(target)) throw new Error(`Unknown handoff: ${skill.slug} → ${target}`);
  }
  for (const [, key] of skill.skill.matchAll(/\{\{(\w+)\}\}/g)) {
    if (!skill.parameters.includes(key)) throw new Error(`Undeclared parameter: ${skill.slug} (${key})`);
  }
}
const type="{slug:string;name:string;title:string;description:string;category:string;complexity:\"Low\"|\"Medium\"|\"High\";inputs:string[];parameters:string[];models:string[];output:string;featured?:boolean;foundational:boolean;order:number;version:string;tags:string[];time:string;agents:string[];goal:string;when:string;safety:string;quick:string;guided:string;skill:string;writes_profile:string[];requires_profile:string[];upstream:string[];downstream:string[]}";
writeFileSync(resolve("lib/generated-skills.ts"),`// Generated by scripts/build-skills.mjs. Edit content/skills/*/SKILL.md instead.\nexport type Skill = ${type};\nexport const skills: Skill[] = ${JSON.stringify(skills,null,2)};\nexport const getSkill=(slug:string)=>skills.find(skill=>skill.slug===slug);\n`);
console.log(`Built ${skills.length} skills.`);
// Browser navigation only needs metadata, never the full agent instructions.
writeFileSync(resolve("lib/generated-skill-catalog.ts"), `// Generated by scripts/build-skills.mjs.\nexport const skills = ${JSON.stringify(skills.map(({slug,name,description,category,version})=>({slug,name,description,category,version})),null,2)};\n`);
