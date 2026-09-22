'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Markdown } from '@/components/cookbook/markdown';
import { InstallSkills } from '@/components/install-skills';
import { packBusy, packStalled, type BrandPack } from '@/lib/brand-pack';

type PackSummary = Pick<BrandPack, 'id' | 'brief' | 'status'>;
class RequestError extends Error { constructor(message: string, public status: number) { super(message); } }
async function api<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { method, signal, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new RequestError(data.error || 'Could not complete this request.', response.status);
  return data as T;
}

export function BrandPackSetup({ enabled, initialPackId, initialSkill }: { enabled: boolean; initialPackId?: string; initialSkill?: string }) {
  const [packs, setPacks] = useState<PackSummary[]>([]);
  const [pack, setPack] = useState<BrandPack | null>(null);
  const [content, setContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<'describe' | 'review' | 'install'>('describe');
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [authRequired, setAuthRequired] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const operationEpoch = useRef(0);
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
    if (!enabled) return;
    const controller = new AbortController();
    void api<{ packs: PackSummary[] }>('/api/cookbook/brand-packs', 'GET', undefined, controller.signal).then(data => setPacks(data.packs)).catch(showError).finally(() => { if (!controller.signal.aborted && !initialPackId) setLoading(false); });
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
  const signIn = `/sign-in?next=${encodeURIComponent(pack ? `/create?pack=${pack.id}` : '/create?saved=1')}`;
  return <main className="pack-page wrap">
    <div className="pack-topline"><Link href="/#catalog">← Skills</Link>{pack && <button disabled={pending || dirty} onClick={() => {
      operationEpoch.current++; setPack(null); setContent(''); setEditing(false); setStep('describe'); setError('');
      window.history.replaceState(null, '', '/create?saved=1');
      void api<{ packs: PackSummary[] }>('/api/cookbook/brand-packs').then(data => setPacks(data.packs)).catch(showError);
    }}>Your brand packs</button>}</div>
    {error && <div className="pack-notice" role="alert"><p>{error}</p>{authRequired && <Link className="pack-primary" href={signIn}>Sign in to access saved packs</Link>}</div>}
    {step === 'describe' ? <>
      <p className="eyebrow">YOUR SAVED WORK</p><h1 ref={heading} tabIndex={-1}>Saved brand packs.</h1>
      <p className="pack-lede">Review or download a previous website snapshot. For a new brand, <Link href="/docs/install#personalize">set up your shared brief in your AI app</Link>.</p>
      {loading ? <p role="status">Loading saved packs…</p> : !error && enabled && packs.length === 0 ? <p>No saved brand packs yet. Your AI app can create your first shared brief.</p> : null}
      {!enabled && <p>Saved brand packs are unavailable on this installation.</p>}
      {packs.length > 0 && <ul className="pack-saved">{packs.map(item => <li key={item.id}><button disabled={pending} onClick={() => load(item.id)}>{item.brief.slice(0, 90)} <span>{item.status}</span></button></li>)}</ul>}
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
