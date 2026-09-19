"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmationError, setConfirmationError] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setHasRecoverySession(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setHasRecoverySession(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const validatePassword = () => {
    const valid = password.length >= 8;
    setPasswordError(valid ? "" : "Use at least 8 characters.");
    return valid;
  };

  const validateConfirmation = () => {
    const valid = password === confirmation;
    setConfirmationError(valid ? "" : "Passwords do not match.");
    return valid;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const isPasswordValid = validatePassword();
    const isConfirmationValid = validateConfirmation();
    if (!isPasswordValid || !isConfirmationValid) return;
    setSaving(true); setStatus("");
    try { const { error } = await createClient().auth.updateUser({ password }); if (error) throw error; setStatus("Password updated. You can now open your Cookbook."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not update your password."); }
    finally { setSaving(false); }
  };

  if (hasRecoverySession === null) return <div className="reset-form-state" role="status"><span className="spinner" aria-hidden="true" />Checking your reset link…</div>;
  if (!hasRecoverySession) return <div className="reset-form-state reset-form-state--error" role="alert"><strong>This reset link is invalid or expired.</strong><span>Request a new password reset link from the sign-in page.</span></div>;

  return <form className="sign-in-form reset-form" onSubmit={submit}>
    <div className="auth-heading">
      <h2>Set your password</h2>
      <p>Use at least 8 characters. A longer, unique password is best.</p>
    </div>
    <label htmlFor="new-password">New password
      <span className="password-input">
        <input id="new-password" required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={event => { setPassword(event.target.value); if (passwordError) setPasswordError(""); if (confirmationError && event.target.value === confirmation) setConfirmationError(""); }} onBlur={validatePassword} placeholder="At least 8 characters" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? "new-password-error" : undefined} />
        <button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
      </span>
      {passwordError && <span className="field-error" id="new-password-error">{passwordError}</span>}
    </label>
    <label htmlFor="confirm-password">Confirm new password
      <input id="confirm-password" required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={event => { setConfirmation(event.target.value); if (confirmationError) setConfirmationError(""); }} onBlur={validateConfirmation} placeholder="Enter it again" aria-invalid={Boolean(confirmationError)} aria-describedby={confirmationError ? "confirm-password-error" : undefined} />
      {confirmationError && <span className="field-error" id="confirm-password-error">{confirmationError}</span>}
    </label>
    <button className="submit-button" disabled={saving}>{saving && <span className="spinner" aria-hidden="true" />}{saving ? "Updating password…" : "Update password"}</button>
    {status && <p role="status" className="form-message form-message--success">{status} <a href="/create">Open Cookbook →</a></p>}
  </form>;
}
