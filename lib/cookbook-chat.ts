/** A persisted chat uses the existing task/thread/artifact infrastructure. */
export const marketingChat = {
  slug: "marketing-chat",
  version: "1.0.0",
  name: "Marketing chat",
  description: "Draft, revise, and explore marketing content using your brand context.",
  upstream: [] as string[],
};

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
