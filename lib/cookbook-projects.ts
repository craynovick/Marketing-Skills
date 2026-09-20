import { account, uuid } from './cookbook-server';
export type BrandProject = { id: string; name: string; offer: string; website: string };
export async function resolveProject(db: Awaited<ReturnType<typeof account>>['db'], userId: string, projectId?: string | null, taskId?: string) {
  if (taskId) {
    const { data, error } = await db.from('cookbook_skills').select('project_id').eq('id', taskId).eq('user_id', userId).single();
    if (error || !data) throw new Error('INVALID_TASK');
    projectId = data.project_id;
  }
  if (projectId && !uuid(projectId)) throw new Error('INVALID_BRAND');
  let query = db.from('cookbook_projects').select('id,name,offer,website').eq('user_id', userId);
  if (projectId) query = query.eq('id', projectId);
  const { data, error } = await query.order('created_at').limit(2);
  if (error) throw error;
  if (!projectId && (data?.length || 0) > 1) throw new Error('BRAND_REQUIRED');
  if (projectId && !data?.length) throw new Error('INVALID_BRAND');
  return (data?.[0] || null) as BrandProject | null;
}
