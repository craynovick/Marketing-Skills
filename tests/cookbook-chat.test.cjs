const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');

// Compile the real TS modules in memory; no test framework or production test route.
function loader(overrides = {}) {
  const cache = new Map();
  function load(name) {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    if (!name.startsWith('@/')) return require(name);
    const base = path.join(root, name.slice(2));
    const file = ['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync);
    if (!file) throw new Error(`Missing module: ${name}`);
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} };
    cache.set(file, loadedModule);
    const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    });
    new Function('require', 'module', 'exports', outputText)(load, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  return load;
}
const load = loader({ '@/lib/supabase/server': { createClient() { throw new Error('No database in unit tests'); } } });
const { marketingChat, isRelevantFoundation } = load('@/lib/cookbook-chat');
const { resolveSkill } = load('@/lib/cookbook-server');
const { skills } = load('@/lib/generated-skills');

test('chat identity survives renaming and does not become a strategy skill', () => {
  assert.equal(resolveSkill({ skill_slug: marketingChat.slug, title: skills[0].name, file_name: 'draft.md' }).slug, marketingChat.slug);
});
test('legacy exact skill identities still resolve; unknown tasks remain unresolved', () => {
  assert.equal(resolveSkill({ title: skills[0].name, file_name: 'legacy.md' }).slug, skills[0].slug);
  assert.equal(resolveSkill({ title: 'Unrecognized', file_name: 'legacy.md' }), undefined);
});
test('sidebar separates chats, skills, and archives without losing legacy records', () => {
  const { Sidebar } = load('@/components/cookbook/sidebar');
  const tasks = [
    { id: 'chat', title: 'Launch posts', skill_slug: marketingChat.slug },
    { id: 'skill', title: 'Brand foundation', skill_slug: skills[0].slug },
    { id: 'legacy', title: 'Legacy voice', skill_slug: null },
    { id: 'archived', title: 'Old chat', skill_slug: marketingChat.slug, archived_at: '2026-09-19' },
  ];
  const props = { tasks, activeId: 'chat', busy: false, archived: false, onNew() {}, onSkills() {}, onSelect() {}, onArchiveView() {}, onClose() {}, onSettings() {} };
  const html = renderToStaticMarkup(React.createElement(Sidebar, props));
  const chats = html.split('aria-label="Chats"')[1].split('</section>')[0];
  const foundations = html.split('aria-label="Skills"')[1].split('</section>')[0];
  assert.match(chats, /Launch posts/);
  assert.doesNotMatch(chats, /Brand foundation|Legacy voice|Old chat/);
  assert.match(foundations, /Brand foundation/);
  assert.match(foundations, /Legacy voice/);
  assert.doesNotMatch(foundations, /Launch posts/);
  const archived = renderToStaticMarkup(React.createElement(Sidebar, { ...props, archived: true }));
  assert.match(archived, /Old chat/);
  assert.doesNotMatch(archived, /Launch posts|Brand foundation|Legacy voice/);
});
test('chat creation uses existing durable RPC with a bounded user-specific title', async () => {
  let rpcArgs;
  const query = { select() { return this; }, eq() { return this; }, async single() { return { data: { id: 'created' } }; } };
  const route = loader({ '@/lib/cookbook-server': {
    uuid: value => value === 'valid-id',
    account: async () => ({ user: { id: 'owner' }, db: { async rpc(name, args) { assert.equal(name, 'cookbook_create_task'); rpcArgs = args; return { data: 'created' }; }, from() { return query; } } }),
    apiError: () => new Response(null, { status: 500 }),
  } })('@/app/api/cookbook/workspace/skill/route');
  const response = await route.POST(new Request('http://localhost/api', { method: 'POST', body: JSON.stringify({ slug: marketingChat.slug, requestId: 'valid-id', title: 'A'.repeat(100) }) }));
  assert.equal(response.status, 201);
  assert.equal(rpcArgs.p_slug, marketingChat.slug);
  assert.equal(rpcArgs.p_title.length, 80);
  assert.equal(rpcArgs.p_key, 'valid-id');
});
test('unknown skill creation is rejected before database access', async () => {
  const route = loader({ '@/lib/cookbook-server': { uuid: () => true, account: () => { throw new Error('Should not access DB'); }, apiError: () => new Response(null, { status: 500 }) } })('@/app/api/cookbook/workspace/skill/route');
  const response = await route.POST(new Request('http://localhost/api', { method: 'POST', body: JSON.stringify({ slug: '../../invalid', requestId: 'valid-id' }) }));
  assert.equal(response.status, 400);
});

test('agent loads only catalog skills and refuses tools after cancellation', async () => {
  let status = 'running';
  const events = [];
  const query = {
    select() { return this; }, eq() { return this; },
    async single() { return { data: { status } }; },
    update(value) { events.push(value); return this; },
    then(resolve) { return Promise.resolve({ error: null }).then(resolve); },
  };
  const agentLoad = loader({
    ai: { ToolLoopAgent: class { constructor(options) { Object.assign(this, options); } }, jsonSchema: value => value, tool: value => value, stepCountIs: value => value },
    '@/app/api/cookbook/analyze/route': { scrapeWebsite() { throw new Error('No network in unit tests'); } },
    '@/lib/cookbook-server': { model: 'test-model' },
  });
  const { createCookbookAgent } = agentLoad('@/lib/cookbook-agent');
  const agent = await createCookbookAgent({ db: { from() { return query; } }, userId: 'owner', taskId: 'task', runId: 'run', skill: marketingChat, version: 0, content: '', context: '{}', signal: new AbortController().signal });
  const loaded = await agent.tools.loadSkill.execute({ slug: skills[0].slug });
  assert.equal(loaded.instructions, skills[0].skill);
  assert.equal(events.length, 1);
  await assert.rejects(agent.tools.loadSkill.execute({ slug: '../../private' }), /Unknown skill/);
  status = 'cancelled';
  await assert.rejects(agent.tools.loadSkill.execute({ slug: skills[0].slug }), /RUN_STOPPED/);
});


test('approved content from another chat is excluded from brand foundations', () => {
  assert.equal(isRelevantFoundation(marketingChat, marketingChat.slug), false);
  assert.equal(isRelevantFoundation(marketingChat, skills[0].slug), true);
  assert.equal(isRelevantFoundation(marketingChat, null), true);
  const selected = { slug: 'campaign', upstream: ['brand-voice'] };
  assert.equal(isRelevantFoundation(selected, 'brand-voice'), true);
  assert.equal(isRelevantFoundation(selected, 'campaign'), true);
  assert.equal(isRelevantFoundation(selected, marketingChat.slug), false);
  assert.equal(isRelevantFoundation(selected, 'unrelated'), false);
});
