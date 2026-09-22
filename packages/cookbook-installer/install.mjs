// Cookbook's portable installer. No network calls, shell commands, or global agent changes.
// The download appends a JSON payload and calls install(). Inspect it before running.
import { mkdirSync, lstatSync, readFileSync, writeFileSync, renameSync, unlinkSync, rmdirSync, realpathSync, constants, openSync, closeSync } from 'node:fs';
import { resolve, relative, dirname, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export function install(payload, argv = process.argv.slice(2), directory = process.cwd()) {
  const allowed = new Set(['--agent', '--update', '--dry-run', '--remove', '--help']);
  let agent;
  for (let i = 0; i < argv.length; i++) {
    if (!allowed.has(argv[i])) throw new Error(`Unknown option: ${argv[i]}`);
    if (argv[i] === '--agent') agent = argv[++i];
  }
  if (argv.includes('--help')) { console.log('node cookbook-install.mjs --agent codex|claude-code [--dry-run] [--update | --remove]\nRun from your project folder. Private brand context and local edits are never overwritten.'); return; }
  if (!['codex', 'claude-code'].includes(agent)) throw new Error('Choose --agent codex or --agent claude-code. Run this command from your project folder.');
  if (argv.includes('--update') && argv.includes('--remove')) throw new Error('Choose update or remove, not both.');
  if (payload.schemaVersion !== 1 || !Array.isArray(payload.skills) || !payload.skills.length || payload.skills.length > 100) throw new Error('Unsupported or empty Cookbook package.');
  const root = realpathSync(directory);
  const hash = value => createHash('sha256').update(value).digest('hex');
  const exists = file => { try { return lstatSync(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } };
  function safePath(name) {
    if (typeof name !== 'string' || !name || name.includes('\\') || name.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Unsafe package path.');
    const file = resolve(root, name);
    if (relative(root, file).startsWith('..') || !file.startsWith(root + sep)) throw new Error('Package path escapes the project.');
    let cursor = root;
    const parts = relative(root, file).split(sep);
    for (const [i, part] of parts.entries()) {
      cursor = resolve(cursor, part); const state = exists(cursor);
      if (state?.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${name}`);
      if (state && i < parts.length - 1 && !state.isDirectory()) throw new Error(`Not a directory: ${cursor}`);
      if (state && i === parts.length - 1 && !state.isFile()) throw new Error(`Not a regular file: ${name}`);
    }
    return file;
  }
  const manifestPath = safePath('.cookbook/manifest.json');
  const previous = exists(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { schemaVersion: 1, files: {}, brandId: null };
  if (previous.schemaVersion !== 1 || !previous.files || typeof previous.files !== 'object') throw new Error('Unrecognized local manifest. Keep a backup and review it before installing.');
  if (payload.brand && previous.brandId && payload.brand.id !== previous.brandId) throw new Error('This project already belongs to another brand. Use a separate project folder.');
  if (payload.brand && !previous.brandId) {
    const contextFile = safePath('.cookbook/brand.md');
    if (exists(contextFile) && readFileSync(contextFile, 'utf8') !== payload.brand.content) throw new Error('An existing brand brief is not linked to this pack. Review it manually or use a separate project folder.');
  }
  const prefix = agent === 'codex' ? '.agents/skills' : '.claude/skills';
  const changes = [];
  const managed = { ...previous.files };
  const seen = new Set();
  let total = 0;
  function add(name, content, privateFile = false) {
    if (typeof content !== 'string' || content.length > 250000) throw new Error('Invalid package file.');
    total += Buffer.byteLength(content); if (total > 5000000 || seen.size > 1000) throw new Error('Package exceeds size limits.');
    if (seen.has(name)) throw new Error('Duplicate package path.'); seen.add(name);
    const file = safePath(name);
    const before = exists(file) ? readFileSync(file, 'utf8') : null;
    if (privateFile && before !== null) return; // Local context always wins, including manual edits.
    if (before === content) { if (!privateFile) managed[name] = hash(content); return; }
    if (before !== null && (!argv.includes('--update') || managed[name] !== hash(before))) throw new Error(`Keep your existing ${name}. Review the difference in a separate folder; no files were changed.`);
    changes.push({ name, file, before, content });
    if (!privateFile) managed[name] = hash(content);
  }
  if (argv.includes('--remove')) {
    for (const [name, checksum] of Object.entries(managed)) {
      if (!name.startsWith(prefix + '/') || !/^\.(agents|claude)\/skills\/[a-z0-9-]+\/[a-zA-Z0-9_./-]+$/.test(name)) continue;
      const file = safePath(name); const before = exists(file) ? readFileSync(file, 'utf8') : null;
      if (before !== null && hash(before) !== checksum) throw new Error(`Local edits in ${name}; preserve or move them before removing this skill.`);
      if (before !== null) changes.push({ name, file, before, content: null });
      delete managed[name];
    }
  } else {
    for (const skill of payload.skills) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill.slug) || skill.slug.length > 64 || !skill.files || !skill.files['SKILL.md']) throw new Error('Invalid skill identity.');
      for (const [name, content] of Object.entries(skill.files)) {
        if (!/^[a-zA-Z0-9_./-]+$/.test(name) || name.split('/').some(p => p.startsWith('.'))) throw new Error('Unsafe skill file.');
        add(`${prefix}/${skill.slug}/${name}`, content);
      }
    }
    if (payload.brand) {
      if (typeof payload.brand.id !== 'string' || !payload.brand.id || typeof payload.brand.content !== 'string' || typeof payload.brand.evidence !== 'string') throw new Error('Invalid brand context.');
      add('.cookbook/brand.md', payload.brand.content, true);
      add('.cookbook/evidence.md', payload.brand.evidence, true);
    }
    add('.cookbook/.gitignore', '*\n', true);
  }
  const next = JSON.stringify({ schemaVersion: 1, brandId: previous.brandId || payload.brand?.id || null, files: managed }, null, 2) + '\n';
  const beforeManifest = exists(manifestPath) ? readFileSync(manifestPath, 'utf8') : null;
  if (beforeManifest !== next) changes.push({ name: '.cookbook/manifest.json', file: manifestPath, before: beforeManifest, content: next });
  if (argv.includes('--dry-run')) { console.log(`Would change ${changes.length} files in ${root}. Private context and local edits are preserved.`); return; }
  // All paths/conflicts are validated before writing. A project lock prevents concurrent installers.
  const privateDir = resolve(root, '.cookbook');
  mkdirSync(privateDir, { recursive: true, mode: 0o700 });
  const lock = safePath('.cookbook/install.lock');
  const lockHandle = openSync(lock, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  closeSync(lockHandle);
  const applied = [];
  function atomicWrite(file, content) {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    const temp = `${file}.${randomUUID()}.tmp`;
    try { writeFileSync(temp, content, { flag: 'wx', mode: 0o600 }); renameSync(temp, file); }
    finally { if (exists(temp)) unlinkSync(temp); }
  }
  try {
    for (const change of changes) {
      safePath(change.name);
      const current = exists(change.file) ? readFileSync(change.file, 'utf8') : null;
      if (current !== change.before) throw new Error(`File changed during installation: ${change.name}`);
      if (change.content === null) unlinkSync(change.file); else atomicWrite(change.file, change.content);
      applied.push(change);
    }
  } catch (error) {
    for (const change of applied.reverse()) { if (change.before === null) unlinkSync(change.file); else atomicWrite(change.file, change.before); }
    throw error;
  } finally { unlinkSync(lock); }
  if (argv.includes('--remove')) {
    for (const change of changes) if (change.content === null) { try { rmdirSync(dirname(change.file)); } catch { /* Keep nonempty folders. */ } }
    console.log('Removed managed skills. Your brand brief, evidence, and local preferences remain in .cookbook.');
  } else console.log(`Installed ${payload.skills.length} skills for ${agent} in ${root}.\n${payload.brand ? 'Your shared context is .cookbook/brand.md. Existing local context was preserved.\n' : ''}Restart or refresh your AI app if needed, then ask it to use the Cookbook Brand Context skill.\nLocal refinements stay here; nothing is sent to Cookbook.`);
}
