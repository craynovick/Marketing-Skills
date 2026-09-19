export const foundations = [
  { key: "brand", name: "Brand & positioning", description: "Who you are, what you offer, and why it matters." },
  { key: "audience", name: "Your audience", description: "Priority customers, their needs, and objections." },
  { key: "voice", name: "Voice & tone", description: "How your brand sounds, with useful examples." },
  { key: "content", name: "Content priorities", description: "Pillars, channels, and formats worth focusing on." },
  { key: "proof", name: "Proof & claims", description: "Claims you can support and sources behind them." },
  { key: "guardrails", name: "Brand guardrails", description: "Restrictions, confidentiality, and review rules." },
] as const;
export type FoundationKey = typeof foundations[number]["key"];
export type BrandUpdate = { key: FoundationKey; content: string; expectedVersion: number; sources: string[] };
export type BrandProposal = {
  id: string; task_id: string; status: "pending" | "kept" | "skipped";
  items: { key: FoundationKey; taskId: string; documentId: string; version: number; content: string; sources: string[] }[];
};
export function validateBrandUpdates(value: unknown): asserts value is BrandUpdate[] {
  if (!Array.isArray(value) || !value.length || value.length > 6) throw new Error("Choose one to six brand documents.");
  const keys = new Set<string>();
  for (const item of value) {
    if (!item || !foundations.some(f => f.key === item.key) || keys.has(item.key) ||
      typeof item.content !== "string" || !item.content.trim() || item.content.length > 20000 ||
      (item.content.match(/^#\s+.+$/gm) || []).length !== 1 ||
      !Number.isInteger(item.expectedVersion) || item.expectedVersion < 0 ||
      !Array.isArray(item.sources) || item.sources.length > 20 ||
      item.sources.some((s: unknown) => typeof s !== "string" || s.length > 2000 || !/^https?:\/\//i.test(s)))
      throw new Error("Provide unique brand documents, each with one title, a current version, and public source links.");
    keys.add(item.key);
  }
}

export function taskStatus(task: { lifecycle: string; accepted_version_id?: string | null; document?: unknown; has_document?: boolean; run_status?: string | null }) {
  if (task.run_status === "queued") return "Queued";
  if (task.run_status === "running") return "Working…";
  if (task.run_status === "awaiting_input") return "Your input needed";
  if (["failed", "interrupted", "cancelled"].includes(task.run_status || "")) return "Needs attention";
  return task.lifecycle === "accepted" ? "Accepted" : task.document || task.has_document ? "Draft" : "Ready to start";
}
