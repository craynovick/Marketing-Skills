import Link from "next/link";
import { PortalButton } from "@/components/billing-actions";
import { createClient } from "@/lib/supabase/server";
import { plans, type Plan } from "@/lib/billing";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="wrap prose account-page"><p className="eyebrow">YOUR ACCOUNT</p><h1>Sign in to manage your plan.</h1><Link className="pricing-link" href="/sign-in">Sign in</Link></main>;
  const { data } = await supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end").eq("user_id", user.id).maybeSingle();
  const plan = (data?.plan || "free") as Plan;
  const details = plans[plan];
  return <main className="wrap prose account-page"><p className="eyebrow">YOUR ACCOUNT</p><h1>Account and billing.</h1><div className="account-card"><div><p className="eyebrow">CURRENT PLAN</p><h2>{details.name}</h2><p>{user.email}</p><p>{data?.status && data.status !== "none" ? `Subscription status: ${data.status}.` : "You are on the free plan."}</p></div>{plan === "free" ? <Link className="pricing-link" href="/pricing">View plans</Link> : <PortalButton />}</div><div className="account-links"><Link href="/cookbook">Open your Cookbook</Link><Link href="/">Back to the library</Link></div></main>;
}
