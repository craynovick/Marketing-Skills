"use client";

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
    <a className="skill-create" href={`/create?skill=${encodeURIComponent(slug)}`}>Create</a>
    <button className="skill-download" onClick={download}>Download .md</button>
  </div>;
}
