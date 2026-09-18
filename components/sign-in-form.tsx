"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignInForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [resetting, setResetting] = useState(false);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const redirectUrl = () => `${window.location.origin}/auth/callback?next=/cookbook`;
  const resetRedirectUrl = () => `${window.location.origin}/auth/callback?next=/auth/update-password`;

  const resendConfirmation = async () => {
    if (!email) { setStatus("Enter your email address first."); return; }
    setSending(true); setStatus("");
    try {
      const { error } = await createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectUrl() } });
      if (error) throw error;
      setStatus("A new confirmation email is on its way. Check your spam folder too."); setCanResend(false);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not resend the confirmation email."); }
    finally { setSending(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSending(true); setStatus("");
    try {
      const supabase = createClient();
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { if (error.message.toLowerCase().includes("email not confirmed")) setCanResend(true); throw error; }
        window.location.assign("/cookbook"); return;
      }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } });
      if (error) throw error;
      if (data.session) { window.location.assign("/cookbook"); return; }
      setCanResend(true); setStatus("Check your email to confirm the account, then sign in with this password.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not complete sign-in."); }
    finally { setSending(false); }
  };

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault(); if (!email) { setStatus("Enter your email address first."); return; }
    setSending(true); setStatus("");
    try { const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: resetRedirectUrl() }); if (error) throw error; setStatus("If an account exists for that address, a password reset email is on its way."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not send the password reset email."); }
    finally { setSending(false); }
  };

  const confirmationError = params.get("error");
  return <form className="sign-in-form" onSubmit={resetting ? requestReset : submit}>
    {!resetting && <div className="auth-mode"><button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => { setMode("sign-in"); setStatus(""); }}>Sign in</button><button type="button" className={mode === "sign-up" ? "active" : ""} onClick={() => { setMode("sign-up"); setStatus(""); }}>Create account</button></div>}
    <label>Email address<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label>
    {!resetting && <label>Password<input required type="password" minLength={6} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>}
    <button disabled={sending}>{sending ? "Working…" : resetting ? "Send reset email" : mode === "sign-in" ? "Sign in" : "Create account"}</button>
    {confirmationError && <p role="alert">That confirmation link has expired or is invalid. Create the account again or sign in below.</p>}
    {status && <p role={status.startsWith("Check your email") || status.startsWith("A new confirmation") ? "status" : "alert"}>{status}</p>}
    {canResend && <button type="button" className="resend-confirmation" onClick={resendConfirmation} disabled={sending}>Resend confirmation email</button>}
    {!resetting && mode === "sign-in" && <button type="button" className="resend-confirmation" onClick={() => { setResetting(true); setStatus(""); }}>Forgot password?</button>}
    {resetting && <button type="button" className="resend-confirmation" onClick={() => { setResetting(false); setStatus(""); }}>Back to sign in</button>}
  </form>;
}
