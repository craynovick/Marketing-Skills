"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setHasRecoverySession(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setHasRecoverySession(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setStatus("");
    try { const { error } = await createClient().auth.updateUser({ password }); if (error) throw error; setStatus("Password updated. You can now open your Cookbook."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not update your password."); }
    finally { setSaving(false); }
  };

  if (hasRecoverySession === null) return <p role="status">Checking your reset link…</p>;
  if (!hasRecoverySession) return <p role="alert">This reset link is invalid or expired. Request a new one from the sign-in page.</p>;
  return <form className="sign-in-form" onSubmit={submit}><label>New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></label><button disabled={saving}>{saving ? "Saving…" : "Update password"}</button>{status && <p role="status">{status}</p>}</form>;
}
