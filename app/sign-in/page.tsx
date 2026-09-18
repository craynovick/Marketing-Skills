import { SignInForm } from "@/components/sign-in-form";
import { Suspense } from "react";
export default function SignInPage() { return <main className="wrap prose"><p className="eyebrow">SYNC YOUR COOKBOOK</p><h1>Save your recipe.</h1><p className="lede">Sign in with a magic link to keep one account-owned Cookbook across browsers.</p><Suspense><SignInForm /></Suspense></main>; }
