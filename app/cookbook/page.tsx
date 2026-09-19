import { redirect } from "next/navigation";
import { SavedCookbook } from "@/components/saved-cookbook";
import { createClient } from "@/lib/supabase/server";
import { integrationsEnabled } from "@/lib/integrations/service";

export const metadata = { title: "My Cookbook" };
export const dynamic = "force-dynamic";

export default async function CookbookPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/sign-in?next=%2Fcookbook");
  return <main className="wrap saved-cookbook-page"><SavedCookbook connectionsEnabled={integrationsEnabled()} /></main>;
}
