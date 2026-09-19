import { createClient } from "@/lib/supabase/server";

const starterSkills = [
  ["01_identity.md", "Brand identity"], ["02_audience.md", "Audience"], ["03_voice_tone.md", "Voice & tone"], ["04_pillars.md", "Content pillars"], ["05_guardrails.md", "Guardrails"],
];

async function userClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

async function ensureProject(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: existing, error } = await supabase.from("cookbook_projects").select("id, name").eq("user_id", userId).order("created_at").limit(1).maybeSingle();
  if (error) throw error;
  if (existing) return existing;
  const { data: project, error: projectError } = await supabase.from("cookbook_projects").insert({ user_id: userId }).select("id, name").single();
  if (projectError || !project) throw projectError || new Error("Could not create project.");
  const { data: skills, error: skillsError } = await supabase.from("cookbook_skills").insert(starterSkills.map(([file_name, title]) => ({ user_id: userId, project_id: project.id, file_name, title }))).select("id");
  if (skillsError || !skills) throw skillsError || new Error("Could not create skills.");
  const { error: docsError } = await supabase.from("cookbook_documents").insert(skills.map(skill => ({ user_id: userId, skill_id: skill.id, content: "" })));
  if (docsError) throw docsError;
  await supabase.from("cookbook_threads").insert(skills.map(skill => ({ user_id: userId, skill_id: skill.id })));
  return project;
}

export async function GET() {
  try {
    const { supabase, user } = await userClient();
    if (!user) return Response.json({ error: "Sign in to use your synced Cookbook workspace." }, { status: 401 });
    const project = await ensureProject(supabase, user.id);
    const { data: skills, error } = await supabase.from("cookbook_skills").select("id,file_name,title,lifecycle,accepted_version_id,updated_at").eq("project_id", project.id).eq("user_id", user.id).order("file_name");
    if (error) throw error;
    const ids = (skills || []).map(skill => skill.id);
    const { data: documents } = ids.length ? await supabase.from("cookbook_documents").select("id,skill_id,content,version,source,created_at").eq("user_id", user.id).in("skill_id", ids).order("version", { ascending: false }) : { data: [] };
    const { data: evidence } = ids.length ? await supabase.from("cookbook_research_runs").select("id,skill_id,canonical_url,status,page_count,failed_pages,confidence,created_at").eq("user_id", user.id).in("skill_id", ids).order("created_at", { ascending: false }) : { data: [] };
    return Response.json({ project, skills: (skills || []).map(skill => ({ ...skill, document: (documents || []).find(document => document.skill_id === skill.id), research: (evidence || []).find(run => run.skill_id === skill.id) })) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not load workspace." }, { status: 503 }); }
}
