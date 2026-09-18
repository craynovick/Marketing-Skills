"use client";

import { useState } from "react";
import type { Plan } from "@/lib/billing";

export function CheckoutButton({ plan, label }: { plan: Exclude<Plan, "free">; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const checkout = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || "Could not start checkout.");
      window.location.assign(result.url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not start checkout."); setBusy(false); }
  };
  return <div className="billing-action"><button onClick={checkout} disabled={busy}>{busy ? "Opening checkout…" : label}</button>{error && <small role="alert">{error}</small>}</div>;
}

export function PortalButton() {
  const [busy, setBusy] = useState(false);
  const openPortal = async () => {
    setBusy(true);
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const result = await response.json();
    if (response.ok && result.url) window.location.assign(result.url);
    else setBusy(false);
  };
  return <button className="secondary" onClick={openPortal} disabled={busy}>{busy ? "Opening billing…" : "Manage billing"}</button>;
}
