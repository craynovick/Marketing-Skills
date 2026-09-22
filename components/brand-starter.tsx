"use client";
import { useState } from "react";

export const brandStarterPrompt = "Use cookbook-brand-context to build my shared brand brief. My website or brand description is [add it here]. Review what’s already in this project, research what you can with the tools available, and ask me only for the missing essentials. Separate confirmed facts from assumptions and let me review the brief before saving it.";

export function BrandStarter() {
  const [notice, setNotice] = useState("");
  return <section className="brand-starter" aria-label="Personalize your skills">
    <h2>Make the skills yours.</h2>
    <p>After installing, paste this into your AI app and add your website or a short description.</p>
    <blockquote>{brandStarterPrompt}</blockquote>
    <button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(brandStarterPrompt); setNotice("Copied. Add your brand details before sending."); }
      catch { setNotice("Select and copy the prompt above."); }
    }}>Copy prompt</button>
    <p className="brand-starter-note">Set up once per brand or project. All skills share one brief, and you can refine it in your AI app anytime. No Cookbook account required.</p>
    <span role="status">{notice}</span>
  </section>;
}
