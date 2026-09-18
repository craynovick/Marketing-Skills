import { convertToModelMessages, jsonSchema, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { scrapeWebsite } from "@/app/api/cookbook/analyze/route";

export const runtime = "nodejs";
export const maxDuration = 60;

const scrapeInput = jsonSchema<{ url: string }>({
  type: "object",
  properties: { url: { type: "string", description: "The public website URL to inspect." } },
  required: ["url"],
  additionalProperties: false,
});
const saveInput = jsonSchema<{ fileName: string; content: string; status: "Queue" | "Drafting" | "Ready" }>({
  type: "object",
  properties: {
    fileName: { type: "string" }, content: { type: "string" },
    status: { type: "string", enum: ["Queue", "Drafting", "Ready"] },
  },
  required: ["fileName", "content", "status"],
  additionalProperties: false,
});

/**
 * Streaming chat contract for the single-pane Cookbook UI. `saveSkillMarkdown`
 * deliberately returns the complete draft so the client can persist it to the
 * current user's storage provider without trusting model output implicitly.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as { messages?: UIMessage[]; activeSkill?: string };
    if (!Array.isArray(body.messages) || body.messages.length === 0) return Response.json({ error: "A chat message is required." }, { status: 400 });
    const result = streamText({
      model: "openai/gpt-5.4",
      messages: await convertToModelMessages(body.messages),
      stopWhen: stepCountIs(5),
      providerOptions: { gateway: { tags: ["feature:cookbook-chat", "surface:single-pane"] } },
      instructions: `You are Cookbook, a concise conversational brand strategist. The active skill is ${body.activeSkill || "a brand skill"}. Keep the conversation natural and useful. When a user gives a website, call scrapeWebsite before making brand claims. Use saveSkillMarkdown only when you have a clean Markdown draft for the active .md file. Do not expose raw HTML, do not make up facts, and clearly state uncertainty.`,
      tools: {
        scrapeWebsite: tool({ description: "Crawl a public website and return concise, safe brand evidence.", inputSchema: scrapeInput, execute: async ({ url }) => { const scraped = await scrapeWebsite(url); return { website: scraped.website, pageCount: scraped.pageCount, pages: scraped.pages.map(page => ({ url: page.url, title: page.title, excerpt: page.text.slice(0, 2_000) })) }; } }),
        saveSkillMarkdown: tool({ description: "Return a proposed Markdown update for a skill. The user interface asks the user to accept it before it becomes final.", inputSchema: saveInput, execute: async ({ fileName, content, status }) => ({ fileName, content, status, saved: false, requiresAcceptance: true }) }),
      },
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to continue the Cookbook chat." }, { status: 400 });
  }
}
