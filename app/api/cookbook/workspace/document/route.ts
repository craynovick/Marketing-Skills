import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const skillId = new URL(request.url).searchParams.get("skillId");
  if (!skillId) return Response.json({ error: "A skill is required." }, { status: 400 });
  try {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to view version history." }, { status: 401 });
    const { data, error } = await supabase.from("cookbook_documents").select("id,version,source,created_at,content").eq("skill_id", skillId).eq("user_id", user.id).order("version", { ascending: false }).limit(30);
    if (error) throw error; return Response.json({ versions: data || [] });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not load version history." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { skillId?: string; content?: string; expectedVersion?: number; source?: "user" | "agent" | "revert"; agentVersion?: string };
    if (!body.skillId || typeof body.content !== "string" || body.content.length > 60_000) return Response.json({ error: "A valid document update is required." }, { status: 400 });
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to save a draft." }, { status: 401 });
    const { data: skill } = await supabase.from("cookbook_skills").select("id,lifecycle").eq("id", body.skillId).eq("user_id", user.id).maybeSingle();
    if (!skill) return Response.json({ error: "Skill not found." }, { status: 404 });
    const { data: current } = await supabase.from("cookbook_documents").select("version").eq("skill_id", skill.id).eq("user_id", user.id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (body.expectedVersion !== undefined && current && body.expectedVersion !== current.version) return Response.json({ error: "This draft changed in another session. Reload before saving.", stale: true }, { status: 409 });
    const version = (current?.version || 0) + 1;
    const { data: document, error } = await supabase.from("cookbook_documents").insert({ user_id: user.id, skill_id: skill.id, content: body.content.replace(/\r\n?/g, "\n"), version, source: body.source || "user", agent_version: body.agentVersion || null }).select("id,skill_id,content,version,source,created_at").single();
    if (error) throw error;
    await supabase.from("cookbook_skills").update({ lifecycle: "draft", updated_at: new Date().toISOString() }).eq("id", skill.id).eq("user_id", user.id);
    return Response.json({ document });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not save document." }, { status: 400 }); }
}
