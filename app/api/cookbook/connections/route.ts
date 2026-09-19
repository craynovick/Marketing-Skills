import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { account } from '@/lib/cookbook-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { connectionSchema } from '@/lib/integrations/contracts';
import { baseUrl, keyHash, requireIntegration } from '@/lib/integrations/service';
import { errorResponse, readBody } from '@/lib/integrations/errors';
export const dynamic = 'force-dynamic';
async function handle(request: Request) {
  try {
    requireIntegration();
    if(request.method !== 'GET' && request.headers.get('origin') !== baseUrl()) throw new Error('FORBIDDEN');
    const {user} = await account();
    let p_action = 'list', p_data: unknown = {}, token: string | undefined;
    if(request.method === 'POST') {const input=connectionSchema.parse(await readBody(request)); token=`cb_${randomBytes(32).toString('base64url')}`; p_action='create'; p_data={...input,hash:keyHash(token)};}
    if(request.method === 'DELETE') {p_action='revoke'; p_data=z.object({id:z.string().uuid()}).strict().parse(await readBody(request));}
    const {data,error} = await createAdminClient().rpc('cookbook_manage_connection',{p_user:user.id,p_action,p_data});
    if(error) throw error;
    return Response.json({[p_action==='list'?'connections':'connection']:data,...(token?{key:token}:{})},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {return errorResponse(error);}
}
export {handle as GET,handle as POST,handle as DELETE};
