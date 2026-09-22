"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser";

export function AuthControls() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<"navigation" | "account" | null>(null);
  const [notice, setNotice] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const navigationButton = useRef<HTMLButtonElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

  const [previousPath, setPreviousPath] = useState(pathname);
  if (previousPath !== pathname) { setPreviousPath(pathname); setOpen(null); }

  useEffect(() => {
    let active = true;
    let authChanged = false;
    let unsubscribe: (() => void) | undefined;
    async function initialize() {
      try {
        const supabase = createClient();
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          authChanged = true;
          if (active) { setUser(session?.user ?? null); setReady(true); setOpen(null); }
        });
        unsubscribe = () => listener.subscription.unsubscribe();
        const { data } = await supabase.auth.getUser();
        if (active && !authChanged) { setUser(data.user); setReady(true); }
      } catch { if (active) setReady(true); }
    }
    void initialize();
    return () => { active = false; unsubscribe?.(); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(null);
        (open === "account" ? accountButton : navigationButton).current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, [open]);

  async function signOut() {
    setSigningOut(true); setNotice("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      window.location.assign("/");
    } catch { setNotice("Could not sign out. Please retry."); setSigningOut(false); }
  }
  const rawAvatar = user?.user_metadata?.avatar_url;
  const avatar = typeof rawAvatar === "string" && /^https?:\/\//.test(rawAvatar) && rawAvatar !== failedAvatar ? rawAvatar : null;
  return <div className="header-controls" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(null);
  }}>
    <button ref={navigationButton} className="navigation-toggle" aria-label="Navigation" aria-expanded={open === "navigation"} aria-controls="primary-navigation" onClick={() => setOpen(open === "navigation" ? null : "navigation")}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>
    <div id="primary-navigation" className={`primary-navigation${open === "navigation" ? " is-open" : ""}`} onClick={() => setOpen(null)}>
      <Link href="/#catalog">Skills</Link>
      <Link href="/docs">Docs</Link><Link href="/about">About</Link>
      <Link href="/contact">Contact — Need custom skills?</Link>
    </div>
    {ready && user && <div className="header-account-slot">
        <button ref={accountButton} className="account-toggle" aria-label="Account menu" aria-expanded={open === "account"} aria-controls="account-navigation" onClick={() => setOpen(open === "account" ? null : "account")}>
          {avatar ? <Image src={avatar} alt="" width={32} height={32} unoptimized onError={() => setFailedAvatar(avatar)} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>}
        </button>
        {open === "account" && <div id="account-navigation" className="account-dropdown">
          <p className="account-identity">{user.email}</p>
          <Link href="/account" onClick={() => setOpen(null)}>Account</Link>
          <Link href="/create?saved=1" onClick={() => setOpen(null)}>Saved brand packs</Link>
          <Link href="/settings" onClick={() => setOpen(null)}>Settings</Link>
          <button disabled={signingOut} onClick={() => void signOut()}>{signingOut ? "Signing out…" : "Sign out"}</button>
          {notice && <p role="alert">{notice}</p>}
        </div>}
    </div>}
  </div>;
}
