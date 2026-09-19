import { account, apiError, documentColumns } from "@/lib/cookbook-server";
export async function GET() {
  try {
    const { db, user } = await account();
    const { data: skills, error } = await db
      .from("cookbook_skills")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const result = await Promise.all(
      (skills || []).map(async (skill) => {
        const { data: document, error } = await db
          .from("cookbook_documents")
          .select(documentColumns)
          .eq("skill_id", skill.id)
          .eq("user_id", user.id)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        return { ...skill, document };
      }),
    );
    return Response.json({ skills: result });
  } catch (error) {
    return apiError(error);
  }
}
