import { createClient } from "@/lib/supabase/server";
import { skills } from "@/lib/generated-skills";

export const model = process.env.COOKBOOK_MODEL || "openai/gpt-5.6-sol";
export const documentColumns =
  "id,skill_id,content,version,source,created_at,status,assumptions,unanswered_questions,evidence_references";
export const uuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export async function account() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("AUTH_REQUIRED");
  return { db, user };
}
export function apiError(error: unknown) {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Request failed";
  const codes: Record<string, [number, string]> = {
    AUTH_REQUIRED: [401, "Sign in to continue with your Cookbook."],
    STALE_VERSION: [
      409,
      "This draft changed. Compare your edits with the latest version before saving.",
    ],
    INVALID_TASK: [404, "This task is not available."],
    RUN_ACTIVE: [
      409,
      "This task is still working. Stop it before starting another request.",
    ],
    DUPLICATE_RUN: [
      409,
      "This request was already received. Reload the conversation to see its result.",
    ],
    RUN_STOPPED: [409, "Generation stopped. Saved work is still available."],
    RATE_LIMITED: [
      429,
      "You have reached the hourly limit. Please try again later.",
    ],
  };
  const code = Object.keys(codes).find((code) => raw.includes(code));
  if (code)
    return Response.json(
      { code, error: codes[code][1] },
      { status: codes[code][0] },
    );
  console.error("Cookbook request failed", { code: "REQUEST_FAILED" });
  return Response.json(
    {
      code: "REQUEST_FAILED",
      error: "Could not complete this request. Please retry.",
    },
    { status: 500 },
  );
}
export function resolveSkill(task: {
  skill_slug?: string | null;
  title: string;
  file_name: string;
}) {
  // Only migrate exact known identities. Legacy ambiguous tasks require a user choice.
  return (
    skills.find((skill) => skill.slug === task.skill_slug) ||
    skills.find(
      (skill) =>
        skill.name === task.title ||
        task.file_name.startsWith(`${skill.slug}-`),
    )
  );
}
