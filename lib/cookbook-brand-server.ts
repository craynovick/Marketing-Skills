import { resolveProject } from './cookbook-projects';
import { account } from './cookbook-server';
import type { BrandProposal } from './cookbook-foundations';
import { quickStart } from './cookbook-experience';
import type { Draft, Task } from '@/components/cookbook/types';
export type Foundation = Task & { foundation_key: string; confirmed?: Draft | null; reviewSuggested?: boolean };
export type BrandState = { projectId: string | null; brandName: string; intakeReady: boolean; foundations: Foundation[]; proposals: BrandProposal[]; legacy: Task[]; quickStart: { slug: string; confirmed: boolean; taskId?: string; reviewSuggested?: boolean }[] };
function section(content: string, name: string) { return content.match(new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, 'mi'))?.[1]?.trim() || ''; }
export async function readBrand(db: Awaited<ReturnType<typeof account>>['db'], userId: string, taskId?: string, projectId?: string): Promise<BrandState> {
  const project = await resolveProject(db, userId, projectId, taskId);
  const empty = { projectId: null, brandName: '', intakeReady: false, foundations: [], proposals: [], legacy: [], quickStart: quickStart.map(s => ({ slug: s.slug, confirmed: false })) };
  if (!project) return empty;
  const [docs, proposals, legacy] = await Promise.all([
    db.rpc('cookbook_read_foundations', { p_project: project.id }),
    taskId ? db.from('cookbook_brand_proposals').select('*').eq('user_id', userId).eq('task_id', taskId).order('created_at', { ascending: false }).limit(30) : db.from('cookbook_brand_proposals').select('*').eq('user_id', userId).eq('project_id', project.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(30),
    db.from('cookbook_skills').select('*').eq('user_id', userId).eq('project_id', project.id).is('foundation_key', null).eq('mode', 'skill-tuning').eq('context_scope', 'brand').neq('skill_slug', 'marketing-chat').is('archived_at', null).order('updated_at', { ascending: false }).limit(200),
  ]);
  for (const result of [docs, proposals, legacy]) if (result.error) throw result.error;
  const foundations: Foundation[] = docs.data || [];
  const acceptedIds = new Map([...foundations, ...(legacy.data || [])].map(f => [f.id, f.accepted_version_id]));
  for (const foundation of foundations) foundation.reviewSuggested = !!foundation.confirmed?.context_versions?.some(ref => acceptedIds.get(ref.taskId) !== ref.documentId);
  const brandContent = foundations.find(f => f.foundation_key === 'brand')?.confirmed?.content || '';
  const brandName = section(brandContent, 'Company') || project.name || '';
  const offer = section(brandContent, 'Offer') || project.offer || '';
  return { projectId: project.id, brandName, intakeReady: !!(brandName && offer), foundations, proposals: proposals.data || [], legacy: legacy.data || [], quickStart: quickStart.map(s => {
    const foundation = foundations.find(f => f.foundation_key === s.key);
    const existing = legacy.data?.find(t => t.skill_slug === s.slug && t.accepted_version_id);
    const confirmed = !!existing || !!foundation?.confirmed && (s.key !== 'brand' || !!(section(brandContent, 'Positioning')));
    return { slug: s.slug, confirmed, taskId: existing?.id || legacy.data?.find(t => t.skill_slug === s.slug)?.id, reviewSuggested: foundation?.reviewSuggested };
  }) };
}
