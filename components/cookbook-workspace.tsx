"use client";

import { useEffect, useState } from "react";

const storageKey = "brand-cookbook-profile";
const freeAnalysisKey = "brand-cookbook-free-analysis-used";
export type CookbookProfile = { company: string; website: string; audience: string; positioning: string; offer: string; voice: string; pillars: string; formats: string; proof: string; constraints: string };
const emptyProfile: CookbookProfile = { company: "", website: "", audience: "", positioning: "", offer: "", voice: "", pillars: "", formats: "", proof: "", constraints: "" };

const resizeTextarea = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
};

export function CookbookWorkspace() {
  const [profile, setProfile] = useState<CookbookProfile>(emptyProfile);
  const [saved, setSaved] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [freeUsed, setFreeUsed] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  useEffect(() => { try { const stored = window.localStorage.getItem(storageKey); if (stored) { setProfile({ ...emptyProfile, ...JSON.parse(stored) }); setAnalyzed(true); } setFreeUsed(window.localStorage.getItem(freeAnalysisKey) === "true"); } catch { window.localStorage.removeItem(storageKey); } }, []);
  useEffect(() => { document.querySelectorAll<HTMLTextAreaElement>(".cookbook-fields textarea").forEach(resizeTextarea); }, [analyzed, profile]);
  const update = (key: keyof CookbookProfile, value: string) => setProfile(current => ({ ...current, [key]: value }));
  const analyze = async () => {
    if (!profile.website.trim()) { setAnalysisError("Enter a public website URL first."); return; }
    if (freeUsed) { setAnalysisError("Your free website analysis has already been used. You can still add and save your brand context manually."); return; }
    setAnalyzing(true); setAnalysisError("");
    try {
      const response = await fetch("/api/cookbook/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ website: profile.website }) });
      const result = await response.json() as { profile?: CookbookProfile; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error || "Could not analyze that website.");
      setProfile(current => ({ ...current, ...result.profile, website: profile.website })); setAnalyzed(true); setFreeUsed(true); window.localStorage.setItem(freeAnalysisKey, "true");
    } catch (error) { setAnalysisError(error instanceof Error ? error.message : "Could not analyze that website."); }
    finally { setAnalyzing(false); }
  };
  const save = () => { try { window.localStorage.setItem(storageKey, JSON.stringify(profile)); setSaved(true); } catch { setSaved(false); } };
  const clear = () => { window.localStorage.removeItem(storageKey); setProfile(emptyProfile); setAnalyzed(false); setSaved(false); };
  return <section className="cookbook-workspace">
    <div className="cookbook-intro"><p className="eyebrow">YOUR REUSABLE CONTEXT</p><h2>Start with your website.</h2><p>We’ll turn your public site into a first draft of the brand context your marketing workflows can reuse. Review every draft before saving.</p></div>
    <div className={`cookbook-analyze${analyzed ? " is-complete" : ""}`}><label htmlFor="cookbook-website">Company website</label><div className="analyze-row"><input id="cookbook-website" inputMode="url" value={profile.website} onChange={event => update("website", event.target.value)} placeholder="yourcompany.com" /><button onClick={analyze} disabled={analyzing || freeUsed}>{analyzing ? "Cooking your book…" : freeUsed ? "Free analysis used" : "Analyze website"}</button></div><small>{freeUsed ? "Add or edit your context below, then save your Cookbook." : "One free AI-powered analysis. Public sites only; your draft stays editable."}</small>{analysisError && <p role="alert">{analysisError}</p>}</div>
    {analyzed && <><div className="cookbook-review"><p className="eyebrow">REVIEW YOUR DRAFT</p><p>These fields are starting points, not facts. Edit anything that does not sound like you before saving.</p></div><div className="cookbook-fields"><label>Company or brand<textarea rows={1} value={profile.company} onChange={event => { update("company", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="Acme" /></label><span aria-hidden="true"/><label className="full">Primary audience<textarea rows={1} value={profile.audience} onChange={event => { update("audience", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="Who you serve, their role, and their main need" /></label><label className="full">Offer and positioning<textarea rows={1} value={profile.offer} onChange={event => { update("offer", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="What you offer and why it matters" /></label><label className="full">Positioning statement<textarea rows={1} value={profile.positioning} onChange={event => { update("positioning", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="For [audience] who [need], we are [category] that [difference]" /></label><label className="full">Voice and style<textarea rows={1} value={profile.voice} onChange={event => { update("voice", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="Tone, words to use or avoid, and examples" /></label><label className="full">Content pillars<textarea rows={1} value={profile.pillars} onChange={event => { update("pillars", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="3–5 buyer questions you answer well" /></label><label className="full">Formats and channels<textarea rows={1} value={profile.formats} onChange={event => { update("formats", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="Preferred formats, channels, and what to avoid" /></label><label className="full">Approved proof<textarea rows={1} value={profile.proof} onChange={event => { update("proof", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="Evidence, metrics, examples, or sources you can use" /></label><label className="full">Constraints and review rules<textarea rows={1} value={profile.constraints} onChange={event => { update("constraints", event.target.value); resizeTextarea(event.currentTarget); }} placeholder="Privacy, approval, legal, brand, or channel requirements" /></label></div><div className="cookbook-actions"><button onClick={save}>Save Cookbook</button><button className="secondary" onClick={clear}>Start over</button>{saved && <><span>Saved on this device.</span><a href="/#catalog">Use it in a skill →</a></>}</div></>}
  </section>;
}
