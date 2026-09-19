import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsNav } from "@/components/docs-nav";

const repository = "https://github.com/craynovick/Marketing-Skills";

const faqItems = [
  { question: "Do I need a Cookbook before using a recipe?", answer: <p>No. Copy or download a recipe and use it in your own AI app. Its Guided run asks for missing business context. A saved Cookbook helps you reuse approved decisions across workflows, but portable skills work independently.</p> },
  { question: "What do Setup, Apply, Tune, and Validate mean?", answer: <p>Setup builds missing foundations. Apply uses approved context to produce a deliverable. Tune proposes changes based on new evidence or feedback. Validate checks assumptions, claims, or a draft without rewriting the foundation. Your request and the available context determine the mode.</p> },
  { question: "Where is my brand context stored?", answer: <p>Signed-in foundations and deliverables are saved in your Cookbook account, with document versions and review history. Your Pantry contains brand, audience, voice, content, proof, and guardrails. Pending drafts stay separate from approved context. A self-hosted installation uses its own Supabase database; it does not automatically sync with the hosted service.</p> },
  { question: "What is free, and what requires paid hosting?", answer: <p>All recipes and the ability to store, review, and improve brand foundations are available with a free hosted account. Running non-foundational workflows inside Cookbook and saving other deliverables generated in an external app require paid hosting. Downloaded recipes remain usable in your own AI app. See <Link href="/pricing">Pricing</Link> for current hosted plans.</p> },
  { question: "How much website-assisted setup is included?", answer: <p>Free setup includes one successful initial scan and up to three successful follow-ups on the same site, with a maximum of six pages per scan. Follow-ups must address a stated evidence gap in an unfinished foundation. The allowance ends when you mark setup complete or use all four successful scans. Failed scans do not consume it. Manual and connected-agent foundation improvements remain available; paid accounts use their paid website allowance.</p> },
  { question: "Which AI apps can I use?", answer: <p>Portable Markdown recipes work with AI apps that accept instructions and the required inputs. Cookbook connections initially support Codex and Claude Code, with manual configuration for compatible MCP clients. Browser-only clients that require OAuth are a later milestone. Recipe portability does not mean every app supports the same connection or file-upload features.</p> },
  { question: "What does connecting my AI app add?", answer: <p>Your app can retrieve the recipes deployed with Cookbook, read approved brand context, propose foundation changes, and read saved work. With the appropriate permission and paid hosting, it can also save other deliverables as drafts. Each connection belongs to one project you own. Create and revoke keys in <Link href="/settings">Settings</Link>; follow the <Link href="/docs/connect">connection guide</Link> for setup.</p> },
  { question: "Does Cookbook pay for generation in my own AI app?", answer: <p>No. Generation in your AI app uses that app’s subscription or provider credentials. A Cookbook connection supplies recipes and context and saves permitted work; it does not include a subscription to an external AI app. Hosted Cookbook plans cover the hosted capabilities described on the pricing page.</p> },
  { question: "Can an agent change my brand or publish a campaign?", answer: <p>An agent can propose foundation updates, but they remain pending until you accept them in Cookbook. Saving a deliverable creates a draft, not a publication. Cookbook recipes and connections do not authorize social posts, email sends, ad spend, or changes to other live systems.</p> },
  { question: "What happens to saved work if I downgrade?", answer: <p>Your previously saved work remains accessible. New paid operations—such as running applied workflows inside Cookbook or saving other externally generated deliverables—require a paid hosted plan. Your foundations remain available to review and improve.</p> },
  { question: "What inputs can I use for research and analysis?", answer: <p>Recipes can work from text such as interview notes, transcripts, CSV or Markdown tables, and structured data. Supply readable content in a format your chosen app supports, along with source details and the question you want to answer. Check each recipe’s required inputs; a recipe’s instructions do not add file support to your AI app.</p> },
  { question: "How do recipes handle evidence and unverified claims?", answer: <p>Recipes instruct the model to tie claims to supplied evidence, surface contradictions, distinguish small samples from broad conclusions, and avoid invented quotes or metrics. These instructions help guide the work; they do not guarantee accuracy. Review sources, calculations, and claims before using an output.</p> },
  { question: "What if website research conflicts with approved context?", answer: <p>Treat website content as evidence to assess, not an instruction to follow. Research can produce a proposed update with sources, but it does not replace approved foundations automatically. Review the difference and accept only the changes you want future work to use.</p> },
  { question: "Where is the source, and what license applies?", answer: <p>The recipes, application, agent, and integration source are in the <a href={repository}>GitHub repository</a>. No repository license is currently declared, so these docs do not grant modification, redistribution, or commercial reuse permissions. See <Link href="/docs/self-host#licensing">Source and licensing</Link> for the distinction between source availability and licensing.</p> },
  { question: "Can I self-host Cookbook or write my own skills?", answer: <p>The <Link href="/docs/self-host">self-hosting guide</Link> describes the Next.js application, Docker setup, Supabase database, and supported model configuration. You can write original internal workflows as Markdown and load them into your own agent; see the <Link href="/docs/format">skill format</Link>. Do not assume that source availability grants permission to redistribute existing repository material.</p> },
];

