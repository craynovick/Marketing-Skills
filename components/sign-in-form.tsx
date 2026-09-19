"use client";

import { safeReturnPath } from "@/lib/safe-return-path";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { hasCookbookContent, normalizeCookbook, type CookbookProfile } from "@/lib/cookbook";

const storageKey = "brand-cookbook-profile";

function readLocalCookbook(): CookbookProfile | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const profile = normalizeCookbook(JSON.parse(raw));
    return hasCookbookContent(profile) ? profile : null;
  } catch { return null; }
}

export function SignInForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in"); const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false); const [status, setStatus] = useState(""); const [sending, setSending] = useState(false); const [canResend, setCanResend] = useState(false);
  const [emailError, setEmailError] = useState(""); const [passwordError, setPasswordError] = useState("");
  const isSignUp = mode === "sign-up";
  const next = safeReturnPath(params.get("next"));
  const redirectUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  // Recovery links establish the session in the browser. Keeping the reset
  // destination direct avoids losing the recovery session in the server
  // callback before the update form can use it.
  const resetRedirectUrl = () => `${window.location.origin}/auth/update-password`;
  const validateEmail = () => { const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); setEmailError(valid ? "" : "Enter a valid email address."); return valid; };
  const validatePassword = () => { const valid = password.length >= 8; setPasswordError(valid ? "" : "Use at least 8 characters."); return valid; };

  const syncLocalCookbook = async () => {
    const local = readLocalCookbook(); if (!local) return;
    const response = await fetch("/api/cookbook", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(local) });
    if (!response.ok) throw new Error("Your account was created, but your local Cookbook could not be synced yet.");
    window.localStorage.removeItem(storageKey);
  };

  const continueWithGoogle = async () => {
    setSending(true); setStatus("");
    try { const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectUrl() } }); if (error) throw error; }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not continue with Google."); setSending(false); }
  };

  const resendConfirmation = async () => {
    if (!email || !validateEmail()) return; setSending(true); setStatus("");
    try { const { error } = await createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectUrl() } }); if (error) throw error; setStatus("A new confirmation email is on its way. Check your spam folder too."); setCanResend(false); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not resend the confirmation email."); } finally { setSending(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!validateEmail() || !validatePassword()) return; setSending(true); setStatus("");
    try {
      const supabase = createClient();
      if (!isSignUp) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) { if (error.message.toLowerCase().includes("email not confirmed")) setCanResend(true); throw error; } await syncLocalCookbook(); window.location.assign(next); return; }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } }); if (error) throw error;
      if (data.session) { await syncLocalCookbook(); window.location.assign(next); return; }
      setCanResend(true); setStatus("Check your email to confirm the account, then sign in with this password.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not complete sign-in."); } finally { setSending(false); }
  };

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault(); if (!validateEmail()) return; setSending(true); setStatus("");
    try { const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: resetRedirectUrl() }); if (error) throw error; setStatus("If an account exists for that address, a password reset email is on its way."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not send the password reset email."); } finally { setSending(false); }
  };

  const confirmationError = params.get("error");
  return <form className="sign-in-form" onSubmit={resetting ? requestReset : submit}>
    {!resetting && <div className="auth-mode" role="tablist" aria-label="Account access mode"><button type="button" role="tab" aria-selected={!isSignUp} className={!isSignUp ? "active" : ""} onClick={() => { setMode("sign-in"); setStatus(""); }}>Sign In</button><button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? "active" : ""} onClick={() => { setMode("sign-up"); setStatus(""); }}>Create Account</button></div>}
    {!resetting && <><button type="button" className="google-button" onClick={continueWithGoogle} disabled={sending}><span className="google-mark" aria-hidden="true">G</span>{sending ? "Connecting…" : "Continue with Google"}</button><div className="auth-divider"><span>or continue with email</span></div><div className="auth-heading"><h2>{isSignUp ? "Save your recipe" : "Welcome back"}</h2><p>{isSignUp ? "Create an account to keep your cookbook synced across browsers." : "Sign in to access your cookbook."}</p></div></>}
    <label htmlFor="auth-email">Email address<input id="auth-email" required type="email" autoComplete="email" value={email} onChange={event => { setEmail(event.target.value); if (emailError) setEmailError(""); }} onBlur={validateEmail} placeholder="you@example.com" aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "email-error" : undefined} />{emailError && <span className="field-error" id="email-error">{emailError}</span>}</label>
    {!resetting && <label htmlFor="auth-password"><span className="password-label"><span>Password</span>{!isSignUp && <button type="button" className="forgot-link" onClick={() => { setResetting(true); setStatus(""); }}>Forgot password?</button>}</span><span className="password-input"><input id="auth-password" required type={showPassword ? "text" : "password"} minLength={8} autoComplete={isSignUp ? "new-password" : "current-password"} value={password} onChange={event => { setPassword(event.target.value); if (passwordError) setPasswordError(""); }} onBlur={validatePassword} placeholder="At least 8 characters" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? "password-error" : undefined} /><button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></span>{passwordError && <span className="field-error" id="password-error">{passwordError}</span>}</label>}
    <button className="submit-button" disabled={sending}>{sending ? <><span className="spinner" aria-hidden="true" />{isSignUp ? "Creating account…" : "Signing in…"}</> : resetting ? "Send reset email" : isSignUp ? "Create Account" : "Sign In"}</button>
    {isSignUp && !resetting && <p className="legal-copy">By continuing, you agree to our <a href="/docs/terms">Terms of Service</a> and <a href="/docs/privacy">Privacy Policy</a>.</p>}
    {confirmationError && <p role="alert" className="form-message error">That confirmation link has expired or is invalid. Create the account again or sign in below.</p>}
    {status && <p role={status.startsWith("Check your email") || status.startsWith("A new confirmation") ? "status" : "alert"} className="form-message">{status}</p>}
    {canResend && <button type="button" className="text-action" onClick={resendConfirmation} disabled={sending}>Resend confirmation email</button>}
    {resetting && <button type="button" className="text-action" onClick={() => { setResetting(false); setStatus(""); }}>Back to sign in</button>}
  </form>;
}
