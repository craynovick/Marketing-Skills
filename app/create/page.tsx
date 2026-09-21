import { BrandPackSetup } from "@/components/brand-pack-setup";
import { brandPacksEnabled } from "@/lib/brand-pack-server";
import { getSkill } from "@/lib/generated-skills";
import { validMode, validWorkflow } from "@/lib/cookbook-experience";
import { CookbookChatWorkspace } from "@/components/cookbook-chat-workspace";

import { cookbookV2Enabled } from "@/lib/cookbook-features";

export const metadata = { title: { absolute: "Create | Cookbook" }, description: "Describe your brand, review one shared brief, and install marketing skills in your AI app." };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ pack?: string; legacy?: string; projectId?: string; skill?: string; task?: string; view?: string; mode?: string; workflow?: string; prompt?: string }> }) {
  const { projectId, skill, task, view, mode, workflow, prompt, pack, legacy } = await searchParams;
  if (!task && !view && !mode && !workflow && legacy !== "1") return <BrandPackSetup enabled={brandPacksEnabled()} initialPackId={pack} initialSkill={skill && getSkill(skill) ? skill : undefined} />;
  return <CookbookChatWorkspace initialProjectId={projectId} initialMode={validMode(mode) ? mode : undefined} initialWorkflow={validWorkflow(workflow) ? workflow : undefined} initialSkillSlug={skill} initialTaskId={task} initialPrompt={prompt?.slice(0, 4000)} durableEnabled={cookbookV2Enabled()} initialBrandView={view === "cookbook"} />;
}
