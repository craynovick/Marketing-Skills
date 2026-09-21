import { z } from 'zod';
import { packAccount, ownedPack } from '@/lib/brand-pack-server';
import { readBody, errorResponse } from '@/lib/integrations/errors';

type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const id = z.string().uuid().parse((await context.params).id);
    const { db, user } = await packAccount();
    return Response.json({ pack: await ownedPack(db, user.id, id) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const id = z.string().uuid().parse((await context.params).id);
    const { db, user } = await packAccount();
    const input = z.discriminatedUnion('action', [
      z.object({ action: z.literal('save'), revision: z.number().int().positive(), content: z.string().trim().min(1).max(50000), reviewed: z.boolean() }).strict(),
      z.object({ action: z.literal('cancel'), revision: z.number().int().positive() }).strict(),
    ]).parse(await readBody(request));
    const { error } = await db.rpc('cookbook_pack_command', { p_action: input.action, p_id: id, p_revision: input.revision, p_payload: input });
    if (error) throw error;
    return Response.json({ pack: await ownedPack(db, user.id, id) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
