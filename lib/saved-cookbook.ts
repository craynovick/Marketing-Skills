import type { Draft } from "@/components/cookbook/types";

export type SavedSkill = {
  id: string;
  title: string;
  file_name: string;
  updated_at: string;
  accepted_version_id: string | null;
  foundation_key?: string | null;
  document: Pick<Draft, "id" | "content" | "version"> | null;
};
export type SavedCookbookPage = { skills: SavedSkill[]; nextCursor: string | null };

export function savedSkillStatus(skill: SavedSkill) {
  if (!skill.document) return "No saved document";
  if (skill.document.id === skill.accepted_version_id) return "Confirmed";
  return skill.accepted_version_id ? "Changes to review" : "Draft";
}
export function savedSkillFilename(skill: Pick<SavedSkill, "file_name" | "title">) {
  const base = (skill.file_name || skill.title).replace(/\.md$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^[.-]+|[.-]+$/g, "").slice(0, 120);
  return `${base || "cookbook-skill"}.md`;
}
