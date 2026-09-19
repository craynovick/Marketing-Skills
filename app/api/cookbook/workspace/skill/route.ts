import { marketingChat } from "@/lib/cookbook-chat";
import { skills } from "@/lib/generated-skills";
import { account, apiError, uuid } from "@/lib/cookbook-server";
export async function POST(request: Request) {
  try {
    const { slug, requestId, title } = await request.json();
    const skill = slug === marketingChat.slug ? marketingChat : skills.find((item) => item.slug === slug);
    if (!skill || !uuid(requestId))
      return Response.json(
        { error: "Choose a published skill and a valid request ID." },
        { status: 400 },
      );
    const { db, user } = await account();
    const { data: id, error } = await db.rpc("cookbook_create_task", {
      p_slug: skill.slug,
      p_version: skill.version,
      p_title: skill.slug === marketingChat.slug && typeof title === "string"
        ? title.trim().slice(0, 80) || "New chat"
        : skill.name,
      p_key: requestId,
    });
    if (error) throw error;
    const { data: task, error: readError } = await db
      .from("cookbook_skills")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (readError) throw readError;
    return Response.json({ skill: task }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
