import Link from "next/link";
import { redirect } from "next/navigation";
import { CookbookConnections } from "@/components/cookbook-connections";
import { integrationsEnabled } from "@/lib/integrations/service";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/sign-in?next=%2Fsettings");
  return <main className="wrap prose account-page settings-page">
    <p className="eyebrow">YOUR ACCOUNT</p><h1>Settings.</h1>
    <p>Manage how your AI apps access your Cookbook.</p>
    {integrationsEnabled() ? <CookbookConnections /> : <p>AI app connections are not enabled on this deployment yet.</p>}
    <div className="account-links"><Link href="/cookbook">My Cookbook</Link><Link href="/account">Account and billing</Link></div>
  </main>;
}
