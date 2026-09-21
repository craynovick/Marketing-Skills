import { claimBrandResearch, researchOfficial, researchMarket, finishBrandResearch, failBrandResearch } from './brand-research-steps';

export async function brandResearchWorkflow(id: string, key: string) {
  'use workflow';
  try {
    const pack = await claimBrandResearch(id, key);
    if (!pack) return;
    const official = await researchOfficial(pack, key);
    const research = await researchMarket(id, key, official);
    await finishBrandResearch(pack, key, research);
  } catch {
    await failBrandResearch(id, key);
  }
}
