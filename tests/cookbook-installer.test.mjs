import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../packages/cookbook-installer/install.mjs';
const payload = () => ({ schemaVersion: 1, skills: [{ slug: 'test-skill', files: { 'SKILL.md': '---\nname: test-skill\ndescription: Test\n---\nRead .cookbook/brand.md.\n', 'references/example.md': '# Example' } }], brand: { id: 'paper-harbor', content: '# Paper Harbor\nPrivate facts', evidence: '# Evidence\nUser brief' } });
const withProject = fn => { const dir = mkdtempSync(join(tmpdir(), 'cookbook-install-')); try { fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); } };

test('both agents use one private brief; repeat install preserves local refinements', () => withProject(dir => {
  install(payload(), ['--agent', 'codex'], dir);
  writeFileSync(join(dir, '.cookbook/brand.md'), '# Locally refined brand');
  install(payload(), ['--agent', 'claude-code'], dir);
  install(payload(), ['--agent', 'codex'], dir);
  assert.equal(readFileSync(join(dir, '.cookbook/brand.md'), 'utf8'), '# Locally refined brand');
  assert.equal(readFileSync(join(dir, '.cookbook/.gitignore'), 'utf8'), '*\n');
  assert.ok(existsSync(join(dir, '.agents/skills/test-skill/references/example.md')));
  assert.ok(existsSync(join(dir, '.claude/skills/test-skill/SKILL.md')));
  assert.equal(existsSync(join(dir, 'AGENTS.md')), false);
}));
test('updates require unchanged managed files and preserve brand context', () => withProject(dir => {
  install(payload(), ['--agent', 'codex'], dir);
  const next = payload(); next.skills[0].files['SKILL.md'] += 'Improvement';
  assert.throws(() => install(next, ['--agent', 'codex'], dir), /existing/);
  install(next, ['--agent', 'codex', '--update'], dir);
  assert.match(readFileSync(join(dir, '.agents/skills/test-skill/SKILL.md'), 'utf8'), /Improvement/);
  writeFileSync(join(dir, '.agents/skills/test-skill/SKILL.md'), 'Local edit');
  assert.throws(() => install(payload(), ['--agent', 'codex', '--update'], dir), /existing/);
  assert.equal(readFileSync(join(dir, '.agents/skills/test-skill/SKILL.md'), 'utf8'), 'Local edit');
}));
test('preflight refuses traversal, symlinks, brand switching, and collisions without partial writes', () => withProject(dir => {
  const unsafe = payload(); unsafe.skills[0].files['../../outside.md'] = 'bad';
  assert.throws(() => install(unsafe, ['--agent', 'codex'], dir), /Unsafe/);
  assert.equal(existsSync(join(dir, '.cookbook')), false);
  mkdirSync(join(dir, '.agents')); symlinkSync(tmpdir(), join(dir, '.agents/skills'));
  assert.throws(() => install(payload(), ['--agent', 'codex'], dir), /symbolic/);
  rmSync(join(dir, '.agents/skills'));
  install(payload(), ['--agent', 'codex'], dir);
  const other = payload(); other.brand.id = 'another-brand';
  assert.throws(() => install(other, ['--agent', 'codex'], dir), /another brand/);
}));
test('dry runs do not write; remove leaves private context and other agent installs', () => withProject(dir => {
  install(payload(), ['--agent', 'codex', '--dry-run'], dir);
  assert.equal(existsSync(join(dir, '.cookbook')), false);
  install(payload(), ['--agent', 'codex'], dir); install(payload(), ['--agent', 'claude-code'], dir);
  install(payload(), ['--agent', 'codex', '--remove'], dir);
  assert.equal(existsSync(join(dir, '.agents/skills/test-skill/SKILL.md')), false);
  assert.ok(existsSync(join(dir, '.cookbook/brand.md')));
  assert.ok(existsSync(join(dir, '.claude/skills/test-skill/SKILL.md')));
}));
test('an existing project instruction file is never replaced', () => withProject(dir => {
  writeFileSync(join(dir, 'AGENTS.md'), 'User-owned instructions');
  install(payload(), ['--agent', 'codex'], dir);
  assert.equal(readFileSync(join(dir, 'AGENTS.md'), 'utf8'), 'User-owned instructions');
}));
