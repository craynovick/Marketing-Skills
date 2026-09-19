import { createAdminClient } from '@/lib/supabase/admin';
import { skills } from '@/lib/generated-skills';
import { integrationsEnabled, selfHosted } from '@/lib/integrations/service';
// Enabled together with the migration; every entry point uses this same policy.
export const hostedLimitsEnabled = integrationsEnabled;
export async function paidAccess(userId: string) {
  if (!hostedLimitsEnabled()) return true;
  const {data,error} = await createAdminClient().rpc('cookbook_paid',{p_user:userId,p_self_hosted:selfHosted()});
  if (error) throw error; return Boolean(data);
}
export async function requireSkillAccess(userId: string, slug: string) {
  if (skills.some(s => s.slug === slug && s.foundational)) return;
  if (!await paidAccess(userId)) throw new Error('PLAN_REQUIRED');
}
export async function requireTaskAccess(userId: string, taskId: string) {
  if (!hostedLimitsEnabled()) return;
  const {data,error} = await createAdminClient().from('cookbook_skills').select('skill_slug,foundation_key').eq('id',taskId).eq('user_id',userId).single();
  if(error || !data) throw new Error('INVALID_TASK');
  if(data.foundation_key) return;
  await requireSkillAccess(userId,data.skill_slug);
}
