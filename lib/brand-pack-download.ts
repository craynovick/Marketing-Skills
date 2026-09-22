import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { skills } from '@/lib/generated-skills';
import { evidenceMarkdown, type BrandPack } from '@/lib/brand-pack';

export function skillPackageFiles(slug: string) {
  const skill = skills.find(s => s.slug === slug);
  if (!skill) throw new Error('NOT_FOUND');
  const files: Record<string, string> = { 'SKILL.md': skill.portable, LICENSE: readFileSync(join(process.cwd(), 'content/skills/LICENSE'), 'utf8') };
  const root = join(process.cwd(), 'content', 'skills', slug);
  function read(folder: string, prefix: string) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('Invalid skill resource.');
      const name = `${prefix}${entry.name}`;
      if (entry.isDirectory()) read(join(folder, entry.name), `${name}/`);
      else files[name] = readFileSync(join(folder, entry.name), 'utf8');
    }
  }
  for (const entry of readdirSync(root, { withFileTypes: true })) if (entry.isDirectory() && ['references', 'scripts', 'assets'].includes(entry.name)) read(join(root, entry.name), `${entry.name}/`);
  return files;
}
export function installerDownload(pack?: BrandPack) {
  const payload = {
    schemaVersion: 1,
    skills: skills.map(skill => ({ slug: skill.slug, version: skill.version, files: skillPackageFiles(skill.slug) })),
    brand: pack ? { id: pack.id, content: pack.content, evidence: evidenceMarkdown(pack), revision: pack.revision } : null,
  };
  const source = readFileSync(join(process.cwd(), 'packages/cookbook-installer/install.mjs'), 'utf8');
  // Encode JSON as data, not interpolated executable source or a shell command.
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${source}\ntry { install(JSON.parse(Buffer.from('${encoded}', 'base64').toString('utf8'))); } catch (error) { console.error(error.message); process.exitCode = 1; }\n`;
}
