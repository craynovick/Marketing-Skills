const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('./ts-loader.cjs');

function harness(overrides = {}) {
  const state = { id: 'pack', research_key: 'run', status: 'queued', revision: 2, content: 'Original draft', brief: 'Private brief', website: 'https://example.com', evidence: [] };
  let calls = 0;
  const db = { from() {
    const filters = []; let update;
    const query = {
      update(value) { update = value; return query; }, select() { return query; },
      eq(key, value) { filters.push(row => row[key] === value); return query; },
      in(key, values) { filters.push(row => values.includes(row[key])); return query; },
      async then(resolve) { const matches = filters.every(f => f(state)); if (matches && update) Object.assign(state, update); return resolve({ data: matches ? { ...state } : null, error: null }); },
      maybeSingle() { return query; },
    }; return query;
  } };
  const steps = loader({
    '@/lib/supabase/admin': { createAdminClient: () => db },
    '@/lib/brand-research': { collectOfficialEvidence: async () => ({ evidence: [], coverage: 'Official' }), collectMarketEvidence: async () => { throw Error('Search unavailable'); }, synthesizeBrand: async () => { calls++; return 'Researched draft'; }, ...overrides },
  })('@/lib/workflows/brand-research-steps');
  return { steps, state, calls: () => calls };
}

test('only one duplicate workflow claims a queued research attempt', async () => {
  const { steps, state } = harness();
  const claims = await Promise.all([steps.claimBrandResearch('pack', 'run'), steps.claimBrandResearch('pack', 'run')]);
  assert.equal(claims.filter(Boolean).length, 1);
  assert.equal(state.status, 'researching');
});
test('cancellation during synthesis prevents late output and failure from replacing user draft', async () => {
  let release;
  const h = harness({ synthesizeBrand: () => new Promise(resolve => { release = resolve; }) });
  const pack = await h.steps.claimBrandResearch('pack', 'run');
  const finishing = h.steps.finishBrandResearch(pack, 'run', { evidence: [], coverage: 'Official' });
  while (!release) await new Promise(resolve => setImmediate(resolve));
  h.state.status = 'draft'; h.state.revision++; h.state.content = 'User kept draft';
  release('Late researched draft'); await finishing;
  await h.steps.failBrandResearch('pack', 'run');
  assert.equal(h.state.content, 'User kept draft'); assert.equal(h.state.status, 'draft'); assert.equal(h.state.revision, 3);
});
test('stopped and superseded attempts cannot call synthesis; search failure preserves official coverage', async () => {
  const h = harness(); await h.steps.claimBrandResearch('pack', 'run');
  const result = await h.steps.researchMarket('pack', 'run', { evidence: [{ id: 'E1' }], coverage: 'One official page.' });
  assert.equal(result.evidence.length, 1); assert.match(result.coverage, /unavailable/);
  h.state.research_key = 'new-run';
  await assert.rejects(h.steps.finishBrandResearch({ ...h.state }, 'run', result), /RUN_STOPPED/);
  assert.equal(h.calls(), 0);
});
test('evidence validation rejects invented citation IDs and URLs', () => {
  const { validateEvidenceReferences } = loader({ ai: {}, '@/lib/cookbook-server': {}, '@/lib/cookbook-scraper': {} })('@/lib/brand-research');
  const evidence = [{ id: 'E1', url: 'https://example.com/' }];
  assert.doesNotThrow(() => validateEvidenceReferences('Observed claim [E1]', evidence));
  assert.doesNotThrow(() => validateEvidenceReferences('Run `npx skills add https://example.com` or read [the page](https://example.com/#section).', evidence));
  assert.throws(() => validateEvidenceReferences('Invented claim [E2]', evidence), /UNSUPPORTED_CITATION/);
  assert.throws(() => validateEvidenceReferences('Invented group [E1, E2]', evidence), /UNSUPPORTED_CITATION/);
  assert.throws(() => validateEvidenceReferences('Invented range [E1–E9]', evidence), /UNSUPPORTED_CITATION/);
  assert.doesNotThrow(() => validateEvidenceReferences('Supported range [E1–E2]', [...evidence, { id: 'E2', url: 'https://example.com/about' }]));
  assert.throws(() => validateEvidenceReferences('https://invented.test/', evidence), /UNSUPPORTED_CITATION/);
});
test('dispatch failures mark the reserved attempt failed and unauthenticated calls never dispatch', async () => {
  const id = '11111111-1111-4111-8111-111111111111'; const requestId = '22222222-2222-4222-8222-222222222222';
  let failed = 0; let dispatched = 0; let authError = false;
  const route = loader({
    'workflow/api': { start: async () => { dispatched++; throw Error('Unavailable'); } },
    '@/lib/workflows/brand-research': { brandResearchWorkflow() {} },
    '@/lib/workflows/brand-research-steps': { failBrandResearch: async (pack, key) => { assert.equal(pack, id); assert.equal(key, requestId); failed++; } },
    '@/lib/supabase/admin': { assertSupabaseAdminConfiguration() {} },
    '@/lib/brand-pack-server': { packAccount: async () => { if (authError) throw Error('PACK_AUTH_REQUIRED'); return { user: { id: 'owner' }, db: { rpc: () => ({ single: async () => ({ data: { status: 'queued', research_key: requestId } }) }) } }; } },
  })('@/app/api/cookbook/brand-packs/[id]/research/route');
  const request = () => new Request('https://cookbook.to/api/research', { method: 'POST', body: JSON.stringify({ revision: 1, requestId }) });
  const context = { params: Promise.resolve({ id }) };
  assert.equal((await route.POST(request(), context)).status, 500); assert.equal(failed, 1);
  authError = true;
  assert.equal((await route.POST(request(), context)).status, 401); assert.equal(dispatched, 1);
});
