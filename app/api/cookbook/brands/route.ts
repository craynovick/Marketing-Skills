import { cookbookBrandsEnabled } from "@/lib/cookbook-features";
import { account, apiError, uuid } from '@/lib/cookbook-server';
export async function GET(request: Request) {
  try {
    const { db, user } = await account();
    const { data, error } = await db.from('cookbook_projects').select('id,name,offer,website').eq('user_id', user.id).order('created_at');
    if (error) throw error;
    const taskId = new URL(request.url).searchParams.get('taskId');
    let taskProjectId: string | undefined;
    if (taskId) {
      if (!uuid(taskId)) throw new Error('INVALID_TASK');
      const task = await db.from('cookbook_skills').select('project_id').eq('id', taskId).eq('user_id', user.id).single();
      if (task.error || !task.data) throw new Error('INVALID_TASK');
      taskProjectId = task.data.project_id;
    }
    return Response.json({ brands: data, taskProjectId, enabled: cookbookBrandsEnabled() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    if (!cookbookBrandsEnabled()) return Response.json({error:"This feature is not enabled yet."}, {status:503});
    const { db } = await account();
    const { name, offer, website = '', requestId } = await request.json();
    if (typeof name !== 'string' || !name.trim() || name.length > 120 || typeof offer !== 'string' || !offer.trim() || offer.length > 2000 || typeof website !== 'string' || website.length > 2000 || !uuid(requestId)) throw new Error('INVALID_BRAND');
    if (website && !/^https?:\/\//i.test(website)) throw new Error('INVALID_BRAND');
    const { data: id, error } = await db.rpc('cookbook_create_brand', { p_name: name, p_offer: offer, p_website: website, p_key: requestId });
    if (error) throw error;
    return Response.json({ brand: { id, name: name.trim(), offer: offer.trim(), website } }, { status: 201 });
  } catch (error) { return apiError(error); }
}
