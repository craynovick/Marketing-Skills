import { z } from 'zod';
import type { BrandPack } from '@/lib/brand-pack';
import { start } from 'workflow/api';
import { packAccount, ownedPack } from '@/lib/brand-pack-server';
import { assertSupabaseAdminConfiguration } from '@/lib/supabase/admin';
import { failBrandResearch } from '@/lib/workflows/brand-research-steps';
import { brandResearchWorkflow } from '@/lib/workflows/brand-research';
import { readBody, errorResponse } from '@/lib/integrations/errors';
export const runtime = 'nodejs';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await context.params).id);
    const input = z.object({ revision: z.number().int().positive(), requestId: z.string().uuid() }).strict().parse(await readBody(request));
    const { db, user } = await packAccount();
    assertSupabaseAdminConfiguration();
    const { data, error } = await db.rpc('cookbook_pack_command', { p_action: 'research', p_id: id, p_revision: input.revision, p_payload: input }).single<BrandPack>();
    if (error) throw error;
    if (data.status === 'queued' && data.research_key === input.requestId) {
      try { await start(brandResearchWorkflow, [id, input.requestId]); }
      catch (error) { await failBrandResearch(id, input.requestId); throw error; }
    }
    return Response.json({ pack: await ownedPack(db, user.id, id) }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
