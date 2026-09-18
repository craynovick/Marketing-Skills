import { createClient } from "@/lib/supabase/server";
import { appUrl, formBody, priceForPlan, stripeRequest, type Plan } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in before choosing a plan." }, { status: 401 });
    const body = await request.json() as { plan?: Plan };
    if (body.plan !== "pro" && body.plan !== "team") return Response.json({ error: "Choose a valid paid plan." }, { status: 400 });
    const { data: existing } = await supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    const customer = existing?.stripe_customer_id || (await stripeRequest<{ id: string }>("customers", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody({ email: user.email || "", "metadata[user_id]": user.id }) })).id;
    if (!existing?.stripe_customer_id) await supabase.from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customer }, { onConflict: "user_id" });
    const base = appUrl(request);
    const session = await stripeRequest<{ url: string }>("checkout/sessions", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody({ mode: "subscription", customer, "line_items[0][price]": priceForPlan(body.plan), "line_items[0][quantity]": "1", success_url: `${base}/account?checkout=success`, cancel_url: `${base}/pricing?checkout=canceled`, "metadata[user_id]": user.id, "metadata[plan]": body.plan, "subscription_data[metadata][user_id]": user.id, "subscription_data[metadata][plan]": body.plan }) });
    return Response.json({ url: session.url });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not start checkout." }, { status: 400 }); }
}
