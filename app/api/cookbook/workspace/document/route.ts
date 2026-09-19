import { createClient } from "@/lib/supabase/server";
import { type DocumentMetadata, workspaceError } from "@/lib/cookbook-workspace";

const documentColumns = "id,skill_id,content,version,source,created_at,status,quality,unanswered_questions,assumptions,evidence_references,research_metadata,validation_checklist";

export async function GET(request: Request) {
  const skillId = new URL(request.url).searchParams.get("skillId");
  if (!skillId) return workspaceError("INVALID_SKILL", "A skill is required.", 400);
  try {
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return workspaceError("AUTH_REQUIRED", "Sign in to view version history.", 401);
    const { data, error } = await supabase.from("cookbook_documents").select(documentColumns).eq("skill_id", skillId).eq("user_id", user.id).order("version", { ascending: false }).limit(30);
    if (error) throw error; return Response.json({ versions: data || [] });
  } catch (error) { return workspaceError("DOCUMENT_READ_FAILED", error instanceof Error ? error.message : "Could not load version history.", 400, true); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { skillId?: string; content?: string; expectedVersion?: number; source?: "user" | "agent" | "revert"; agentVersion?: string; metadata?: DocumentMetadata };
    if (!body.skillId || typeof body.content !== "string" || body.content.length > 60_000) return workspaceError("INVALID_DOCUMENT", "A valid document update is required.", 400);
    const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) return workspaceError("AUTH_REQUIRED", "Sign in to save a draft.", 401);
    const { data: skill } = await supabase.from("cookbook_skills").select("id,lifecycle").eq("id", body.skillId).eq("user_id", user.id).maybeSingle();
    if (!skill) return workspaceError("INVALID_SKILL", "Skill not found.", 404);
    const { data: current } = await supabase.from("cookbook_documents").select("version").eq("skill_id", skill.id).eq("user_id", user.id).order("version", { ascending: false }).limit(1).maybeSingle();
    if (body.expectedVersion !== undefined && current && body.expectedVersion !== current.version) return workspaceError("STALE_VERSION", "This draft changed in another session. Reload before saving.", 409, true);
    const version = (current?.version || 0) + 1;
    const metadata = body.metadata || {};
    const { data: document, error } = await supabase.from("cookbook_documents").insert({ user_id: user.id, skill_id: skill.id, content: body.content.replace(/\r\n?/g, "\n"), version, source: body.source || "user", agent_version: body.agentVersion || null, status: metadata.status || "draft", quality: metadata.quality || {}, unanswered_questions: metadata.unansweredQuestions || [], assumptions: metadata.assumptions || [], evidence_references: metadata.evidenceReferences || [], research_metadata: metadata.researchMetadata || {}, validation_checklist: metadata.validationChecklist || [] }).select(documentColumns).single();
    if (error) throw error;
    await supabase.from("cookbook_skills").update({ lifecycle: "draft", updated_at: new Date().toISOString() }).eq("id", skill.id).eq("user_id", user.id);
    return Response.json({ document });
  } catch (error) { return workspaceError("DOCUMENT_SAVE_FAILED", error instanceof Error ? error.message : "Could not save document.", 400, true); }
}
