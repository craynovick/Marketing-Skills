import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Custom skills for your team",
  description: "Cookbook skills are open source. Get in touch about custom skills for your team.",
};

export default function ContactPage() {
  return <main className="wrap prose pricing-page">
    <p className="eyebrow">BUILT FOR YOUR TEAM</p>
    <h1>Need custom skills for your team?</h1>
    <p className="lede">Cookbook skills are open source and free to install. For skills tailored to your team’s workflows, get in touch.</p>
    <p><a className="pricing-link" href="mailto:cray@truespectrummedia.com?subject=Custom%20skills%20for%20our%20team">Contact us</a></p>
    <p>Tell us about your team, the AI tools you use, and the work you want to improve.</p>
    <p><Link href="/#catalog">Browse the free skills</Link> · <Link href="/docs/install">Install guide</Link></p>
  </main>;
}
