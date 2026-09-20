import type { account } from './cookbook-server';
export async function taskContext(db: Awaited<ReturnType<typeof account>>['db'], userId: string, task: { project_id: string; context_scope?: string; source_document_id?: string | null; source_task_id?: string | null; platform?: string | null; voice_direction?: string }) {
  const [brand, source] = await Promise.all([
    task.context_scope === 'task' ? Promise.resolve({ data: null, error: null }) : db.from('cookbook_projects').select('name,offer,website').eq('id', task.project_id).eq('user_id', userId).single(),
    task.source_document_id ? db.from('cookbook_documents').select('content,version,skill_id').eq('id', task.source_document_id).eq('skill_id', task.source_task_id!).eq('user_id', userId).single() : Promise.resolve({ data: null, error: null }),
  ]);
  if (brand.error || source.error) throw brand.error || source.error;
  return { userProvidedBrandIdentity: brand.data, adaptation: source.data ? { source: source.data.content, sourceVersion: source.data.version, platform: task.platform, voiceDirection: task.voice_direction || 'Use approved brand voice' } : null };
}
