import { skills } from "@/lib/generated-skills";
import { account, apiError, uuid } from "@/lib/cookbook-server";
export async function PATCH(request: Request) {
  try {
    const { taskId, title, archived, pinned, slug } = await request.json();
    if (!uuid(taskId))
      return Response.json({ error: "A task is required." }, { status: 400 });
    const changes: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (
      typeof title === "string" &&
      title.trim().length > 0 &&
      title.trim().length <= 100
    )
      changes.title = title.trim();
    if (typeof archived === "boolean")
      changes.archived_at = archived ? new Date().toISOString() : null;
    if (typeof pinned === "boolean")
      changes.pinned_at = pinned ? new Date().toISOString() : null;
    const { db, user } = await account();
    if (slug) {
      const skill = skills.find((item) => item.slug === slug);
      const { data: task } = await db
        .from("cookbook_skills")
        .select("skill_slug")
        .eq("id", taskId)
        .eq("user_id", user.id)
        .single();
      if (!skill || task?.skill_slug)
        return Response.json(
          { error: "Only legacy tasks without a skill can be assigned one." },
          { status: 400 },
        );
      changes.skill_slug = skill.slug;
      changes.skill_version = skill.version;
    }
    const { data, error } = await db
      .from("cookbook_skills")
      .update(changes)
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ skill: data });
  } catch (error) {
    return apiError(error);
  }
}
