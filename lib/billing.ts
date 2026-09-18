import { createHmac, timingSafeEqual } from "node:crypto";

export type Plan = "free" | "pro" | "team";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "unpaid" | "paused" | "none";

export const plans = {
  free: { name: "Free", price: "$0", description: "Build your first reusable marketing Cookbook.", features: ["One website analysis", "Manual Cookbook editing", "Library access"] },
  pro: { name: "Pro", price: "$29/mo", description: "Keep your brand context current and move faster.", features: ["Unlimited website analyses", "Saved Cookbook sync", "Full guided conversations"] },
  team: { name: "Team", price: "$79/mo", description: "Give a small marketing team one shared source of truth.", features: ["Everything in Pro", "Shared team workspace", "Priority support"] },
} as const;

export function isPaidPlan(plan: Plan) { return plan === "pro" || plan === "team"; }
export function hasActiveSubscription(status: SubscriptionStatus) { return status === "active" || status === "trialing"; }

export function planForPrice(priceId: string | null | undefined): Plan {
  if (priceId && priceId === process.env.STRIPE_PRICE_TEAM) return "team";
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "free";
}

export function priceForPlan(plan: Exclude<Plan, "free">) {
  const priceId = plan === "team" ? process.env.STRIPE_PRICE_TEAM : process.env.STRIPE_PRICE_PRO;
  if (!priceId) throw new Error(`Stripe price is not configured for ${plan}.`);
  return priceId;
}

function stripeKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Billing is not configured yet.");
  return key;
}

export async function stripeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    ...init,
    headers: { Authorization: `Basic ${Buffer.from(`${stripeKey()}:`).toString("base64")}`, ...(init.headers || {}) },
  });
  const body = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || "Stripe request failed.");
  return body;
}

export function formBody(values: Record<string, string>) {
  return new URLSearchParams(values).toString();
}

export function appUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}

export function verifyStripeSignature(payload: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const parts = signature.split(",");
  const timestamp = parts.find(part => part.startsWith("t="))?.slice(2);
  const digest = parts.find(part => part.startsWith("v1="))?.slice(3);
  if (!timestamp || !digest || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const digestBuffer = Buffer.from(digest, "utf8");
  return expectedBuffer.length === digestBuffer.length && timingSafeEqual(expectedBuffer, digestBuffer);
}
