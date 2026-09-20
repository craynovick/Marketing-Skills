import { validMode, validWorkflow } from "@/lib/cookbook-experience";
import { CookbookChatWorkspace } from "@/components/cookbook-chat-workspace";

import { cookbookV2Enabled } from "@/lib/cookbook-features";

export const metadata = { title: { absolute: "Create | Cookbook" }, description: "Your brand and marketing agent. Draft content in chats and build reusable brand skills." };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ skill?: string; task?: string; view?: string; mode?: string; workflow?: string }> }) {
  const { skill, task, view, mode, workflow } = await searchParams;
  return <CookbookChatWorkspace initialMode={validMode(mode) ? mode : undefined} initialWorkflow={validWorkflow(workflow) ? workflow : undefined} initialSkillSlug={skill} initialTaskId={task} durableEnabled={cookbookV2Enabled()} initialBrandView={view === "cookbook"} />;
}
