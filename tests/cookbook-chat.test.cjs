const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');

// Compile the real TS modules in memory; no test framework or production test route.
const { loader } = require('./ts-loader.cjs');
const load = loader({ '@/lib/supabase/server': { createClient() { throw new Error('No database in unit tests'); } } });
const { marketingChat, isRelevantFoundation } = load('@/lib/cookbook-chat');
const { resolveSkill } = load('@/lib/cookbook-server');
const { skills } = load('@/lib/generated-skills');

test('brand proposals are bounded and reject ambiguous or unsafe input', () => {
  const { validateBrandUpdates } = load('@/lib/cookbook-foundations');
  const draft = { key: 'brand', content: '# Brand\nPaper Harbor', expectedVersion: 0, sources: ['https://example.com'] };
  assert.doesNotThrow(() => validateBrandUpdates([draft]));
  for (const invalid of [[], [draft, draft], [{ ...draft, expectedVersion: -1 }],
    [{ ...draft, content: '# Brand\n# Another title' }], [{ ...draft, sources: ['javascript:alert(1)'] }],
    [{ ...draft, key: 'secret' }], [{ ...draft, content: '# Brand\n' + 'x'.repeat(20000) }]]) {
    assert.throws(() => validateBrandUpdates(invalid));
  }
});

test('empty and terminal tasks never claim a draft is being saved', () => {
  const { taskStatus } = load('@/lib/cookbook-foundations');
  assert.equal(taskStatus({ lifecycle: 'draft' }), 'Ready to start');
  assert.equal(taskStatus({ lifecycle: 'draft', has_document: true }), 'Draft');
  assert.equal(taskStatus({ lifecycle: 'draft', run_status: 'failed' }), 'Needs attention');
  assert.equal(taskStatus({ lifecycle: 'draft', run_status: 'cancelled' }), 'Needs attention');
  assert.equal(taskStatus({ lifecycle: 'draft', run_status: 'awaiting_input' }), 'Your input needed');
});

test('explicit fictional and unrelated briefs exclude account memory', () => {
  const { requestsTaskOnlyContext } = load('@/lib/cookbook-context');
  for (const text of ['Three posts for a fictional stationery brand, Paper Harbor.',
    'Use a different company for this example.', 'Ignore my brand context.']) {
    assert.equal(requestsTaskOnlyContext(text), true);
  }
  assert.equal(requestsTaskOnlyContext('Help me describe my brand voice.'), false);
});

test('chat identity survives renaming and does not become a strategy skill', () => {
  assert.equal(resolveSkill({ skill_slug: marketingChat.slug, title: skills[0].name, file_name: 'draft.md' }).slug, marketingChat.slug);
});
test('legacy exact skill identities still resolve; unknown tasks remain unresolved', () => {
  assert.equal(resolveSkill({ title: skills[0].name, file_name: 'legacy.md' }).slug, skills[0].slug);
  assert.equal(resolveSkill({ title: 'Unrecognized', file_name: 'legacy.md' }), undefined);
});
test('sidebar has one Cookbook action and a collapsible Create-only history', () => {
  const { Sidebar } = load('@/components/cookbook/sidebar');
  const tasks = [
    { id: 'chat', title: 'Launch posts', skill_slug: marketingChat.slug },
    { id: 'skill', title: 'Brand foundation', skill_slug: skills[0].slug },
    { id: 'legacy', title: 'Legacy voice', skill_slug: null, mode: 'skill-tuning' },
    { id: 'archived', title: 'Old chat', skill_slug: marketingChat.slug, archived_at: '2026-09-19' },
  ];
  const props = { tasks, activeId: 'chat', busy: false, archived: false, onNew() {}, onSkills() {}, onSelect() {}, onArchiveView() {}, onClose() {}, onSettings() {} };
  const html = renderToStaticMarkup(React.createElement(Sidebar, props));
  const chats = html.split('aria-label="Create"')[1].split('</section>')[0];
  assert.equal((html.match(/Your Cookbook/g) || []).length, 1);
  assert.match(chats, /aria-expanded="true"/);
  assert.match(chats, /Launch posts/);
  assert.doesNotMatch(chats, /Brand foundation|Legacy voice|Old chat/);
  const archived = renderToStaticMarkup(React.createElement(Sidebar, { ...props, archived: true }));
  assert.doesNotMatch(html, /Old chat/);
  const archiveSection = archived.split('aria-label="Archived"')[1].split('</section>')[0];
  assert.match(archiveSection, /Old chat/);
  assert.doesNotMatch(archiveSection, /Launch posts|Brand foundation|Legacy voice/);
  assert.match(archiveSection, /aria-expanded="true"/);
  assert.match(archived, /Launch posts/);
});
test('chat creation uses existing durable RPC with a bounded user-specific title', async () => {
  let rpcArgs;
  const query = { select() { return this; }, eq() { return this; }, async single() { return { data: { id: 'created' } }; } };
  const route = loader({ '@/lib/cookbook-projects': { resolveProject: async () => ({id:'brand-one'}) }, '@/lib/cookbook-server': {
    uuid: value => value === 'valid-id',
    account: async () => ({ user: { id: 'owner' }, db: { async rpc(name, args) { assert.equal(name, 'cookbook_create_brand_task'); rpcArgs = args; return { data: 'created' }; }, from() { return query; } } }),
    apiError: () => new Response(null, { status: 500 }),
  } })('@/app/api/cookbook/workspace/skill/route');
  const response = await route.POST(new Request('http://localhost/api', { method: 'POST', body: JSON.stringify({ slug: marketingChat.slug, requestId: 'valid-id', title: 'A'.repeat(100) }) }));
  assert.equal(response.status, 201);
  assert.equal(rpcArgs.p_project, 'brand-one');
  assert.equal(rpcArgs.p_slug, marketingChat.slug);
  assert.equal(rpcArgs.p_title.length, 80);
  assert.equal(rpcArgs.p_key, 'valid-id');
  assert.equal(rpcArgs.p_mode, 'create');
  assert.equal(rpcArgs.p_workflow, 'general');
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
    ai: { ToolLoopAgent: class { constructor(options) { Object.assign(this, options); } }, jsonSchema: value => value, tool: value => value, stepCountIs: value => value, hasToolCall: value => value },
    '@/app/api/cookbook/analyze/route': { scrapeWebsite() { throw new Error('No network in unit tests'); } },
    '@/lib/cookbook-server': { model: 'test-model' },
  });
  const { createCookbookAgent } = agentLoad('@/lib/cookbook-agent');
  const agent = await createCookbookAgent({ db: { from() { return query; } }, userId: 'owner', taskId: 'task', runId: 'run', skill: marketingChat, version: 0, content: '', context: '{}', signal: new AbortController().signal });
  const loaded = await agent.tools.loadSkill.execute({ slug: skills[0].slug });
  assert.equal(loaded.instructions, skills[0].skill);
  assert.equal(events.length, 1);
  for (const slug of ['go-to-market-strategy', 'offer-pricing-strategy', 'sales-enablement-playbook']) {
    const skill = skills.find(item => item.slug === slug);
    assert.ok(agent.instructions.includes(`${slug}: ${skill.description}`));
    const loaded = await agent.tools.loadSkill.execute({ slug });
    const source = fs.readFileSync(path.join(root, 'content/skills', slug, 'SKILL.md'), 'utf8');
    assert.equal(loaded.instructions, source);
    const selected = await createCookbookAgent({ db: { from() { return query; } }, userId: 'owner', taskId: 'task', runId: 'run', skill, version: 0, content: '', context: '{}', signal: new AbortController().signal });
    assert.ok(selected.instructions.includes(`SELECTED SKILL (${slug}, ${skill.version}):\n${source}`));
  }
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

