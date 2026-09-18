import { SignInForm } from "@/components/sign-in-form";
import { Suspense } from "react";
export default function SignInPage() { return <main className="wrap prose"><p className="eyebrow">SYNC YOUR COOKBOOK</p><h1>Save your recipe.</h1><p className="lede">Use your email and password to keep one account-owned Cookbook across browsers.</p><Suspense><SignInForm /></Suspense></main>; }
