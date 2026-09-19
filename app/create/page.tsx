import { CookbookChatWorkspace } from "@/components/cookbook-chat-workspace";

import { cookbookV2Enabled } from "@/lib/cookbook-features";

export const metadata = { title: { absolute: "Create | Cookbook" }, description: "Your brand and marketing agent. Draft content in chats and build reusable brand skills." };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ skill?: string; task?: string; view?: string }> }) {
  const { skill, task, view } = await searchParams;
  return <CookbookChatWorkspace initialSkillSlug={skill} initialTaskId={task} durableEnabled={cookbookV2Enabled()} initialBrandView={view === "cookbook"} />;
}
