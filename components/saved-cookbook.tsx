"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { requestJSON, messageOf } from "@/components/cookbook/types";
import { savedSkillFilename, savedSkillStatus, type SavedCookbookPage, type SavedSkill } from "@/lib/saved-cookbook";

export function SavedCookbook({ connectionsEnabled }: { connectionsEnabled: boolean }) {
  const [skills, setSkills] = useState<SavedSkill[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const load = useCallback(async (cursor: string | null = null) => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    try {
      const data = await requestJSON<SavedCookbookPage>(`/api/cookbook/saved${cursor ? `?before=${encodeURIComponent(cursor)}` : ""}`, { signal: request.signal, cache: "no-store" });
      if (request.signal.aborted) return;
      setSkills(current => cursor ? [...current, ...data.skills.filter(skill => !current.some(item => item.id === skill.id))] : data.skills);
      setNextCursor(data.nextCursor); setLoaded(true);
    } catch (failure) {
      if (request.signal.aborted) return;
      if (failure instanceof Error && "status" in failure && failure.status === 401) {
        window.location.replace("/sign-in?next=%2Fcookbook"); return;
      }
      setError(messageOf(failure));
    } finally { if (!request.signal.aborted) setBusy(false); }
  }, []);
  const reload = useCallback((cursor: string | null = null) => {
    setBusy(true); setError("");
    void load(cursor);
  }, [load]);
  useEffect(() => {
    // Initial loading state is set above; load only updates state after the request settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const { data: listener } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN") {
        controller.current?.abort(); setSkills([]); setLoaded(false); setNextCursor(null);
        reload();
      }
    });
    return () => { controller.current?.abort(); listener.subscription.unsubscribe(); };
  }, [load, reload]);

  function download(skill: SavedSkill) {
    if (!skill.document) return;
    try {
      const url = URL.createObjectURL(new Blob([skill.document.content], { type: "text/markdown;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = savedSkillFilename(skill);
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setError("Could not download this document. Please try again."); }
  }

  return <>
    <div className="saved-cookbook-heading"><div><p className="eyebrow">YOUR SAVED SKILLS</p><h1>My Cookbook.</h1><p>Your brand foundations and configured skills, ready to keep building or download.</p></div><Link className="cookbook-action cookbook-action-primary" href="/create">Create a skill</Link></div>
    {connectionsEnabled && <div className="saved-cookbook-connect"><p>Connect your AI app to use approved brand context with your existing Cookbook permissions. Drafts stay here for review.</p><Link className="cookbook-action" href="/settings">Connect your AI app</Link></div>}
    <section aria-label="Saved skills" aria-busy={busy}>
      {skills.length > 0 && <ul className="saved-skill-list">{skills.map(skill => <li className="saved-skill-row" key={skill.id}>
        <div><h2>{skill.title}</h2><p><span>{savedSkillStatus(skill)}</span><span aria-hidden="true"> · </span><time dateTime={skill.updated_at}>{new Date(skill.updated_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</time></p></div>
        <div className="saved-skill-actions"><Link className="cookbook-action" href={skill.foundation_key ? "/create?view=cookbook" : `/create?task=${skill.id}`} aria-label={`Open ${skill.title}`}>Open</Link><button className="cookbook-action" disabled={!skill.document} onClick={() => download(skill)} aria-label={`Download ${skill.title} as Markdown`}>Download .md</button></div>
      </li>)}</ul>}
      {busy && <p role="status">Loading saved skills…</p>}
      {error && <div className="saved-cookbook-error" role="alert"><p>{error}</p><button className="cookbook-action" disabled={busy} onClick={() => reload(loaded ? nextCursor : null)}>Try again</button></div>}
      {loaded && skills.length === 0 && !busy && !error && <div className="saved-cookbook-empty"><h2>Your Cookbook starts here.</h2><p>Create your first skill or brand foundation. Your saved work will appear here.</p><Link className="cookbook-action cookbook-action-primary" href="/create">Create your first skill</Link></div>}
      {nextCursor && !error && <button className="cookbook-action saved-load-more" disabled={busy} onClick={() => reload(nextCursor)}>Load more</button>}
    </section>
  </>;
}
