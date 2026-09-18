import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription, isPaidPlan, type Plan, type SubscriptionStatus } from "@/lib/billing";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ plan: "free", status: "none", canAnalyze: true });
    const { data, error } = await supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    const plan = (data?.plan || "free") as Plan;
    const status = (data?.status || "none") as SubscriptionStatus;
    return Response.json({ plan, status, currentPeriodEnd: data?.current_period_end || null, cancelAtPeriodEnd: Boolean(data?.cancel_at_period_end), canAnalyze: isPaidPlan(plan) && hasActiveSubscription(status) });
  } catch {
    return Response.json({ plan: "free", status: "none", canAnalyze: true });
  }
}