test('guided entry defaults honor dependency order and never auto-recommend without evidence', () => {
  const { quickStart, entryCard, defaultMode, validateCard, answerText, entryUrl } = load('@/lib/cookbook-experience');
  assert.deepEqual(quickStart.map(s => s.slug), ['audience-strategy-playbook','brand-positioning-workshop','brand-voice-guide']);
  for (const workflow of ['analyze','social-post','newsletter']) {
    const card = entryCard('create', workflow);
    assert.doesNotThrow(() => validateCard(card));
    assert.equal(card.options.some(o => o.recommended), false);
    assert.throws(() => answerText(card, {}));
    assert.throws(() => answerText(card, { optionId: 'missing' }));
    assert.match(answerText(card, { skipped: true }), /provisionally/);
  }
  assert.match(entryCard('skill-tuning','general',quickStart[0].slug,false).prompt,/brand called/);
  assert.match(entryCard('skill-tuning','general',quickStart[0].slug,true).prompt,/audience/);
  assert.equal(defaultMode('brand-voice-guide'),'skill-tuning');
  assert.equal(defaultMode('landing-page-copywriter'),'create');
  assert.match(entryUrl('create','newsletter'),/workflow=newsletter/);
});

test('decision cards use explicit submission, accessible choices, and completed summaries', () => {
  const { DecisionCard } = load('@/components/cookbook/decision-card');
  const { entryCard } = load('@/lib/cookbook-experience');
  const card=entryCard('create','social-post');
  const html=renderToStaticMarkup(React.createElement(DecisionCard,{card,onAnswer:async()=>{}}));
  assert.match(html,/type="radio"/);assert.doesNotMatch(html,/checked=""/);
  assert.match(html,/disabled="">Continue/);assert.match(html,/textarea/);
  const done=renderToStaticMarkup(React.createElement(DecisionCard,{card,answer:{optionId:'text'},onAnswer:async()=>{}}));
  assert.match(done,/A short text post/);assert.match(done,/Edit answer/);assert.doesNotMatch(done,/textarea/);
});


test('Create starters exclude Analyze while legacy research links remain valid', () => {
 const {workflows, validWorkflow} = load('@/lib/cookbook-experience');
 assert.deepEqual(workflows.map(w=>w.id),['social-post','newsletter']);
 assert.equal(validWorkflow('analyze'),true);
});
test('social clipboard text preserves line breaks without document title or emphasis', () => {
 const {copyText} = load('@/lib/cookbook-copy');
 assert.equal(copyText('# Draft\n\nA **warm** welcome.\nCome explore.\n\nSee you soon!'), 'A warm welcome.\nCome explore.\n\nSee you soon!');
});
test('platform formats include video scripts and preserve plain text render breaks', () => {
 const {platforms, adaptationPrompt} = load('@/lib/cookbook-platforms');
 assert.equal(platforms.length,7);
 assert.match(adaptationPrompt('tiktok'),/spoken script/);
 assert.match(adaptationPrompt('youtube-shorts'),/visual cues/);
 const {Markdown} = load('@/components/cookbook/markdown');
 const html=renderToStaticMarkup(React.createElement(Markdown,{value:'# Draft\n\nFirst line\nSecond line\n\nNext paragraph'}));
 assert.match(html,/First line<br\/>Second line/);
 assert.match(html,/<p>Next paragraph<\/p>/);
});
