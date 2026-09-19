import { createMcpHandler } from 'mcp-handler';
import { registerCookbook } from '@/packages/cookbook-mcp/src/register';
import { baseUrl, bearer, integrationService, recipe, recipeList, requireIntegration } from '@/lib/integrations/service';
import { errorResponse, failure, readBody } from '@/lib/integrations/errors';
export const runtime='nodejs';
export const maxDuration=60;
export const dynamic='force-dynamic';
async function handle(request:Request) {
  try {
    requireIntegration();
    const origin=request.headers.get('origin');
    if(origin && origin!==baseUrl())throw new Error('FORBIDDEN');
    const api=integrationService(bearer(request));
    await api.connection();
    // Keep identity in this request's closure; never cache an authenticated server globally.
    const safe = <T,>(fn:()=>Promise<T>) => fn().catch(error=>{const e=failure(error);throw new Error(`${e.code}: ${e.error}`);});
    const handler=createMcpHandler(server=>registerCookbook(server,{
      recipes:async()=>({items:recipeList()}),recipe:async(slug,mode)=>recipe(slug,mode),
      pantry:()=>safe(()=>api.pantry()),propose:v=>safe(()=>api.propose(v)),save:v=>safe(()=>api.save(v)),list:v=>safe(()=>api.list(v)),get:id=>safe(()=>api.get(id)),
    }),{serverInfo:{name:'cookbook',version:'0.1.0'},maxSubscriptions:0,verboseLogs:false});
    let bounded=request;
    if(request.method==='POST')bounded=new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(await readBody(request))});
    const response=await handler(bounded);
    response.headers.set('Cache-Control','no-store');
    return response;
  }catch(error){return errorResponse(error);}
}
export {handle as GET,handle as POST,handle as DELETE};
