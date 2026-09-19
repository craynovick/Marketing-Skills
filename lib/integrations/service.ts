import { createHash } from 'node:crypto';
import { z } from 'zod';
import { skills, getSkill } from '@/lib/generated-skills';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookbookV2Enabled } from '@/lib/cookbook-features';
import { artifactSchema, listSchema, modeSchema, proposalSchema, sectionKeys, type Pantry } from '@/lib/integrations/contracts';
export const integrationsEnabled = () => process.env.COOKBOOK_INTEGRATIONS_ENABLED === 'true' && cookbookV2Enabled();
export const selfHosted = () => process.env.COOKBOOK_DEPLOYMENT === 'self-hosted';
export function requireIntegration() {if (!integrationsEnabled()) throw new Error('DISABLED');}
export function keyHash(token: string) {return createHash('sha256').update(token).digest('hex');}
export function bearer(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (cb_[A-Za-z0-9_-]{43})$/)?.[1];
  if (!token) throw new Error('AUTH_REQUIRED');
  return token;
}
export const recipeList = () => skills.map(({slug,title,category,complexity,version,foundational}) => ({slug,title,category:category.toLowerCase(),complexity:complexity.toLowerCase(),version,foundational}));
export function recipe(slug: string, mode?: unknown) {
  const skill = getSkill(slug); if (!skill) throw new Error('NOT_FOUND');
  const selected = mode === undefined ? undefined : modeSchema.parse(mode);
  return {...recipeList().find(s => s.slug === slug), markdownContent: skill.skill, ...(selected ? {mode: selected, modeGuidance: `Use ${selected} mode. Preserve the full recipe's safety and evidence rules.`} : {})};
}
export function integrationService(token: string) {
  const hash = keyHash(token);
  async function rpc(action: string, payload: unknown = {}) {
    requireIntegration();
    const started = Date.now();
    const {data, error} = await createAdminClient().rpc('cookbook_integration', {p_hash: hash, p_action: action, p_payload: payload, p_self_hosted: selfHosted()});
    console.info('Cookbook integration', {action, requestId: typeof payload === 'object' && payload && 'requestId' in payload ? payload.requestId : undefined, elapsedMs: Date.now()-started, ok: !error});
    if (error) throw error;
    return data;
  }
  return {
    connection: () => rpc('connection'),
    async pantry(): Promise<Pantry> {
      const result = await rpc('pantry') as Pantry;
      return {...result, sections: sectionKeys.map(key => result.sections.find(s => s.key === key) || {key,approvedContent:null,approvedVersion:0,latestVersion:0,pending:false})};
    },
    async propose(value: unknown) {
      const result = await rpc('propose', proposalSchema.parse(value));
      return {...result, reviewUrl: `${baseUrl()}/create?view=cookbook`};
    },
    async save(value: unknown) {
      const input = artifactSchema.parse(value); const skill = getSkill(input.skillSlug);
      if (!skill) throw new Error('NOT_FOUND');
      const result = await rpc('save', {...input, skillVersion: skill.version});
      return {...result, url: `${baseUrl()}/create?task=${result.id}`};
    },
    async list(value: unknown) {
      const {limit, cursor} = listSchema.parse(value);
      let before: string | undefined, beforeId: string | undefined;
      if (cursor) {
        try {const parsed = z.object({before:z.string().datetime({offset:true}),beforeId:z.string().uuid()}).strict().parse(JSON.parse(Buffer.from(cursor,'base64url').toString())); before=parsed.before; beforeId=parsed.beforeId;} catch {throw new Error('INVALID_REQUEST');}
      }
      const rows = await rpc('list', {limit,before,beforeId});
      const items = rows.slice(0,limit); const last = items.at(-1);
      return {items, nextCursor: rows.length>limit && last ? Buffer.from(JSON.stringify({before:last.created_at,beforeId:last.id})).toString('base64url') : null};
    },
    get: (id: string) => rpc('get', {id:z.string().uuid().parse(id)}),
  };
}
export function baseUrl() {
  const url = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.cookbook.to');
  return url.origin;
}
