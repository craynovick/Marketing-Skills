import { redirect } from "next/navigation";
import { BrandPackSetup } from "@/components/brand-pack-setup";
import { brandPacksEnabled } from "@/lib/brand-pack-server";
import { validMode, validWorkflow } from "@/lib/cookbook-experience";
import { CookbookChatWorkspace } from "@/components/cookbook-chat-workspace";

import { cookbookV2Enabled } from "@/lib/cookbook-features";

export const metadata = { title: { absolute: "Saved work | Cookbook" }, description: "Access your saved brand packs and previous workspace." };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ saved?: string; pack?: string; legacy?: string; projectId?: string; skill?: string; task?: string; view?: string; mode?: string; workflow?: string; prompt?: string }> }) {
  const { projectId, skill, task, view, mode, workflow, prompt, pack, legacy, saved } = await searchParams;
  if (pack || saved === "1") return <BrandPackSetup enabled={brandPacksEnabled()} initialPackId={pack} />;
  if (!task && !view && !mode && !workflow && !projectId && legacy !== "1") redirect("/docs/install");
  return <CookbookChatWorkspace initialProjectId={projectId} initialMode={validMode(mode) ? mode : undefined} initialWorkflow={validWorkflow(workflow) ? workflow : undefined} initialSkillSlug={skill} initialTaskId={task} initialPrompt={prompt?.slice(0, 4000)} durableEnabled={cookbookV2Enabled()} initialBrandView={view === "cookbook"} />;
}
