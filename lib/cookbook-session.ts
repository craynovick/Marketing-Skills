import { profileFields, type CookbookProfile } from "@/lib/cookbook";

export const sessionFields = profileFields;
export type SessionField = (typeof sessionFields)[number];

export type CookbookEvidence = { url: string; excerpt: string; title?: string };

export const fieldQuestions: Record<SessionField, string> = {
  company: "What name should we use for the company or brand?",
  website: "Which canonical website should this Cookbook use?",
  audience: "Your website supports multiple audiences. Which audience is commercially primary this year?",
  positioning: "What is the one outcome you want that primary audience to associate with you?",
  offer: "Which offer should lead the conversation with that audience?",
  voice: "What should the voice feel like, and are there words or tones to avoid?",
  pillars: "What three to five buyer questions do you most want your content to answer?",
  formats: "Which formats or channels are most valuable for reaching this audience?",
  proof: "Which specific proof are you comfortable reusing in marketing?",
  constraints: "What approval, legal, privacy, or brand constraints should the AI follow?",
};

export const conversationOrder: SessionField[] = ["audience", "offer", "positioning", "voice", "pillars", "formats", "proof", "constraints"];

export function nextConversationField(field: SessionField) {
  const index = conversationOrder.indexOf(field);
  return conversationOrder[index + 1] || null;
}

export function sessionDraft(input: unknown): CookbookProfile {
  const value = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  return Object.fromEntries(sessionFields.map(field => [field, typeof value[field] === "string" ? value[field] : ""])) as CookbookProfile;
}
