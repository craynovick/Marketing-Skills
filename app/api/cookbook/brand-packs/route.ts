import { z } from 'zod';
import { packAccount } from '@/lib/brand-pack-server';
import { packColumns, provisionalBrand, websiteFromBrief } from '@/lib/brand-pack';
import { readBody, errorResponse } from '@/lib/integrations/errors';
import { readBrand } from '@/lib/cookbook-brand-server';
import { resolveProject } from '@/lib/cookbook-projects';

export async function GET() {
  try {
    const { db, user } = await packAccount();
    const { data, error } = await db.from('cookbook_brand_packs').select('id,brief,status,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(30);
    if (error) throw error;
    return Response.json({ packs: data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    const { db, user } = await packAccount();
    const input = z.object({ id: z.string().uuid(), brief: z.string().trim().min(1).max(8000), website: z.string().max(2000).default(''), projectId: z.string().uuid().optional() }).strict().parse(await readBody(request));
    const website = input.website.trim() || websiteFromBrief(input.brief);
    if (website) {
      const parsed = z.string().url().safeParse(website);
      if (!parsed.success) throw new Error('INVALID_REQUEST');
      const url = new URL(parsed.data);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('INVALID_REQUEST');
    }
    let content = provisionalBrand(input.brief);
    let coverage = 'User-supplied brief; public research has not run.';
    if (input.projectId) {
      const project = await resolveProject(db, user.id, input.projectId);
      const brand = await readBrand(db, user.id, undefined, input.projectId);
      content = `# ${project!.name}\n\nImported from your saved Cookbook. A local export will not sync automatically.\n\n${brand.foundations.filter(f => f.confirmed?.content).map(f => f.confirmed!.content.replace(/^# /gm, '## ')).join('\n\n')}\n\n## Additional context\n\n${input.brief}\n`;
      coverage = 'Imported confirmed foundations only. Existing drafts and hosted approvals were not changed. Original source references remain in the imported content.';
    }
    const { data, error } = await db.rpc('cookbook_pack_command', { p_action: 'create', p_id: input.id, p_revision: 0, p_payload: { brief: input.brief, website, content, coverage, projectId: input.projectId } }).single();
    if (error) throw error;
    // The RPC returns only the owner's pack; never return a credential or connection key.
    return Response.json({ pack: Object.fromEntries(packColumns.split(',').map(key => [key, data[key]])) }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}