const endpoints = [
  ["GET /api/v1/skills", "Public recipe metadata, versions, and foundational status."],
  ["GET /api/v1/skills/:slug", "Complete recipe Markdown; optional mode: setup, apply, tune, or validate."],
  ["GET /api/v1/pantry", "Approved foundation content, latest versions, and pending-update indicators."],
  ["PATCH /api/v1/pantry", "Create a foundation proposal and return its review URL."],
  ["POST /api/v1/artifacts", "Save an externally generated deliverable as a draft; paid hosting required."],
  ["GET /api/v1/artifacts", "List saved deliverables with limit and cursor pagination."],
  ["GET /api/v1/artifacts/:id", "Read an owned deliverable and its content."],
  ["GET /api/v1/connection", "Check connection identity, permissions, and hosted entitlements."],
];

const pages: Record<string, { title: string; body: React.ReactNode }> = {
  install: { title: "Use a workflow", body: <>
    <p>Choose the closest recipe, bring the context you have, and work toward a concrete deliverable. You can run a downloaded skill in your own AI app, use a hosted Cookbook workflow, or connect an app to your saved foundations.</p>
    <h2>Start with the ingredients</h2>
    <p>Open a recipe from the <Link href="/#catalog">Library</Link> and read its required inputs. Provide source material, your goal, the intended audience, and any constraints. Use Quick run when those inputs are ready; use Guided run when you want help filling gaps. No saved Cookbook is required to use a downloaded skill.</p>
    <h2>Workflow order</h2>
    <p>When possible, move from customer evidence to audience, positioning, voice, content, and proof before using applied recipes for search, social, landing pages, campaigns, or reporting. Start with the foundation most relevant to the work; you do not need to complete every recipe first.</p>
    <h2>Run modes</h2>
    <ul><li><b>Setup:</b> establish missing foundations through focused questions.</li><li><b>Apply:</b> use approved context to create the requested deliverable.</li><li><b>Tune:</b> propose targeted revisions in response to evidence or feedback.</li><li><b>Validate:</b> test assumptions or check a draft without rewriting approved foundations.</li></ul>
    <h2>Review the result</h2>
    <p>Check the sources, claims, audience fit, and voice. Saved drafts are working material; foundation changes need explicit acceptance in Cookbook before they become approved context. Publishing, sending, and spending require their own authorization.</p>
    <h2>Keep useful context close</h2>
    <p>Free hosted accounts can build and improve foundations. Applied workflows inside Cookbook require paid hosting. To use saved foundations from another app, follow <Link href="/docs/connect">Connect your AI app</Link>. External generation uses that app’s subscription or credentials.</p>
  </> },
  customize: { title: "Create your Cookbook", body: <>
    <p>Your Cookbook is a reusable record of what makes your brand specific. Start in <Link href="/create">Create your Cookbook</Link>, bring your own evidence, and review the decisions you want future recipes to inherit.</p>
    <h2>What goes in the Pantry</h2>
    <ul><li><b>Brand:</b> company identity, offer, and positioning.</li><li><b>Audience:</b> who you serve, their needs, and buying context.</li><li><b>Voice:</b> tone, language, and examples of how you sound.</li><li><b>Content:</b> themes, pillars, and useful formats.</li><li><b>Proof:</b> customer evidence and supported claims.</li><li><b>Guardrails:</b> constraints, exclusions, and rules the work must respect.</li></ul>
    <h2>Drafts and approval</h2>
    <p>Foundations are saved to your account with document versions. Website research, recipes, and connected agents can propose changes. Those proposals stay pending until you review and accept them in Cookbook. Approved content remains the context for future work while a newer draft is waiting.</p>
    <h2>Website-assisted setup</h2>
    <p>Free hosted setup includes one successful initial scan plus three successful follow-ups, with up to six pages per scan. The first successful import fixes the site for that allowance; its hostname and www equivalent count as the same site.</p>
    <p>Follow-ups must name an evidence gap in an unfinished foundation. They cannot switch to an unrelated site, and they stop when you mark setup complete or exhaust the allowance. Failed imports do not consume a successful scan. Paid accounts use their paid website allowance.</p>
    <h2>Keep improving</h2>
    <p>You can continue improving foundations manually or through a connected AI app after website setup ends. Use Tune when evidence changes, and Validate when you want to test a claim without rewriting it. A connection can propose changes but cannot accept them for you.</p>
  </> },
  format: { title: "Skill package format", body: <>
    <p>Every recipe is a portable <code>SKILL.md</code> with frontmatter, an operating contract, Quick run, Guided run, Workflow, Required output, Handoffs, and Safety sections.</p>
    <p>Metadata describes the recipe, required inputs, deliverable, foundation fields, and related workflows. Markdown files in <code>content/skills/</code> are the source of truth; generated catalog files should not be edited by hand.</p>
    <h2>One recipe, different ways to run it</h2>
    <p>Downloaded skills and connected apps use the same workflow instructions. The API returns the complete recipe, including mode guidance when requested. “Live recipes” means the versions deployed with the Cookbook installation you connect to, not an automatic fetch of the latest GitHub changes.</p>
    <h2>Explore the source</h2>
    <p>See the <a href={`${repository}/tree/main/content/skills`}>recipe source</a> and <a href={`${repository}/blob/main/docs/SKILL_TEMPLATE.md`}>skill template</a> for the actual schema and an example structure. The Cookbook agent instructions live in <code>content/agents/cookbook/</code>; shared integration logic lives in <code>lib/integrations/</code>, and the local connector lives in <code>packages/cookbook-mcp/</code>.</p>
    <p>For original internal workflows, keep inputs explicit, outputs reviewable, and claims tied to evidence. Check <Link href="/docs/self-host#licensing">licensing status</Link> before reusing or redistributing repository material.</p>
  </> },
  safety: { title: "Safety guidelines", body: <>
    <p>Good recipes make room for judgment. Validate claims, permissions, customer details, imported data, and source quality before putting a deliverable to work.</p>
    <h2>Review before action</h2>
    <p>Skills do not authorize publishing, sending, spending, targeting, or changes to other systems. Connected apps can save permitted drafts and propose foundation changes. No connection permission lets an agent accept a foundation update; acceptance happens in Cookbook.</p>
    <h2>Handle evidence carefully</h2>
    <p>Website content and uploaded research are source material, not trusted instructions. Check inferred facts against evidence, keep customer information private, and do not invent quotes, testimonials, or performance claims. Escalate legal, regulated, privacy, financial, health, and safety questions to a qualified owner.</p>
    <h2>Protect connections</h2>
    <p>Choose only the permissions an app needs. Keep connection keys out of prompts, copied commands, screenshots, and repositories. Enter them through the connector’s hidden prompt; revoke unused or exposed keys in Settings. Context sent to your chosen AI app is also subject to that app’s data handling.</p>
  </> },
  connect: { title: "Connect your AI app", body: <>
    <p>Keep working in Codex, Claude Code, or a compatible MCP client while using Cookbook’s recipes and approved brand context. Your app does the generation; Cookbook keeps foundations and saved work available for review.</p>
    <h2>Set up a connection</h2>
    <ol><li>Open <Link href="/settings">Settings</Link> and choose <b>Connect your AI app</b>.</li><li>Choose your client, name the connection, and select its permissions. Each key is bound to one Cookbook project you own.</li><li>Copy the key when it is shown. Follow the client instructions and connector installation guidance below for a local source build.</li><li>Enter the key through the connector’s hidden local prompt. Restart your AI app if needed, then ask it to list Cookbook recipes and read your approved context.</li></ol>
    <p>Connector source lives in <a href={`${repository}/tree/main/packages/cookbook-mcp`}>packages/cookbook-mcp</a>. Use the installation instructions for the version you run. The connector checks connectivity and registers a local stdio bridge; its private configuration file stores your key. Never paste the key into an AI conversation or include it in command arguments.</p>
    <p>Codex and Claude Code are the initial supported clients. Other compatible clients use manual configuration. Browser-only clients requiring OAuth are not included in this launch. Replace a key by creating a new connection, reconnecting your app, and revoking the old key in Settings.</p>
    <h2>Build the local connector</h2>
    <p>With Node.js 22 or newer and pnpm installed, open a local checkout of the <a href={repository}>repository</a>. Run <code>pnpm install --frozen-lockfile</code>, then <code>pnpm build:mcp</code> from its root. The build creates <code>packages/cookbook-mcp/dist/cli.mjs</code>.</p>
    <p>For Codex, run <code>node packages/cookbook-mcp/dist/cli.mjs connect --client codex</code>. For Claude Code, replace <code>codex</code> with <code>claude-code</code>. The selected client’s CLI must be installed and available in your terminal.</p>
    <p>Use <code>--client manual</code> to print configuration for another compatible client. Add <code>--url</code> followed by your installation’s HTTPS URL for self-hosting. If a registration already uses the name, choose another with <code>--name</code>; the connector does not silently replace it. Keep the built connector and its private configuration file in place after registration.</p>
    <h2>Choose permissions</h2>
    <ul><li><code>context:read</code> reads approved foundations and saved deliverables.</li><li><code>foundations:write</code> proposes foundation updates for human review; available on free hosted accounts.</li><li><code>artifacts:write</code> saves other deliverables as drafts; requires paid hosting.</li></ul>
    <p>Permissions do not override hosted plan limits. No permission accepts foundation changes. Using your own AI app consumes that app’s subscription or provider credentials.</p>
    <h2>MCP interface</h2>
    <p>MCP—the Model Context Protocol—lets your app discover Cookbook tools. Remote MCP uses Streamable HTTP at <code>/mcp</code>. The local stdio bridge calls the same REST API and can target a hosted or self-hosted Cookbook URL.</p>
    <ul><li><code>list_recipes</code> and <code>get_recipe</code> retrieve deployed recipes and mode guidance.</li><li><code>get_brand_context</code> reads approved foundations.</li><li><code>update_brand_context</code> returns a proposal marked pending review, with a Cookbook review link.</li><li><code>save_deliverable</code>, <code>list_deliverables</code>, and <code>get_deliverable</code> save or retrieve permitted work.</li></ul>
    <p>Resources are available at <code>cookbook://pantry/brand-context</code> and <code>cookbook://recipes/&#123;slug&#125;</code>. The <code>customer-interview-synthesizer</code> prompt accepts interview notes and an optional research goal. Rendering the prompt includes approved context; it does not itself call a model.</p>
    <h2>REST API</h2>
    <p>Recipe reads are public. Other endpoints require a connection key in the <code>Authorization: Bearer</code> header. Browser cookies and Supabase administrator credentials are not integration credentials.</p>
    <dl>{endpoints.map(([endpoint, description]) => <div key={endpoint}><dt><code>{endpoint}</code></dt><dd><p>{description}</p></dd></div>)}</dl>
    <h2>Write requests and versions</h2>
    <p>Foundation keys are <code>brand</code>, <code>audience</code>, <code>voice</code>, <code>content</code>, <code>proof</code>, and <code>guardrails</code>. Pantry reads separate <code>approvedContent</code> and <code>approvedVersion</code> from <code>latestVersion</code> and <code>pending</code>. Use approved content for generation and the latest version when proposing an edit.</p>
    <p>A foundation request contains a UUID <code>requestId</code> and an <code>updates</code> array. Each update supplies <code>key</code>, Markdown <code>content</code>, <code>sources</code>, and <code>expectedVersion</code>. Each section allows 20,000 characters and exactly one Markdown title. The response includes a proposal ID and review URL; the change is still pending.</p>
    <p>A deliverable request supplies a UUID <code>requestId</code>, a published <code>skillSlug</code>, <code>title</code>, and <code>contentMarkdown</code> up to 60,000 characters. Optional <code>metadata</code> is bounded; optional <code>agentName</code> identifies the generating app on either write. A successful save returns the saved ID and Cookbook URL.</p>
    <p>Retry the same write with the same request ID and content. Reusing an ID with different content returns <code>IDEMPOTENCY_CONFLICT</code>. On <code>STALE_VERSION</code>, read the latest document and review the change before submitting a new request. Never treat a pending draft as an approved fact.</p>
    <h2>Troubleshooting</h2>
    <p><code>AUTH_REQUIRED</code> means the key is missing, invalid, expired, or revoked. <code>FORBIDDEN</code> indicates missing permission; <code>PLAN_REQUIRED</code> indicates a hosted entitlement requirement. Fix invalid fields on <code>INVALID_REQUEST</code>, and respect the retry delay on <code>RATE_LIMITED</code>. List requests accept <code>limit</code> from 1 to 100 and an opaque <code>cursor</code>; use the returned <code>nextCursor</code> for the next page.</p>
  </> },
  "self-host": { title: "Source and self-hosting", body: <>
    <p>Cookbook brings portable recipes, brand foundations, and reviewed deliverables together in a Next.js application. The <a href={repository}>GitHub repository</a> contains the recipes, application, agent instructions, database migrations, and integration code.</p>
    <h2 id="licensing">Source and licensing</h2>
    <p>No repository license is currently declared. Source availability is not a statement of modification, redistribution, or commercial reuse permissions, and this guide does not grant those rights. Check the repository for an explicit license covering the material you intend to use. Hosted plan access and source licensing are separate questions.</p>
    <h2>What an installation needs</h2>
    <p>The application uses Node.js 22 or newer, pnpm, and Supabase for authentication and saved work. Supabase may be hosted or local. The repository includes a Dockerfile and Compose configuration for the application; Compose does not start a Supabase database for you.</p>
    <p>Recipes live in <code>content/skills/</code>, agent instructions in <code>content/agents/cookbook/</code>, integration services in <code>lib/integrations/</code>, and the connector in <code>packages/cookbook-mcp/</code>. Database migrations live in <code>supabase/migrations/</code>.</p>
    <h2>Configure the application</h2>
    <ol><li>From your local checkout, copy <code>.env.example</code> to <code>.env.local</code>.</li><li>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> for your Supabase instance. Keep <code>SUPABASE_SERVICE_ROLE_KEY</code> server-side only.</li><li>Apply the repository’s migrations in order to your own database. Set <code>NEXT_PUBLIC_APP_URL</code> to the application’s exact origin and configure Supabase authentication URLs for that origin.</li><li>Set <code>AI_GATEWAY_API_KEY</code> for server-side model calls and review <code>COOKBOOK_MODEL</code>. Keep model credentials out of browser variables and source control.</li></ol>
    <p>For local development, run <code>corepack enable</code>, <code>pnpm install --frozen-lockfile</code>, and <code>pnpm dev</code> from the repository root. For the included container setup, run <code>docker compose up --build</code>; it reads <code>.env.local</code> and serves the application on port 3000. These start the application; database and model configuration are still required for saved, AI-assisted work. Configure and verify the background workflow runtime separately for your hosting environment; REST and MCP data access do not require model generation.</p>
    <h2>Enable foundations and connections</h2>
    <p>After applying migrations and verifying the setup, enable <code>COOKBOOK_V2_ENABLED=true</code> and <code>COOKBOOK_INTEGRATIONS_ENABLED=true</code> on the server. Set <code>COOKBOOK_DEPLOYMENT=self-hosted</code> for a self-hosted deployment. This disables commercial gates while retaining authentication, project permissions, and resource safeguards; it is not a source license.</p>
    <p>Create a connection in your installation’s Settings page and follow the <Link href="/docs/connect">connection guide</Link>, using your installation URL. The local bridge needs a Cookbook connection key, not database administrator credentials. Hosted and self-hosted installations do not automatically share accounts, keys, or saved work.</p>
    <h2>Model support</h2>
    <p>The application’s server-side model calls use the configured AI Gateway. Provider-specific BYOK routing is not enabled simply by setting the optional OpenAI, Anthropic, or Google variables in the example environment file. That routing is future work. Portable recipes can be used independently in your chosen AI app, and connected apps use their own subscription or credentials.</p>
    <h2>Operate your installation</h2>
    <p>Use HTTPS for remote access, protect server secrets, and keep database backups with a tested restore process. Review migrations before upgrades and verify sign-in, foundation acceptance, draft saving, and connection revocation afterward. For container deployments, verify public Supabase configuration in the built application as well as runtime secrets before making the service available.</p>
  </> },
  faq: { title: "Frequently Asked Questions", body: <dl>{faqItems.map(({ question, answer }) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}</dl> },
};

export const documentationSlugs = Object.keys(pages);

export function DocumentationPage({ page }: { page: string }) {
  const doc = Object.hasOwn(pages, page) ? pages[page] : undefined;
  if (!doc) notFound();
  return <main className="wrap docs-layout"><DocsNav current={`/docs/${page}`} /><article className="prose docs-prose"><p className="eyebrow">DOCUMENTATION</p><h1>{doc.title}</h1>{doc.body}</article></main>;
}
