import { createClient } from "@/lib/supabase/server";
import { appUrl, formBody, stripeRequest } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Sign in to manage billing." }, { status: 401 });
    const { data } = await supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (!data?.stripe_customer_id) return Response.json({ error: "No billing account exists yet." }, { status: 404 });
    const portal = await stripeRequest<{ url: string }>("billing_portal/sessions", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody({ customer: data.stripe_customer_id, return_url: `${appUrl(request)}/account` }) });
    return Response.json({ url: portal.url });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not open billing portal." }, { status: 400 }); }
}
