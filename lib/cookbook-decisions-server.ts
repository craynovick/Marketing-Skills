import { type account } from './cookbook-server';
import { entryCard, modeOf, validateCard, type DecisionCardData, type SavedDecision, type CreateWorkflow } from './cookbook-experience';
import { readBrand } from './cookbook-brand-server';
type DB = Awaited<ReturnType<typeof account>>['db'];
export async function saveDecision(db: DB, userId: string, taskId: string, card: DecisionCardData) {
  validateCard(card);
  const { error } = await db.from('cookbook_decisions').upsert({ task_id: taskId, user_id: userId, id: card.id, card }, { onConflict: 'task_id,id', ignoreDuplicates: true });
  if (error) throw error;
  const { data, error: readError } = await db.from('cookbook_decisions').select('*').eq('task_id', taskId).eq('user_id', userId).eq('id', card.id).single();
  if (readError) throw readError;
  return data as SavedDecision;
}
export async function ensureEntryDecision(db: DB, userId: string, task: { id: string; mode?: string; create_workflow?: CreateWorkflow; skill_slug?: string | null; context_scope?: string }) {
  const brand = task.context_scope === 'task' ? null : await readBrand(db, userId);
  return saveDecision(db, userId, task.id, entryCard(modeOf(task), task.create_workflow || 'general', task.skill_slug, task.context_scope === 'task' || brand?.intakeReady));
}
