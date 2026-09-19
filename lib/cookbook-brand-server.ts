import { account } from "./cookbook-server";
import type { BrandProposal } from "./cookbook-foundations";
import type { Draft, Task } from "@/components/cookbook/types";
export type Foundation = Task & { foundation_key: string; confirmed?: Draft | null };
export type BrandState = { projectId: string | null; foundations: Foundation[]; proposals: BrandProposal[]; legacy: Task[] };
export async function readBrand(db: Awaited<ReturnType<typeof account>>["db"], userId: string, taskId?: string): Promise<BrandState> {
  const { data: project, error } = await db.from("cookbook_projects").select("id").eq("user_id", userId).order("created_at").limit(1).maybeSingle();
  if (error) throw error;
  if (!project) return { projectId: null, foundations: [], proposals: [], legacy: [] };
  const [docs, proposals, legacy] = await Promise.all([
    db.rpc("cookbook_read_foundations", { p_project: project.id }),
    taskId ? db.from("cookbook_brand_proposals").select("*").eq("user_id", userId).eq("task_id", taskId).order("created_at", { ascending: false }).limit(30) :
      db.from("cookbook_brand_proposals").select("*").eq("user_id", userId).eq("project_id", project.id).eq("status", "pending").order("created_at", { ascending: false }).limit(30),
    db.from("cookbook_skills").select("id,title,accepted_version_id").eq("user_id", userId).eq("project_id", project.id).is("foundation_key", null).neq("skill_slug", "marketing-chat").not("accepted_version_id", "is", null).limit(30),
  ]);
  for (const result of [docs, proposals, legacy]) if (result.error) throw result.error;
  return { projectId: project.id, foundations: docs.data || [], proposals: proposals.data || [], legacy: legacy.data as Task[] || [] };
}
