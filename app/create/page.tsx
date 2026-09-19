import { CookbookChatWorkspace } from "@/components/cookbook-chat-workspace";

export const metadata = { title: { absolute: "Create | Cookbook" }, description: "Your brand and marketing agent. Draft content in chats and build reusable brand skills." };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ skill?: string; task?: string }> }) {
  const { skill, task } = await searchParams;
  return <CookbookChatWorkspace initialSkillSlug={skill} initialTaskId={task} />;
}
