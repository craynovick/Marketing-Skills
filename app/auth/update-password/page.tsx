import Link from "next/link";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default function UpdatePasswordPage() { return <main className="wrap prose"><p className="eyebrow">UPDATE YOUR ACCOUNT</p><h1>Choose a new password.</h1><p className="lede">Your reset link is ready. Set a new password to get back into your Cookbook.</p><UpdatePasswordForm /><p><Link href="/sign-in">Back to sign in</Link></p></main>; }
