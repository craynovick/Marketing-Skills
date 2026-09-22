const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('./ts-loader.cjs');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const load = loader();
const { websiteFromBrief, provisionalBrand, packStalled, evidenceMarkdown } = load('@/lib/brand-pack');

test('intake extracts explicit public website syntax without guessing company identity', () => {
  assert.equal(websiteFromBrief('Our website is https://example.com. We sell notebooks.'), 'https://example.com/');
  assert.equal(websiteFromBrief('Paper Harbor'), '');
  assert.equal(websiteFromBrief('https://username:password@example.com'), '');
  assert.match(provisionalBrand('Pocket notebooks'), /Pocket notebooks/);
  assert.match(provisionalBrand('Pocket notebooks'), /research has not run/);
});
test('stalled jobs are distinct from finished drafts', () => {
  const pack = { status: 'researching', research_started_at: '2026-01-01T00:00:00Z' };
  assert.equal(packStalled(pack, Date.parse('2026-01-01T00:11:00Z')), true);
  assert.equal(packStalled({ ...pack, status: 'ready' }, Date.parse('2026-01-01T00:11:00Z')), false);
});
test('downloaded installer is executable and keeps malicious-looking brand text as data', () => {
  const { installerDownload } = load('@/lib/brand-pack-download');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cookbook-package-'));
  try {
    const content = '# My brand\n`danger` ${process.exit(99)} </script>\n';
    const source = installerDownload({ id: 'test-brand', content, evidence: [], coverage: 'No research', updated_at: '2026-09-22' });
    const file = path.join(dir, 'install.mjs'); fs.writeFileSync(file, source);
    const result = spawnSync(process.execPath, [file, '--agent', 'codex'], { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(path.join(dir, '.cookbook/brand.md'), 'utf8'), content);
    const skills = fs.readdirSync(path.join(dir, '.agents/skills'));
    assert.equal(skills.length, 22);
    for (const slug of skills) {
      const markdown = fs.readFileSync(path.join(dir, '.agents/skills', slug, 'SKILL.md'), 'utf8');
      assert.match(markdown, new RegExp(`name: ${slug}`));
      assert.match(markdown, /\.cookbook\/brand\.md/);
    }
    assert.match(evidenceMarkdown({ evidence: [], coverage: 'No research', updated_at: 'today' }), /No research/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('private exports require the owning account and reject active research', async () => {
  let called = false;
  let active = false;
  const route = loader({
    '@/lib/brand-pack-server': { packAccount: async () => ({ db: {}, user: { id: 'owner' } }), ownedPack: async (_db, user, id) => { assert.equal(user, 'owner'); assert.equal(id, '11111111-1111-4111-8111-111111111111'); if (active) return { status: 'researching' }; throw new Error('NOT_FOUND'); } },
    '@/lib/brand-pack-download': { installerDownload() { called = true; } },
  })('@/app/api/cookbook/brand-packs/[id]/download/route');
  const response = await route.GET(new Request('https://cookbook.to/api/download'), { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) });
  assert.equal(response.status, 404); assert.equal(called, false);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  active = true;
  const running = await route.GET(new Request('https://cookbook.to/api/download'), { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) });
  assert.equal(running.status, 409); assert.equal(called, false);
});
