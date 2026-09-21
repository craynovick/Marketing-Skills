import { z } from 'zod';
import { packAccount, ownedPack } from '@/lib/brand-pack-server';
import { packBusy, evidenceMarkdown } from '@/lib/brand-pack';
import { installerDownload } from '@/lib/brand-pack-download';
import { errorResponse } from '@/lib/integrations/errors';
export const runtime = 'nodejs';
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = z.string().uuid().parse((await context.params).id);
    const { db, user } = await packAccount();
    const pack = await ownedPack(db, user.id, id);
    if (packBusy(pack)) throw new Error('RUN_ACTIVE');
    const format = new URL(request.url).searchParams.get('format') || 'installer';
    if (!['installer', 'markdown', 'evidence'].includes(format)) throw new Error('INVALID_REQUEST');
    const body = format === 'installer' ? installerDownload(pack) : format === 'evidence' ? evidenceMarkdown(pack) : pack.content;
    const filename = format === 'installer' ? 'cookbook-install.mjs' : format === 'evidence' ? 'evidence.md' : 'brand.md';
    return new Response(body, { headers: { 'Content-Type': format === 'installer' ? 'text/javascript; charset=utf-8' : 'text/markdown; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) { return errorResponse(error); }
}
