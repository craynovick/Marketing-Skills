import { bearer, integrationService, recipe, recipeList, requireIntegration } from '@/lib/integrations/service';
import { errorResponse, readBody } from '@/lib/integrations/errors';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function handle(request: Request, context: {params: Promise<{path:string[]}>}) {
  try {
    requireIntegration();
    const {path} = await context.params; const url = new URL(request.url);
    let data: unknown;
    if (request.method === 'GET' && path[0] === 'skills' && path.length <= 2) {
      data = path[1] ? recipe(path[1], url.searchParams.get('mode') || undefined) : {items:recipeList()};
      return Response.json(data, {headers:{'Cache-Control':'public, max-age=60'}});
    }
    const api = integrationService(bearer(request));
    if (path.length === 1 && path[0] === 'connection' && request.method === 'GET') data = await api.connection();
    else if (path.length === 1 && path[0] === 'pantry' && request.method === 'GET') data = await api.pantry();
    else if (path.length === 1 && path[0] === 'pantry' && request.method === 'PATCH') data = await api.propose(await readBody(request));
    else if (path.length === 1 && path[0] === 'artifacts' && request.method === 'POST') data = await api.save(await readBody(request));
    else if (path.length === 1 && path[0] === 'artifacts' && request.method === 'GET') data = await api.list(Object.fromEntries(url.searchParams));
    else if (path.length === 2 && path[0] === 'artifacts' && request.method === 'GET') data = await api.get(path[1]);
    else throw new Error('NOT_FOUND');
    return Response.json(data, {status:request.method === 'POST' ? 201 : 200, headers:{'Cache-Control':'no-store'}});
  } catch (error) {return errorResponse(error);}
}
export {handle as GET, handle as POST, handle as PATCH};
