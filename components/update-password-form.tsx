"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setStatus("");
    try { const { error } = await createClient().auth.updateUser({ password }); if (error) throw error; setStatus("Password updated. You can now open your Cookbook."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Could not update your password."); }
    finally { setSaving(false); }
  };
  return <form className="sign-in-form" onSubmit={submit}><label>New password<input required minLength={6} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 6 characters" /></label><button disabled={saving}>{saving ? "Saving…" : "Update password"}</button>{status && <p role="status">{status}</p>}</form>;
}
