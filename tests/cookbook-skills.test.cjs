const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loader } = require('./ts-loader.cjs');
const load = loader();
const { skills } = load('@/lib/generated-skills');
const { skills: catalog } = load('@/lib/generated-skill-catalog');
const root = path.resolve(__dirname, '..');

// This invariant catches policy injection, stale exports, and missing source recipes.
test('every exported recipe is exactly its canonical portable Markdown', () => {
  const slugs = fs.readdirSync(path.join(root, 'content/skills'), { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  assert.deepEqual(skills.map(skill => skill.slug).sort(), slugs);
  assert.deepEqual(catalog.map(skill => skill.slug).sort(), slugs);
  for (const skill of skills) {
    assert.equal(skill.skill, fs.readFileSync(path.join(root, 'content/skills', skill.slug, 'SKILL.md'), 'utf8'), skill.slug);
    assert.equal(catalog.find(item => item.slug === skill.slug).version, skill.version);
  }
});

test('GTM recipes are discoverable without acquiring foundation write privileges', () => {
  const { recipeList, recipe } = load('@/lib/integrations/service');
  for (const slug of ['go-to-market-strategy', 'offer-pricing-strategy', 'sales-enablement-playbook']) {
    const skill = skills.find(item => item.slug === slug);
    assert.ok(skill);
    assert.equal(skill.foundational, false);
    assert.deepEqual(skill.writes_profile, []);
    assert.equal(recipeList().find(item => item.slug === slug).version, skill.version);
    assert.equal(recipe(slug).markdownContent, skill.skill);
    assert.equal(recipe(slug, 'validate').mode, 'validate');
  }
});

test('fixture validator catches a missing suite, missing mode, empty section, and orphan suite', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cookbook-eval-inventory-'));
  const validator = path.join(root, 'scripts/validate-skill-evals.mjs');
  const run = () => spawnSync(process.execPath, [validator], { cwd: dir, encoding: 'utf8' });
  try {
    fs.mkdirSync(path.join(dir, 'content/skills/sample'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'content/skills/sample/SKILL.md'), '# Sample');
    fs.mkdirSync(path.join(dir, 'evals'), { recursive: true });
    for (const name of ['README.md', 'rubric.md', 'chat-scenarios.md']) fs.writeFileSync(path.join(dir, 'evals', name), '# Guidance');
    assert.match(run().stderr, /Missing evaluation fixture/);
    fs.mkdirSync(path.join(dir, 'evals/sample'));
    const fixture = '# Fixture\n\n## Brief\n\nA specific brief.\n\n## Request\n\nDo the task.\n\n## Expected behavior\n\nA concrete outcome.\n';
    for (const mode of ['setup', 'apply', 'tune', 'validate']) fs.writeFileSync(path.join(dir, 'evals/sample', `${mode}.md`), fixture);
    assert.match(run().stderr, /safety.md/);
    const safety = path.join(dir, 'evals/sample/safety.md');
    fs.writeFileSync(safety, fixture.replace('A concrete outcome.', ''));
    assert.match(run().stderr, /Missing Expected behavior/);
    fs.writeFileSync(safety, fixture);
    assert.equal(run().status, 0);
    fs.mkdirSync(path.join(dir, 'evals/removed-skill'));
    assert.match(run().stderr, /no source skill/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});


test('standard distribution preserves source instructions and package references', () => {
  for (const skill of skills) {
    const file = path.join(root, 'skills', skill.slug, 'SKILL.md');
    const portable = fs.readFileSync(file, 'utf8');
    assert.equal(portable, skill.portable);
    const body = text => text.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
    assert.equal(body(portable), body(skill.skill));
    assert.match(portable, new RegExp('name: ' + skill.slug));
  }
});

test('public discovery publishes exactly the skill library and license files', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '../public/.well-known/skills');
  const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
  assert.equal(index.skills.length, 22);
  for (const skill of index.skills) {
    assert.match(skill.name, /^[a-z0-9-]+$/);
    assert.ok(skill.files.includes('SKILL.md'));
    assert.ok(skill.files.includes('LICENSE'));
    for (const file of skill.files) {
      assert.ok(!file.includes('..') && !file.startsWith('/'));
      assert.equal(fs.readFileSync(path.join(root, skill.name, file), 'utf8'), fs.readFileSync(path.resolve(__dirname, '../skills', skill.name, file), 'utf8'));
    }
  }
});
