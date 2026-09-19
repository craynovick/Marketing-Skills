import { CookbookChatWorkspace } from "@/components/cookbook-chat-workspace";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ skill?: string; task?: string }> }) {
  const { skill, task } = await searchParams;
  return <CookbookChatWorkspace initialSkillSlug={skill} initialTaskId={task} />;
}
