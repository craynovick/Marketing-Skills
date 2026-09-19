import { createClient } from "@/lib/supabase/server";
export async function POST(request: Request) {
  try {
    const { skillId, version } = await request.json() as { skillId?: string; version?: number }; if (!skillId || !Number.isInteger(version)) return Response.json({ error: "Choose a version to restore." }, { status: 400 });
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return Response.json({ error: "Sign in to restore a draft." }, { status: 401 });
    const { data: target } = await supabase.from("cookbook_documents").select("content").eq("skill_id", skillId).eq("user_id", user.id).eq("version", version).maybeSingle(); if (!target) return Response.json({ error: "Version not found." }, { status: 404 });
    const { data: latest } = await supabase.from("cookbook_documents").select("version").eq("skill_id", skillId).eq("user_id", user.id).order("version", { ascending: false }).limit(1).maybeSingle();
    const { data: document, error } = await supabase.from("cookbook_documents").insert({ user_id: user.id, skill_id: skillId, content: target.content, version: (latest?.version || 0) + 1, source: "revert" }).select("id,skill_id,content,version,source,created_at").single(); if (error) throw error;
    await supabase.from("cookbook_skills").update({ lifecycle: "draft" }).eq("id", skillId).eq("user_id", user.id); return Response.json({ document });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not restore version." }, { status: 400 }); }
}
