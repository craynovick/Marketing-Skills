export const profileFields = ["company", "website", "audience", "positioning", "offer", "voice", "pillars", "formats", "proof", "constraints"] as const;
export type CookbookProfile = Record<(typeof profileFields)[number], string>;
export const emptyCookbook: CookbookProfile = Object.fromEntries(profileFields.map(field => [field, ""])) as CookbookProfile;
const maxFieldLength = 4_000;

export function normalizeCookbook(input: unknown): CookbookProfile {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Provide a Cookbook profile object.");
  const value = input as Record<string, unknown>;
  if (Object.keys(value).some(key => !profileFields.includes(key as (typeof profileFields)[number]))) throw new Error("The Cookbook contains unsupported fields.");
  return Object.fromEntries(profileFields.map(field => {
    const raw = value[field]; if (raw !== undefined && typeof raw !== "string") throw new Error(`${field} must be text.`);
    const normalized = (raw || "").replace(/\r\n?/g, "\n").trim(); if (normalized.length > maxFieldLength) throw new Error(`${field} is too long.`);
    return [field, normalized];
  })) as CookbookProfile;
}
export function hasCookbookContent(profile: CookbookProfile) { return profileFields.some(field => Boolean(profile[field])); }
