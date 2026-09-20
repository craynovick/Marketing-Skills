/** A persisted chat uses the existing task/thread/artifact infrastructure. */
export const marketingChat = {
  slug: "marketing-chat",
  version: "1.0.0",
  name: "Marketing chat",
  description: "Draft, revise, and explore marketing content using your brand context.",
  upstream: [] as string[],
};

/** A fast, deterministic title while the agent works on the actual request. */
export function conciseTaskTitle(input: unknown) {
  if (typeof input !== "string") return "New chat";
  const words = input
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[^\p{L}\p{N}'’-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);
  if (!words.length) return "New chat";
  const title = words.join(" ").slice(0, 60).trim();
  return title.charAt(0).toUpperCase() + title.slice(1);
}

/** Content from another chat must never become reusable brand context. */
export function isRelevantFoundation(
  skill: { slug: string; upstream: readonly string[] },
  foundationSlug: string | null,
) {
  if (skill.slug === marketingChat.slug)
    return foundationSlug !== marketingChat.slug;
  return foundationSlug === skill.slug ||
    (foundationSlug !== null && skill.upstream.includes(foundationSlug));
}
