"use client";
import { useContext, useEffect, useRef, useState } from 'react';
import { BrandFeatures } from "./feature-context";
import { adaptationPrompt, platforms } from '@/lib/cookbook-platforms';
import { json, messageOf, requestJSON, type Task } from './types';
export function Adaptations({ task, busy, durable }: { task: Task; busy: boolean; durable: boolean }) {
  const enabled = useContext(BrandFeatures);
  const [open, setOpen] = useState(false); const [selected, setSelected] = useState<string[]>([]);
  const [voices, setVoices] = useState<Record<string, string>>({}); const [items, setItems] = useState<Task[]>([]);
  const [pending, setPending] = useState(false); const [notice, setNotice] = useState('');
  const operations = useRef(new Map<string, { creation: string; run: string; started: boolean }>());
  useEffect(() => {
    const abort = new AbortController();
    requestJSON<{adaptations: Task[]}>(`/api/cookbook/adaptations?sourceId=${task.id}`, { signal: abort.signal }).then(result => { if (!abort.signal.aborted) setItems(result.adaptations); }).catch(error => { if (!abort.signal.aborted) setNotice(messageOf(error)); });
    return () => abort.abort();
  }, [task.id]);
  async function generate() {
    if (pending || !task.document) return; setPending(true); setNotice('');
    const failures: string[] = [];
    for (const platform of selected) {
      const key = JSON.stringify([task.document.id, platform, voices[platform] || '']);
      let operation = operations.current.get(key);
      if (!operation) { operation = { creation: crypto.randomUUID(), run: crypto.randomUUID(), started: false }; operations.current.set(key, operation); }
      if (operation.started) continue;
      try {
        const result = await requestJSON<{task: Task}>('/api/cookbook/adaptations', json({sourceId: task.id, documentId: task.document.id, platform, voice: voices[platform] || '', requestId: operation.creation}));
        setItems(current => [...current.filter(t => t.id !== result.task.id), result.task]);
        const response = await fetch(durable ? '/api/cookbook/runs' : '/api/chat', json({taskId: result.task.id, requestId: operation.run, attachmentIds: [], messages: [{role: 'user', parts: [{type: 'text', text: adaptationPrompt(platform)}]}]}));
        if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Could not start this adaptation.'); }
        // Durable requests acknowledge immediately. Legacy streams must be drained to complete saving.
        if (!durable) await response.text();
        operation.started = true;
      } catch (error) { failures.push(`${platform}: ${messageOf(error)} Open its task to retry if generation failed.`); }
    }
    setNotice(failures.length ? failures.join(' ') : 'Adaptations started. Open a platform draft to follow its progress.');
    setPending(false);
  }
  if (!enabled) return null;
  return <section className="cw-adaptations" aria-label="Platform adaptations">
    <button disabled={busy || pending} onClick={() => setOpen(v => !v)} aria-expanded={open}>Adapt for platforms</button>
    {open && <div><p>Keep your original. Create a separate draft for each selected platform.</p>
      <fieldset disabled={busy || pending}><legend>Platforms and voice</legend>{platforms.map(p => <div className="cw-platform" key={p.id}>
        <label><input type="checkbox" checked={selected.includes(p.id)} onChange={e => setSelected(current => e.target.checked ? [...current, p.id] : current.filter(id => id !== p.id))} /> {p.name}</label>
        {selected.includes(p.id) && <input aria-label={`${p.name} voice direction`} placeholder="Use brand voice, or add a direction…" maxLength={500} value={voices[p.id] || ''} onChange={e => setVoices(current => ({...current, [p.id]: e.target.value}))} />}
      </div>)}</fieldset><button disabled={busy || pending || !selected.length} onClick={() => void generate()}>{pending ? 'Starting adaptations…' : 'Create adaptations'}</button></div>}
    {notice && <p role="status">{notice}</p>}
    {!!items.length && <ul>{items.map(item => <li key={item.id}><a href={`/create?task=${item.id}`}>{platforms.find(p => p.id === item.platform)?.name || item.title} →</a>{item.source_document_id !== task.document?.id && <small> · Source changed — review suggested</small>}</li>)}</ul>}
  </section>;
}
