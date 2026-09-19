import { CookbookChatWorkspace } from "@/components/cookbook-chat-workspace";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  const { skill } = await searchParams;
  return <CookbookChatWorkspace initialSkillSlug={skill} />;
}
