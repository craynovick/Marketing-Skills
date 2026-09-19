import { paidAccess } from "@/lib/cookbook-access";
import { account, apiError, documentColumns, uuid } from "@/lib/cookbook-server";
import { cookbookV2Enabled } from "@/lib/cookbook-features";
export async function GET(request: Request) {
  try {
    const { db, user } = await account();
    const hostedWorkflows = await paidAccess(user.id);
    if (cookbookV2Enabled()) {
      const params = new URL(request.url).searchParams;
      const [before, beforeId] = (params.get("before") || "").split("|");
      if (before && (!Number.isFinite(Date.parse(before)) || !uuid(beforeId))) return Response.json({error:"Invalid page cursor."},{status:400});
      const {data,error} = await db.rpc("cookbook_list_tasks",{p_before:before || null,p_before_id:beforeId || null,p_limit:30,p_archived:params.get("archived")==="true"});
      if(error) throw error;
      return Response.json({hostedWorkflows,skills:data,nextCursor:data?.length===30?`${data.at(-1).updated_at}|${data.at(-1).id}`:null});
    }
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
    return Response.json({ hostedWorkflows, skills: result });
  } catch (error) {
    return apiError(error);
  }
}
