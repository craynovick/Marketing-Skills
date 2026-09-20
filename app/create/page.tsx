import { validMode, validWorkflow } from "@/lib/cookbook-experience";
import { CookbookChatWorkspace } from "@/components/cookbook-chat-workspace";

import { cookbookV2Enabled } from "@/lib/cookbook-features";

export const metadata = { title: { absolute: "Create | Cookbook" }, description: "Your brand and marketing agent. Draft content in chats and build reusable brand skills." };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ projectId?: string; skill?: string; task?: string; view?: string; mode?: string; workflow?: string; prompt?: string }> }) {
  const { projectId, skill, task, view, mode, workflow, prompt } = await searchParams;
  return <CookbookChatWorkspace initialProjectId={projectId} initialMode={validMode(mode) ? mode : undefined} initialWorkflow={validWorkflow(workflow) ? workflow : undefined} initialSkillSlug={skill} initialTaskId={task} initialPrompt={prompt?.slice(0, 4000)} durableEnabled={cookbookV2Enabled()} initialBrandView={view === "cookbook"} />;
}
