import { createAdminClient } from '@/lib/supabase/admin';
import { collectOfficialEvidence, collectMarketEvidence, synthesizeBrand } from '@/lib/brand-research';
import { packColumns, type BrandPack } from '@/lib/brand-pack';

export async function claimBrandResearch(id: string, key: string) {
  'use step';
  const { data, error } = await createAdminClient().from('cookbook_brand_packs')
    .update({ status: 'researching', stage: 'Reading your website' }).eq('id', id).eq('research_key', key).eq('status', 'queued').select(packColumns).maybeSingle();
  if (error) throw error;
  return data as BrandPack | null;
}
export async function researchOfficial(pack: BrandPack, key: string) {
  'use step';
  const result = await collectOfficialEvidence(pack.website);
  await checkpoint(pack.id, key, { evidence: result.evidence, coverage: result.coverage, stage: 'Researching alternatives and buying needs' });
  return result;
}
export async function researchMarket(id: string, key: string, official: Awaited<ReturnType<typeof collectOfficialEvidence>>) {
  'use step';
  await active(id, key);
  let result = official;
  try {
    const market = await collectMarketEvidence(official.evidence);
    result = { evidence: [...official.evidence, ...market], coverage: `${official.coverage} ${market.length} public search excerpts collected; excerpts need verification before consequential claims.` };
  } catch {
    result = { ...official, coverage: `${official.coverage} Independent market search was unavailable. Competitor and demand hypotheses need further research.` };
  }
  await checkpoint(id, key, { ...result, stage: 'Writing and checking your brand brief' });
  return result;
}
export async function finishBrandResearch(pack: BrandPack, key: string, research: Awaited<ReturnType<typeof researchMarket>>) {
  'use step';
  await active(pack.id, key);
  const content = await synthesizeBrand(pack.brief, pack.content, research.evidence, research.coverage);
  const { error } = await createAdminClient().from('cookbook_brand_packs').update({ content, ...research, status: 'ready', stage: '', error: null, revision: pack.revision + 1, updated_at: new Date().toISOString() })
    .eq('id', pack.id).eq('research_key', key).eq('status', 'researching');
  if (error) throw error;
}
export async function failBrandResearch(id: string, key: string) {
  'use step';
  const { error } = await createAdminClient().from('cookbook_brand_packs').update({ status: 'failed', stage: '', error: 'Research did not finish. Your brief and any collected sources are preserved. Retry, edit the draft, or continue in your AI app.', updated_at: new Date().toISOString() })
    .eq('id', id).eq('research_key', key).in('status', ['queued', 'researching']);
  if (error) throw error;
}
async function active(id: string, key: string) {
  const { data, error } = await createAdminClient().from('cookbook_brand_packs').select('id').eq('id', id).eq('research_key', key).eq('status', 'researching').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('RUN_STOPPED');
}
async function checkpoint(id: string, key: string, update: Record<string, unknown>) {
  await active(id, key);
  const { error } = await createAdminClient().from('cookbook_brand_packs').update({ ...update, updated_at: new Date().toISOString() }).eq('id', id).eq('research_key', key).eq('status', 'researching');
  if (error) throw error;
}
// Provider/network failures are surfaced as resumable failed work, not multiplied by automatic model retries.
researchOfficial.maxRetries = 0;
researchMarket.maxRetries = 0;
finishBrandResearch.maxRetries = 0;
