import { account, apiError, uuid } from "@/lib/cookbook-server";
import { cookbookV2Enabled } from "@/lib/cookbook-features";
import type { SavedSkill } from "@/lib/saved-cookbook";

export async function GET(request: Request) {
  try {
    const { db, user } = await account();
    const cursor = new URL(request.url).searchParams.get("before");
    const [before, beforeId, extra] = cursor?.split("|") || [];
    if (cursor !== null && (!before || !/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/.test(before) || !Number.isFinite(Date.parse(before)) || !uuid(beforeId) || extra !== undefined)) {
      return Response.json({ error: "Invalid page cursor." }, { status: 400 });
    }
    // A limited embedded relation returns only the latest document for each task,
    // rather than fetching its entire version history or making per-row requests.
    let query = db.from("cookbook_skills").select(
      `id,title,file_name,updated_at,accepted_version_id${cookbookV2Enabled() ? ",foundation_key" : ""},documents:cookbook_documents!cookbook_documents_skill_id_fkey(id,content,version)`
    ).eq("user_id", user.id).is("archived_at", null)
      .or("skill_slug.is.null,skill_slug.neq.marketing-chat")
      .eq("documents.user_id", user.id)
      .order("updated_at", { ascending: false }).order("id", { ascending: false })
      .order("version", { referencedTable: "documents", ascending: false })
      .limit(1, { referencedTable: "documents" }).limit(31);
    if (before) query = query.or(`updated_at.lt.${before},and(updated_at.eq.${before},id.lt.${beforeId})`);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []) as unknown as (Omit<SavedSkill, "document"> & { documents: SavedSkill["document"][] })[];
    const skills = rows.slice(0, 30).map(({ documents, ...skill }) => ({ ...skill, document: documents[0] ?? null }));
    const last = skills.at(-1);
    return Response.json({ skills, nextCursor: rows.length > 30 && last ? `${last.updated_at}|${last.id}` : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
