"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { foundations, type BrandProposal } from "@/lib/cookbook-foundations";
import type { BrandState, Foundation } from "@/lib/cookbook-brand-server";
import { Artifact } from "./artifact";
import { Markdown, safeLink } from "./markdown";
import { json, messageOf, requestJSON, type Draft } from "./types";

export function BrandProposalCard({ proposal, onRefresh, busy = false, onDecision, approveLabel }: { proposal: BrandProposal; onRefresh: () => Promise<void>; busy?: boolean; approveLabel?: string; onDecision?: (action: "kept" | "skipped") => void | Promise<void> }) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(proposal.items.map(i=>i.content));
  const operation = useRef(crypto.randomUUID());
  async function review(action: "kept" | "skipped" | "edit") {
    setPending(true); setNotice("");
    try {
      if (action === "edit") {
        await requestJSON("/api/cookbook/foundations", json({ taskId: proposal.task_id, requestId: operation.current,
          updates: proposal.items.map((item,i)=>({ key:item.key, content:values[i], expectedVersion:item.version, sources:item.sources })) }));
        await requestJSON("/api/cookbook/foundations",json({proposalId:proposal.id,action:"skipped"}));
        operation.current = crypto.randomUUID();
      } else await requestJSON("/api/cookbook/foundations", json({ proposalId:proposal.id, action }));
      setEditing(false);
      await onRefresh();
      window.dispatchEvent(new Event("cookbook-brand-changed"));
      if (action !== "edit") await onDecision?.(action);
    } catch (error) { setNotice(messageOf(error)); } finally { setPending(false); }
  }
  return <section className="cw-brand-proposal" aria-label="Suggested brand updates">
    <small>{proposal.status === "kept" ? "KEPT IN YOUR COOKBOOK" : proposal.status === "skipped" ? "SKIPPED" : "SUGGESTED BRAND UPDATES"}</small>
    <p>{proposal.status === "pending" ? "Review these drafts. Only what you keep becomes reusable brand context." : proposal.status === "kept" ? "These versions are confirmed for future work." : "These drafts were not added to your brand context."}</p>
    {proposal.items.map((item,i)=><details key={item.key} open={editing || undefined}>
      <summary>{foundations.find(f=>f.key===item.key)?.name} · v{item.version}</summary>
      <small>{item.key}.md</small>
      {editing ? <textarea aria-label={`Edit ${item.key}`} value={values[i]} rows={12} maxLength={20000} onChange={e=>setValues(current=>current.map((v,j)=>i===j?e.target.value:v))} /> : <Markdown value={item.content} />}
      {!!item.sources.length && <div className="cw-sources">Sources: {item.sources.filter(s=>safeLink(s)).map(s=><a href={safeLink(s)!} key={s} target="_blank" rel="noreferrer">{s}</a>)}</div>}
    </details>)}
    {proposal.status === "pending" && <div className="cw-brand-actions">
      <button className="cw-primary" disabled={busy||pending} onClick={()=>void review(editing?"edit":"kept")}>{pending ? "Saving…" : editing ? "Save revised proposal" : approveLabel || `Keep ${proposal.items.length === 1 ? "this document" : `these ${proposal.items.length} documents`}`}</button>
      <button disabled={busy||pending} onClick={()=>setEditing(v=>!v)}>{editing?"Cancel editing":"Edit"}</button>
      {!editing && <button disabled={busy||pending} onClick={()=>void review("skipped")}>Skip</button>}
    </div>}
    {notice && <p role="alert">{notice}</p>}
  </section>;
}

export function BrandManager({ onStart, onBack }: { onStart: (prompt:string)=>void; onBack: ()=>void }) {
  const [state,setState]=useState<BrandState|null>(null);
  const [notice,setNotice]=useState("");
  const [selected,setSelected]=useState<Foundation|null>(null);
  const [versions,setVersions]=useState<Draft[]>([]);
  const lastFocus=useRef<HTMLElement|null>(null);
  const load=useCallback(async()=>{
    try { const result=await requestJSON<BrandState & {enabled:boolean}>("/api/cookbook/foundations");
      if(!result.enabled) {setNotice("Guided brand setup is not enabled on this deployment yet.");return;}
      setState(result);setNotice("");
      return result;
    } catch(error){setNotice(messageOf(error));}
  },[]);
  useEffect(()=>{void load();},[load]);
  async function open(item:Foundation) {
    lastFocus.current=window.document.activeElement as HTMLElement;
    try {const result=await requestJSON<{versions:Draft[]}>(`/api/cookbook/workspace/document?skillId=${item.id}`);setVersions(result.versions);setSelected(item);}
    catch(error){setNotice(messageOf(error));}
  }
  async function refreshDocument() {
    const next=await load();
    const fresh=next?.foundations.find(f=>f.id===selected?.id);
    if(fresh){setSelected(fresh);const history=await requestJSON<{versions:Draft[]}>(`/api/cookbook/workspace/document?skillId=${fresh.id}`);setVersions(history.versions);}
    window.dispatchEvent(new Event("cookbook-brand-changed"));
  }
  function close(){setSelected(null);lastFocus.current?.focus();}
  return <div className={`cw-brand-manager ${selected?"cw-brand-reading":""}`}>
    <div className="cw-brand-overview">
      <button onClick={onBack}>← Back to chat</button>
      <p className="cw-eyebrow">SKILL TUNING</p><h1>Your Cookbook</h1>
      <p>Your brand, kept together. Review what Cookbook knows and shape what it learns next.</p>
      {notice && <p className="cw-notice" role="alert">{notice} <button onClick={()=>void load()}>Retry</button></p>}
      {!state && !notice && <p role="status">Opening your Cookbook…</p>}
      <div className="cw-foundation-grid">{foundations.map(f=>{
        const item=state?.foundations.find(d=>d.foundation_key===f.key);
        return <button key={f.key} disabled={!state} onClick={()=>item?void open(item):onStart(`Help me build my ${f.name.toLowerCase()}. Use confirmed context and ask one key question at a time.`)}>
          <span className="cw-foundation-state">{item?.reviewSuggested ? "Review suggested" : item?.confirmed ? item.document?.id!==item.confirmed.id ? "Changes to review" : "Confirmed" : item?.document ? "Draft to review" : "Ready to build"}</span>
          <strong>{f.name}</strong><span>{f.description}</span>
        </button>;
      })}</div>
      {!!state?.proposals.length && <div><h2>Updates to review</h2>{state.proposals.map(p=><BrandProposalCard key={p.id} proposal={p} onRefresh={async()=>{await load();}} />)}</div>}
      {!!state?.legacy.length && <details><summary>Previously accepted skill foundations</summary><p>These are preserved for review. They are not silently merged into your new brand documents.</p>{state.legacy.map(t=><p key={t.id}><a href={`/create?task=${t.id}`}>{t.title} →</a></p>)}</details>}
    </div>
    {selected && <Artifact key={selected.id} task={selected} versions={versions} busy={false} onRefresh={refreshDocument} onClose={close} />}
  </div>;
}
