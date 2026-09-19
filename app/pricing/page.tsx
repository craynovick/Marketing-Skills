import Link from "next/link";
import { CheckoutButton } from "@/components/billing-actions";
import { plans, type Plan } from "@/lib/billing";

export default function PricingPage() {
  return <main className="wrap prose pricing-page">
    <p className="eyebrow">SIMPLE, HONEST PLANS</p>
    <h1>Make your marketing taste like you.</h1>
    <p className="lede">Start free, then upgrade when your Cookbook becomes part of the team’s operating system.</p>
    <div className="pricing-grid">
      {(Object.entries(plans) as [Plan, typeof plans[Plan]][]).map(([plan, details]) => <article className={`pricing-card ${plan === "pro" ? "featured" : ""}`} key={plan}>
        <p className="eyebrow">{details.name}</p><h2>{details.price}</h2><p>{details.description}</p>
        <ul>{details.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        {plan === "free" ? <Link className="pricing-link" href="/create">Start free</Link> : <CheckoutButton plan={plan} label={`Choose ${details.name}`} />}
      </article>)}
    </div>
    <p className="pricing-note">Subscriptions are handled securely by Stripe. You can cancel or update payment details from your account.</p>
  </main>;
}
