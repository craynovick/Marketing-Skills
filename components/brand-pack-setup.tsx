'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Markdown } from '@/components/cookbook/markdown';
import { InstallSkills } from '@/components/install-skills';
import { packBusy, packStalled, type BrandPack } from '@/lib/brand-pack';

type PackSummary = Pick<BrandPack, 'id' | 'brief' | 'status'>;
type Brand = { id: string; name: string; website: string };
const draftKey = 'cookbook-brand-intake';
class RequestError extends Error { constructor(message: string, public status: number) { super(message); } }
async function api<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { method, signal, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new RequestError(data.error || 'Could not complete this request.', response.status);
  return data as T;
}

export function BrandPackSetup({ enabled, initialPackId, initialSkill }: { enabled: boolean; initialPackId?: string; initialSkill?: string }) {
  const [brief, setBrief] = useState('');
  const [website, setWebsite] = useState('');
  const [projectId, setProjectId] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [pack, setPack] = useState<BrandPack | null>(null);
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<'describe' | 'review' | 'install'>('describe');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(!!initialPackId && enabled);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const operationEpoch = useRef(0);
  const createKey = useRef<string | null>(null);
  const operation = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const dirty = !!pack && content !== pack.content;
  const busy = !!pack && packBusy(pack);
  const packId = pack?.id;

  function showPack(value: BrandPack) { setPack(value); setContent(value.content); setEditing(false); setStep('review'); setAuthRequired(false); window.history.replaceState(null, '', `/create?pack=${value.id}`); }
  function showError(cause: unknown) {
    if (cause instanceof Error && cause.name === 'AbortError') return;
    setError(cause instanceof Error ? cause.message : 'Could not complete this request.');
    if (cause instanceof RequestError && cause.status === 401) setAuthRequired(true);
  }
  useEffect(() => {
    try { const saved = sessionStorage.getItem(draftKey); if (saved) { const data = JSON.parse(saved); setBrief(data.brief || ''); setWebsite(data.website || ''); } } catch { /* Storage is optional. */ }
    if (!enabled) return;
    const controller = new AbortController();
    void api<{ packs: PackSummary[] }>('/api/cookbook/brand-packs', 'GET', undefined, controller.signal).then(data => setPacks(data.packs)).catch(showError);
    void api<{ brands: Brand[] }>('/api/cookbook/brands', 'GET', undefined, controller.signal).then(data => setBrands(data.brands)).catch(() => { /* New brands can start without legacy imports. */ });
    if (initialPackId) void api<{ pack: BrandPack }>(`/api/cookbook/brand-packs/${initialPackId}`, 'GET', undefined, controller.signal).then(data => showPack(data.pack)).catch(showError).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); operation.current?.abort(); };
  }, [enabled, initialPackId]);
  useEffect(() => { heading.current?.focus(); }, [step]);
  useEffect(() => {
    if (!packId || !busy) return;
    const id = packId;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const epoch = operationEpoch.current;
        const result = await api<{ pack: BrandPack }>(`/api/cookbook/brand-packs/${id}`, 'GET', undefined, controller.signal);
        if (controller.signal.aborted) return;
        if (epoch !== operationEpoch.current) { timer = setTimeout(() => void poll(), 2500); return; }
        setPack(result.pack); setContent(result.pack.content);
        if (packBusy(result.pack) && !packStalled(result.pack)) timer = setTimeout(() => void poll(), 2500);
      } catch (cause) { if (!controller.signal.aborted) { showError(cause); timer = setTimeout(() => void poll(), 6000); } }
    };
    timer = setTimeout(() => void poll(), 1500);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [packId, busy]); // Poll only while a server-owned research job is active.
  useEffect(() => {
    if (!busy || !pack?.research_started_at) return;
    const started = Date.parse(pack.research_started_at);
    const timer = setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [busy, pack?.research_started_at]);

  async function act(work: (signal: AbortSignal) => Promise<void>) {
    if (operation.current) return;
    const controller = new AbortController(); operation.current = controller; operationEpoch.current++;
    setPending(true); setError('');
    try { await work(controller.signal); } catch (cause) { showError(cause); }
    finally { if (operation.current === controller) { operation.current = null; setPending(false); } }
  }
  async function research(value: BrandPack, signal: AbortSignal) {
    const data = await api<{ pack: BrandPack }>(`/api/cookbook/brand-packs/${value.id}/research`, 'POST', { revision: value.revision, requestId: crypto.randomUUID() }, signal);
    setPack(data.pack); setElapsed(0);
  }
  function create() {
    try { sessionStorage.setItem(draftKey, JSON.stringify({ brief, website })); } catch { /* Keep the form in memory. */ }
    void act(async signal => {
      createKey.current ||= crypto.randomUUID();
      const data = await api<{ pack: BrandPack }>('/api/cookbook/brand-packs', 'POST', { id: createKey.current, brief, website, ...(projectId ? { projectId } : {}) }, signal);
      showPack(data.pack);
      try { sessionStorage.removeItem(draftKey); } catch { /* Nonessential. */ }
      if (data.pack.website && data.pack.status === 'draft') await research(data.pack, signal);
    });
  }
  function save(reviewed: boolean, install: boolean) {
    if (!pack) return;
    void act(async signal => {
      const data = await api<{ pack: BrandPack }>(`/api/cookbook/brand-packs/${pack.id}`, 'PATCH', { action: 'save', revision: pack.revision, content, reviewed }, signal);
      setPack(data.pack); setContent(data.pack.content); setEditing(false);
      if (install) setStep('install');
    });
  }
  function load(id: string) {
    void act(async signal => { const data = await api<{ pack: BrandPack }>(`/api/cookbook/brand-packs/${id}`, 'GET', undefined, signal); showPack(data.pack); });
  }
  const signIn = `/sign-in?next=${encodeURIComponent(pack ? `/create?pack=${pack.id}` : '/create')}`;
  return <main className="pack-page wrap">
    <div className="pack-topline"><Link href="/#catalog">← Skills</Link>{pack && <button disabled={pending || dirty} onClick={() => {
      operationEpoch.current++; setPack(null); setContent(''); setBrief(''); setWebsite(''); setProjectId(''); setEditing(false); setStep('describe'); setError(''); createKey.current = null;
      window.history.replaceState(null, '', '/create');
      void api<{ packs: PackSummary[] }>('/api/cookbook/brand-packs').then(data => setPacks(data.packs)).catch(showError);
    }}>Your brand packs</button>}<Link href="/create?legacy=1">Previous workspace</Link></div>
    <ol className="pack-steps" aria-label="Setup progress">{['describe', 'review', 'install'].map((item, i) => <li key={item} aria-current={step === item ? 'step' : undefined}><span>{i + 1}</span>{item}</li>)}</ol>
    {error && <div className="pack-notice" role="alert"><p>{error}</p>{authRequired && <Link className="pack-primary" href={signIn} onClick={() => { try { sessionStorage.setItem(draftKey, JSON.stringify({ brief, website })); } catch { /* Optional recovery. */ } }}>Sign in to save and research</Link>}</div>}
    {step === 'describe' ? <>
      <p className="eyebrow">YOUR BRAND, READY TO GO</p><h1 ref={heading} tabIndex={-1}>Tell us about<br /><em>your brand.</em></h1>
      <p className="pack-lede">We’ll turn your context into a reusable brand brief for your marketing skills. Keep creating and refining in your own AI app.</p>
      {loading ? <p role="status">Opening your brand pack…</p> : <form onSubmit={e => { e.preventDefault(); create(); }}>
        <label htmlFor="brand-brief">What do you offer, who is it for, and what would you like to achieve?</label>
        <textarea id="brand-brief" required maxLength={8000} rows={5} placeholder="We’re a neighborhood ceramics studio helping beginners make something with their hands. We want to fill our weekend workshops…" value={brief} onChange={e => { setBrief(e.target.value); createKey.current = null; }} disabled={pending} />
        <details className="pack-extras"><summary>Add a website or use a saved brand</summary><label>Official website <span>(optional)</span><input type="url" placeholder="https://yourbrand.com" value={website} disabled={pending} onChange={e => { setWebsite(e.target.value); createKey.current = null; }} /></label>{brands.length > 0 && <label>Import confirmed context<select value={projectId} disabled={pending} onChange={e => { setProjectId(e.target.value); createKey.current = null; const brand = brands.find(b => b.id === e.target.value); if (brand) { setWebsite(brand.website); if (!brief) setBrief(`Use our confirmed brand context for ${brand.name}.`); } }}><option value="">Start from my description</option>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>}</details>
        <button className="pack-primary" disabled={pending || !brief.trim() || !enabled}>{pending ? 'Preparing your brand pack…' : 'Build my brand pack →'}</button>
        <p className="pack-small">An official website enables research into your offer, alternatives, and buying needs. Without one, start with a provisional brief and research further in your AI app. Hosted research is limited to four attempts per day.</p>
      </form>}
      {!enabled && <p className="pack-notice">Hosted brand setup is not enabled on this installation yet. You can install the skills below and describe your brand in your AI app.</p>}
      {packs.length > 0 && <details><summary>Your saved brand packs</summary><ul className="pack-saved">{packs.map(item => <li key={item.id}><button disabled={pending} onClick={() => load(item.id)}>{item.brief.slice(0, 90)} <span>{item.status}</span></button></li>)}</ul></details>}
      <div className="pack-divider" /><InstallSkills />
    </> : pack && <>
      <p className="eyebrow">ONE BRIEF. EVERY SKILL.</p><h1 ref={heading} tabIndex={-1}>{step === 'review' ? 'Make it yours.' : 'Ready for your AI app.'}</h1>
      {step === 'review' ? <>
        <p className="pack-lede">Review your brand context once. Every installed marketing skill reads the same brief.</p>
        {busy && <div className="pack-progress" role="status"><strong>{packStalled(pack) ? 'Research is taking longer than expected' : pack.stage || 'Researching your brand'}</strong><p>{elapsed}s elapsed. Your progress is saved; you can return to this page.</p><button disabled={pending} onClick={() => void act(async signal => { const data = await api<{ pack: BrandPack }>(`/api/cookbook/brand-packs/${pack.id}`, 'PATCH', { action: 'cancel', revision: pack.revision }, signal); setPack(data.pack); })}>Stop research and keep draft</button></div>}
        {pack.error && <p role="alert" className="pack-notice">{pack.error}</p>}
        <div className="pack-review-toolbar"><span>{pack.status === 'reviewed' ? 'Reviewed by you' : 'Provisional · review before use'}</span><button disabled={busy || pending} onClick={() => setEditing(!editing)}>{editing ? 'Preview' : 'Edit brief'}</button></div>
        {editing ? <label className="pack-editor-label">Brand brief<textarea className="pack-editor" rows={24} maxLength={50000} value={content} disabled={busy || pending} onChange={e => setContent(e.target.value)} /></label> : <article className="pack-document"><Markdown value={content} /></article>}
        <details className="pack-evidence"><summary>Sources and research coverage ({pack.evidence.length})</summary><p>{pack.coverage}</p>{pack.evidence.map(item => <section key={item.id}><h3>{item.id} · <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></h3><p className="pack-small">{item.kind === 'search' ? 'Search excerpt' : 'Official website'} · {item.accessedAt.slice(0, 10)}</p><p>{item.excerpt.slice(0, 700)}</p></section>)}</details>
        <div className="pack-actions"><button className="pack-primary" disabled={busy || pending || !content.trim()} onClick={() => save(true, true)}>Use this version →</button><button disabled={busy || pending || !content.trim()} onClick={() => save(false, true)}>Continue provisionally</button>{dirty && <button disabled={busy || pending} onClick={() => save(false, false)}>Save draft</button>}</div>
        {pack.website && !busy && <button className="pack-text-button" disabled={pending || dirty} onClick={() => void act(signal => research(pack, signal))}>Research website again</button>}
        {dirty && <p className="pack-small">Save your edits before starting research. If a version conflict occurs, copy your edits before reloading.</p>}
      </> : <>
        <InstallSkills hasBrand downloadUrl={`/api/cookbook/brand-packs/${pack.id}/download`} firstPrompt={initialSkill ? `Read .cookbook/brand.md and use ${initialSkill} for our next marketing task. Ask only for task-specific context that is missing.` : undefined} />
        <p className="pack-small">The installed brief becomes your source of truth. Local changes are not automatically synchronized with this website snapshot.</p>
        <div className="pack-actions"><a href={`/api/cookbook/brand-packs/${pack.id}/download?format=markdown`}>Download brand.md</a><a href={`/api/cookbook/brand-packs/${pack.id}/download?format=evidence`}>Download sources</a><button onClick={() => setStep('review')}>Back to review</button></div>
      </>}
    </>}
  </main>;
}
