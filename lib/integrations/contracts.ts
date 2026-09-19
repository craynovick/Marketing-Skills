import { z } from 'zod';
import { sectionKeys, scopes } from '@/lib/integrations/constants';
export { sectionKeys, scopes } from '@/lib/integrations/constants';
export const modeSchema = z.enum(['setup', 'apply', 'tune', 'validate']);
export const updateSchema = z.object({
  key: z.enum(sectionKeys), content: z.string().trim().min(1).max(20000).refine(s => (s.match(/^#\s+.+$/gm) || []).length === 1, 'Use exactly one Markdown title.'),
  expectedVersion: z.number().int().min(0), sources: z.array(z.string().url().max(2000).regex(/^https?:\/\//i)).max(20),
}).strict();
export const proposalSchema = z.object({
  requestId: z.string().uuid(), updates: z.array(updateSchema).min(1).max(6).refine(a => new Set(a.map(i => i.key)).size === a.length, 'Each section must be unique.'),
  agentName: z.string().trim().min(1).max(80).optional(),
}).strict();
export const artifactSchema = z.object({
  requestId: z.string().uuid(), skillSlug: z.string().min(1).max(100), title: z.string().trim().min(1).max(100),
  contentMarkdown: z.string().trim().min(1).max(60000), agentName: z.string().trim().min(1).max(80).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}).refine(v => JSON.stringify(v).length <= 8000, 'Metadata must be at most 8,000 characters.'),
}).strict();
export const connectionSchema = z.object({name: z.string().trim().min(1).max(80), scopes: z.array(z.enum(scopes)).min(1).max(3).refine(a => new Set(a).size === a.length)}).strict();
export const listSchema = z.object({limit: z.coerce.number().int().min(1).max(100).default(20), cursor: z.string().max(300).optional()}).strict();
export type PantrySection = {key: typeof sectionKeys[number]; approvedContent: string | null; approvedVersion: number; latestVersion: number; pending: boolean};
export type Pantry = {projectId: string; sections: PantrySection[]};
export function brandMarkdown(pantry: Pantry, section = 'all') {
  return pantry.sections.filter(s => section === 'all' || s.key === section).map(s => s.approvedContent || `# ${s.key}\nNo approved context yet.`).join('\n\n---\n\n');
}
