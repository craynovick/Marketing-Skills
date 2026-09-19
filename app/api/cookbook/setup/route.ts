import { account } from '@/lib/cookbook-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { baseUrl, requireIntegration, selfHosted } from '@/lib/integrations/service';
import { errorResponse } from '@/lib/integrations/errors';
async function handle(request: Request) {
  try {
    requireIntegration();
    if(request.method !== 'GET' && request.headers.get('origin') !== baseUrl()) throw new Error('FORBIDDEN');
    const {user}=await account();
    const {data,error}=await createAdminClient().rpc('cookbook_scan_control',{p_user:user.id,p_action:request.method==='POST'?'complete':'status',p_self_hosted:selfHosted()});
    if(error) throw error;
    return Response.json(data,{headers:{'Cache-Control':'no-store'}});
  }catch(error){return errorResponse(error);}
}
export {handle as GET,handle as POST};
