import { createAdminClient } from "@/lib/supabase/admin";
import { planForPrice, verifyStripeSignature, type Plan } from "@/lib/billing";

type StripeObject = Record<string, any>;

export async function POST(request: Request) {
  const payload = await request.text();
  if (!verifyStripeSignature(payload, request.headers.get("stripe-signature"))) return Response.json({ error: "Invalid signature." }, { status: 400 });
  try {
    const event = JSON.parse(payload) as { id: string; type: string; data: { object: StripeObject } };
    const admin = createAdminClient();
    const { error: eventError } = await admin.from("billing_events").insert({ stripe_event_id: event.id, event_type: event.type });
    if (eventError?.code === "23505") return Response.json({ received: true });
    if (eventError) throw eventError;
    const object = event.data.object;
    if (event.type === "checkout.session.completed") {
      const userId = object.metadata?.user_id || object.subscription_details?.metadata?.user_id;
      if (userId && object.subscription) await admin.from("subscriptions").upsert({ user_id: userId, stripe_customer_id: object.customer, stripe_subscription_id: object.subscription, plan: (object.metadata?.plan || "pro") as Plan, status: "active" }, { onConflict: "user_id" });
    }
    if (event.type.startsWith("customer.subscription.")) {
      const item = object.items?.data?.[0];
      const userId = object.metadata?.user_id;
      const query = userId ? admin.from("subscriptions").update({ stripe_customer_id: object.customer, stripe_subscription_id: object.id, plan: planForPrice(item?.price?.id), status: object.status, current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null, cancel_at_period_end: Boolean(object.cancel_at_period_end) }).eq("user_id", userId) : admin.from("subscriptions").update({ plan: planForPrice(item?.price?.id), status: object.status, current_period_end: object.current_period_end ? new Date(object.current_period_end * 1000).toISOString() : null, cancel_at_period_end: Boolean(object.cancel_at_period_end) }).eq("stripe_subscription_id", object.id);
      await query;
    }
    return Response.json({ received: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 500 }); }
}
