import { createClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  try {
    const { skillId, version } = await request.json() as { skillId?: string; version?: number };
    if (!skillId || !Number.isInteger(version)) return Response.json({ error: "A current draft version is required." }, { status: 400 });
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return Response.json({ error: "Sign in to accept a skill." }, { status: 401 });
    const { data: document } = await supabase.from("cookbook_documents").select("id,version").eq("skill_id", skillId).eq("user_id", user.id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (!document || document.version !== version) return Response.json({ error: "This draft is stale. Review the latest version before accepting." }, { status: 409 });
    const { error } = await supabase.from("cookbook_skills").update({ lifecycle: "accepted", accepted_version_id: document.id, updated_at: new Date().toISOString() }).eq("id", skillId).eq("user_id", user.id); if (error) throw error;
    await supabase.from("cookbook_acceptance_events").insert({ user_id: user.id, skill_id: skillId, document_id: document.id });
    return Response.json({ acceptedVersionId: document.id, version });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not accept draft." }, { status: 400 }); }
}
