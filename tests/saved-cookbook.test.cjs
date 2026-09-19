const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const { loader } = require('./ts-loader.cjs');
const owner = '11111111-1111-4111-8111-111111111111';
const load = loader();
const { savedSkillStatus, savedSkillFilename } = load('@/lib/saved-cookbook');

function route(rows, { enabled = true, authenticated = true, failed = false } = {}) {
  let url;
  const db = createClient('https://example.supabase.co', 'test-key', { global: { fetch: async input => {
    url = new URL(input);
    return Response.json(failed ? { message: 'database unavailable' } : rows, { status: failed ? 503 : 200 });
  } }, auth: { persistSession: false } });
  const get = loader({
    '@/lib/cookbook-server': {
      account: async () => { if (!authenticated) throw new Error('AUTH_REQUIRED'); return { db, user: { id: owner } }; },
      uuid: value => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value),
      apiError: error => Response.json({ error: error.message }, { status: error.message === 'AUTH_REQUIRED' ? 401 : 500 }),
    },
    '@/lib/cookbook-features': { cookbookV2Enabled: () => enabled },
  })('@/app/api/cookbook/saved/route').GET;
  return { get: cursor => get(new Request(`http://localhost/api/cookbook/saved${cursor ? `?before=${encodeURIComponent(cursor)}` : ''}`)), url: () => url };
}

test('saved list scopes parent and documents to owner, excludes chats/archives and bounds latest versions', async () => {
  const api = route([{ id: owner, updated_at: '2026-09-19T12:00:00Z', documents: [{ id: 'latest', version: 3, content: '# Personal draft' }] }]);
  const response = await api.get(); const data = await response.json();
  assert.equal(data.skills[0].document.content, '# Personal draft');
  assert.equal(data.nextCursor, null);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const query = api.url().searchParams;
  assert.equal(query.get('user_id'), `eq.${owner}`);
  assert.equal(query.get('documents.user_id'), `eq.${owner}`);
  assert.equal(query.get('archived_at'), 'is.null');
  assert.ok(query.getAll('or').includes('(skill_slug.is.null,skill_slug.neq.marketing-chat)'));
  assert.equal(query.get('documents.limit'), '1');
  assert.equal(query.get('documents.order'), 'version.desc');
  assert.equal(query.get('limit'), '31');
});

test('pagination preserves both filters and uses a stable timestamp/id cursor', async () => {
  const rows = Array.from({ length: 31 }, (_, n) => ({ id: `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`, updated_at: '2026-09-19T12:00:00+00:00', documents: [] }));
  const api = route(rows); const data = await (await api.get()).json();
  assert.equal(data.skills.length, 30); assert.equal(data.skills[0].document, null);
  assert.equal(data.nextCursor, `${rows[29].updated_at}|${rows[29].id}`);
  await api.get(data.nextCursor);
  assert.equal(api.url().searchParams.getAll('or').length, 2);
  assert.match(api.url().searchParams.getAll('or')[1], /id.lt.11111111/);
});

test('legacy mode omits foundation columns; invalid cursors and unsigned reads fail', async () => {
  const api = route([], { enabled: false });
  assert.deepEqual(await (await api.get()).json(), { skills: [], nextCursor: null });
  assert.ok(!api.url().searchParams.get('select').includes('foundation_key'));
  assert.equal((await api.get(`bad|${owner}`)).status, 400);
  assert.equal((await route([], { authenticated: false }).get()).status, 401);
  assert.equal((await route([], { failed: true }).get()).status, 500);
});

test('download state distinguishes latest drafts from previously confirmed versions', () => {
  const skill = { accepted_version_id: 'confirmed', document: { id: 'new-draft' } };
  assert.equal(savedSkillStatus(skill), 'Changes to review');
  assert.equal(savedSkillStatus({ ...skill, document: { id: 'confirmed' } }), 'Confirmed');
  assert.equal(savedSkillStatus({ ...skill, accepted_version_id: null }), 'Draft');
  assert.equal(savedSkillStatus({ ...skill, document: null }), 'No saved document');
  assert.equal(savedSkillFilename({ file_name: '../../Brand voice.md', title: 'Brand' }), 'Brand-voice.md');
});
