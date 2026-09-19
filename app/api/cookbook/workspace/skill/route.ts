import { createClient } from "@/lib/supabase/server";
import { skills } from "@/lib/generated-skills";

function fileName(slug: string) { return `${slug}-${crypto.randomUUID().slice(0, 8)}.md`; }

export async function POST(request: Request) {
  try {
    const { slug } = await request.json() as { slug?: string };
    const publishedSkill = skills.find(skill => skill.slug === slug);
    if (!publishedSkill) return Response.json({ error: "Choose a published skill." }, { status: 400 });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to create a task." }, { status: 401 });
    const { data: project, error: projectError } = await supabase.from("cookbook_projects").select("id").eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
    if (projectError || !project) return Response.json({ error: "Open your workspace before creating a task." }, { status: 409 });
    const { data: skill, error: skillError } = await supabase.from("cookbook_skills").insert({ user_id: user.id, project_id: project.id, file_name: fileName(publishedSkill.slug), title: publishedSkill.name }).select("id,file_name,title,lifecycle,accepted_version_id,updated_at").single();
    if (skillError || !skill) throw skillError || new Error("Could not create task.");
    const { data: document, error: documentError } = await supabase.from("cookbook_documents").insert({ user_id: user.id, skill_id: skill.id, content: `# ${publishedSkill.name}\n\n` }).select("id,content,version,source,created_at").single();
    if (documentError) throw documentError;
    const { error: threadError } = await supabase.from("cookbook_threads").insert({ user_id: user.id, skill_id: skill.id });
    if (threadError) throw threadError;
    return Response.json({ skill: { ...skill, document }, publishedSkill: { slug: publishedSkill.slug, name: publishedSkill.name, description: publishedSkill.description } }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not create task." }, { status: 400 }); }
}
