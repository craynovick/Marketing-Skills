import { account, apiError, uuid } from '@/lib/cookbook-server';
import { answerText, type SavedDecision } from '@/lib/cookbook-experience';
import { ensureEntryDecision } from '@/lib/cookbook-decisions-server';
import { requireTaskAccess } from '@/lib/cookbook-access';
export async function POST(request: Request) {
  try {
    const { db, user } = await account();
    const { taskId, decisionId, answer, revision, requestId } = await request.json();
    if (!uuid(taskId) || !uuid(requestId) || typeof decisionId !== 'string' || !Number.isInteger(revision) || revision < 0) return Response.json({ error: 'Choose a valid question and answer.' }, { status: 400 });
    await requireTaskAccess(user.id, taskId);
    const { data: task, error: te } = await db.from('cookbook_skills').select('*').eq('id', taskId).eq('user_id', user.id).is('archived_at', null).single();
    if (te || !task) throw new Error('INVALID_TASK');
    if (decisionId === 'entry') await ensureEntryDecision(db, user.id, task);
    const { data, error } = await db.from('cookbook_decisions').select('*').eq('task_id', taskId).eq('user_id', user.id).eq('id', decisionId).single();
    if (error || !data) throw new Error('INVALID_DECISION');
    const text = answerText((data as SavedDecision).card, answer);
    const { data: decision, error: se } = await db.rpc('cookbook_answer_decision', { p_task: taskId, p_id: decisionId, p_answer: answer, p_revision: revision, p_request: requestId });
    if (se) throw se;
    return Response.json({ decision, prompt: `${revision ? 'Revised answer: review affected later work, preserving approved documents.\n' : ''}${data.card.prompt}\n${text}` });
  } catch (error) { return apiError(error); }
}
