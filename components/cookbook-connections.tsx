'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { scopes } from '@/lib/integrations/constants';
type Connection = {id:string;name:string;scopes:string[];expires_at:string;revoked_at:string|null};
export function CookbookConnections() {
  const [connections,setConnections]=useState<Connection[]>([]),[name,setName]=useState('My AI app'),[client,setClient]=useState('codex');
  const [selected,setSelected]=useState<string[]>(['context:read','foundations:write']);
  const [key,setKey]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  async function load() {const response=await fetch('/api/cookbook/connections');const data=await response.json();if(!response.ok)throw new Error(data.error);return data.connections as Connection[];}
  useEffect(()=>{let active=true;void load().then(data=>{if(active)setConnections(data);}).catch(e=>{if(active)setNotice(e.message);});return()=>{active=false;};},[]);
  async function change(method:string,body:unknown) {
    setBusy(true);setNotice('');setKey('');
    try {const response=await fetch('/api/cookbook/connections',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error);if(data.key)setKey(data.key);setConnections(await load());}
    catch(error){setNotice(error instanceof Error?error.message:'Could not update the connection.');}finally{setBusy(false);}
  }
  return <section className="account-card cookbook-connections"><h2>Connect your AI app</h2>
    <p>Use Cookbook recipes and your approved brand context in your own AI app. Brand changes wait for your review.</p>
    <label>App <select value={client} onChange={e=>setClient(e.target.value)}><option value="codex">Codex</option><option value="claude-code">Claude Code</option><option value="manual">Other MCP client</option></select></label>
    <label>Connection name <input value={name} maxLength={80} onChange={e=>setName(e.target.value)} /></label>
    <fieldset><legend>Permissions</legend>{scopes.map(scope=><label key={scope}><input type="checkbox" checked={selected.includes(scope)} onChange={e=>setSelected(current=>e.target.checked?[...current,scope]:current.filter(s=>s!==scope))}/>{{'context:read':'Read brand context and saved work','foundations:write':'Propose foundation changes','artifacts:write':'Save deliverables (paid hosting)'}[scope]}</label>)}</fieldset>
    <button disabled={busy||!name.trim()||!selected.length} onClick={()=>void change('POST',{name,scopes:selected})}>{busy?'Saving…':'Create connection key'}</button>
    {key && <div role="status"><p>Copy this key now. It is shown only once and expires in 90 days. Paste it into the installer’s hidden prompt, not into your AI conversation.</p><input aria-label="New connection key" readOnly value={key} onFocus={e=>e.target.select()}/><button onClick={()=>void navigator.clipboard.writeText(key).then(()=>setNotice('Key copied.')).catch(()=>setNotice('Select and copy the key manually.'))}>Copy key</button><button onClick={()=>setKey('')}>Hide key</button></div>}
    <p><Link href="/docs/connect">Install the Cookbook connector</Link>, then run:</p>
    <pre>{client==='manual'?'cookbook connect --client manual':`cookbook connect --client ${client}`}</pre>
    <p>The command asks for your key, checks your connection, and registers Cookbook. Restart your AI app if required. <Link href="/docs/self-host">Self-hosting instructions</Link></p>
    {notice && <p role="status">{notice}</p>}
    <h3>Your connections</h3>{connections.length===0?<p>No connections yet.</p>:<ul>{connections.map(c=><li key={c.id}><strong>{c.name}</strong> — {c.revoked_at?'Revoked':`Expires ${new Date(c.expires_at).toLocaleDateString()}`} {!c.revoked_at&&<button disabled={busy} onClick={()=>void change('DELETE',{id:c.id})}>Revoke</button>}</li>)}</ul>}
    <p>To replace a key, create a new connection, reconnect your app, then revoke the old one.</p>
  </section>;
}
export function SetupAllowance() {
  const [state,setState]=useState<{successes:number;remaining:number;completed_at:string|null;hostname:string|null;paid:boolean}|null>(null),[notice,setNotice]=useState('');
  useEffect(()=>{void fetch('/api/cookbook/setup').then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);setState(d);}).catch(e=>setNotice(e.message));},[]);
  async function complete() {try{const r=await fetch('/api/cookbook/setup',{method:'POST'});const d=await r.json();if(!r.ok)throw new Error(d.error);setState(s=>s?{...s,completed_at:new Date().toISOString()}:s);}catch(e){setNotice(e instanceof Error?e.message:'Could not complete setup.');}}
  return <section className="account-card cookbook-setup"><h2>Website-assisted foundation setup</h2>{state&&<><p>{state.paid?'Your paid website allowance applies.':state.completed_at?'Setup marked complete.':`${state.remaining} successful scans remaining, including any unused initial scan.`} {state.hostname&&`Site: ${state.hostname}`}</p><p>Follow-up scans fill evidence gaps in unfinished foundations. You can always improve foundations manually or through your connected AI app.</p>{!state.completed_at&&<button onClick={()=>void complete()}>Mark setup complete and finish free scans</button>}</>}{notice&&<p role="status">{notice}</p>}</section>;
}
