import { SignInForm } from "@/components/sign-in-form";
import { Suspense } from "react";

export default function SignInPage() {
  return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title"><div className="auth-card__intro"><p className="auth-kicker">YOUR COOKBOOK, EVERYWHERE</p><div className="auth-card__copy"><h1 id="auth-title">A smarter place for your best work.</h1><p>Keep your recipes, brand context, and creative thinking close at hand.</p></div></div><Suspense fallback={<div className="auth-form-loading" aria-label="Loading sign in form" />}><SignInForm /></Suspense></section></main>;
}
