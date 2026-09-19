import Link from "next/link";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function UpdatePasswordPage() {
  return <main className="auth-page">
    <section className="auth-card reset-card" aria-labelledby="update-password-title">
      <div className="auth-card__intro">
        <p className="auth-kicker">UPDATE YOUR ACCOUNT</p>
        <div className="auth-card__copy">
          <h1 id="update-password-title">Choose a new password.</h1>
          <p>Your reset link is ready. Set a new password to get back into your Cookbook.</p>
        </div>
      </div>
      <div className="reset-card__form">
        <UpdatePasswordForm />
        <Link className="auth-back-link" href="/sign-in">← Back to sign in</Link>
      </div>
    </section>
  </main>;
}
