import Link from "next/link";
import { DocsNav } from "@/components/docs-nav";

export default function Docs() {
  return <main className="wrap docs-layout"><DocsNav current="/docs" /><article className="prose docs-prose">
    <p className="eyebrow">DOCUMENTATION</p>
    <h1>Documentation</h1>
    <p className="lede">Thoughtful marketing starts with good ingredients. Build your brand foundations, choose a recipe, and turn what you know into work worth sharing.</p>
    <h2>How the system works</h2>
    <p>Recipes are reusable marketing workflows, packaged as Markdown skills. Each includes the questions to ask, the work to do, the deliverable to produce, and the evidence and safety checks to make along the way. Bring customer interviews, positioning, examples, and constraints to give each recipe something specific to work with.</p>
    <h2>Choose your kitchen</h2>
    <ul>
      <li><b>Use a recipe in your own AI app.</b> Copy or download a skill from the <Link href="/#catalog">Library</Link>. Its Guided run asks for missing context; no Cookbook account or connection is required.</li>
      <li><b>Work inside Cookbook.</b> Save and review your brand foundations, then use paid hosted workflows to create briefs, copy, campaigns, and readouts.</li>
      <li><b>Connect your AI app.</b> Give Codex, Claude Code, or a compatible client access to recipes and approved context. Proposed foundation changes come back to Cookbook for review; saving other deliverables requires paid hosting. See <Link href="/docs/connect">Connect your AI app</Link>.</li>
    </ul>
    <h2>Run modes</h2>
    <p>Every skill chooses the lightest appropriate mode. <b>Setup</b> asks business questions when foundations are missing. <b>Apply</b> uses approved context without repeating onboarding. <b>Tune</b> proposes revisions when new evidence or feedback arrives. <b>Validate</b> tests an assumption or claim without rewriting the foundation. Your explicit intent comes first, followed by the context supplied.</p>
    <h2>Foundational skills</h2>
    <p>Foundational skills turn customer evidence into reusable decisions about your audience, positioning, voice, content, proof, and constraints. They are marked <b>Foundational</b> in the Library. Your Pantry holds six foundation sections: brand, audience, voice, content, proof, and guardrails.</p>
    <h2>Applied skills</h2>
    <p>Applied skills use those foundations to create a specific brief, asset, campaign, or readout. Search, social formats, landing pages, campaigns, and repurposing should inherit approved decisions rather than invent a new brand each time.</p>
    <h2>Use your Cookbook</h2>
    <p>Start with <Link href="/create">Create your Cookbook</Link> to build and review your foundations. Signed-in work is saved to your Cookbook account with document versions. Drafts stay separate from approved context, and proposed changes become active only when you accept them in Cookbook. See <Link href="/docs/customize">Customize</Link> for website-assisted setup and review.</p>
    <h2>Use a skill</h2>
    <p>Pick the closest recipe from the Library and supply the evidence you have. Follow its Quick run when the inputs are ready, or its Guided run when you need help filling gaps. Review the output for accuracy, voice, and usefulness before putting it to work. The <Link href="/docs/install">workflow guide</Link> explains where to start.</p>
    <h2>Source and self-hosting</h2>
    <p>Explore the recipes, Cookbook agent, and integration code on <a href="https://github.com/craynovick/Marketing-Skills">GitHub</a>. The <Link href="/docs/self-host">self-hosting guide</Link> covers the application, database, model configuration, and current licensing status.</p>
    <h2>Review and safety</h2>
    <p>Skills prepare work; they do not authorize publishing, sending, or spending. Check factual claims, protect customer information, and review imported evidence. Connected agents can save permitted drafts and propose changes, but cannot accept your brand foundations for you. Read the <Link href="/docs/safety">safety guidelines</Link>.</p>
  </article></main>;
}
