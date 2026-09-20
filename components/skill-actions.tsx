"use client";
import { defaultMode, entryUrl } from "@/lib/cookbook-experience";

export function SkillActions({ slug, markdown }: { slug: string; markdown: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="skill-actions">
    <a className="skill-create" href={entryUrl(defaultMode(slug), "general", slug)}>{defaultMode(slug) === "skill-tuning" ? "Configure skill" : "Create"}</a>
    <button className="skill-download" onClick={download}>Download .md</button>
  </div>;
}
