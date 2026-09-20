import { cookbookBrandsEnabled } from "@/lib/cookbook-features";
import { account, apiError, uuid } from '@/lib/cookbook-server';
import { requireTaskAccess } from '@/lib/cookbook-access';
import { platforms } from '@/lib/cookbook-platforms';
export async function GET(request: Request) {
  try {
    const { db, user } = await account();
    const sourceId = new URL(request.url).searchParams.get('sourceId');
    if (!uuid(sourceId)) throw new Error('INVALID_TASK');
    const { data, error } = await db.from('cookbook_skills').select('*').eq('source_task_id', sourceId).eq('user_id', user.id).is('archived_at', null).order('created_at');
    if (error) throw error;
    return Response.json({ adaptations: data });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    if (!cookbookBrandsEnabled()) return Response.json({error:"This feature is not enabled yet."}, {status:503});
    const { db, user } = await account();
    const { sourceId, documentId, platform, voice = '', requestId } = await request.json();
    if (!uuid(sourceId) || !uuid(documentId) || !uuid(requestId) || !platforms.some(p => p.id === platform) || typeof voice !== 'string' || voice.length > 500) throw new Error('INVALID_TASK');
    await requireTaskAccess(user.id, sourceId);
    const { data: id, error } = await db.rpc('cookbook_create_adaptation', { p_source: sourceId, p_document: documentId, p_platform: platform, p_voice: voice, p_key: requestId });
    if (error) throw error;
    const { data: task, error: readError } = await db.from('cookbook_skills').select('*').eq('id', id).eq('user_id', user.id).single();
    if (readError) throw readError;
    return Response.json({ task }, { status: 201 });
  } catch (error) { return apiError(error); }
}
