import { notFound } from "next/navigation";
import Link from "next/link";
import { SkillActions } from "@/components/skill-actions";
import { getSkill, skills } from "@/lib/skills";

export function generateStaticParams() { return skills.map(skill => ({ slug: skill.slug })); }

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  const skill = getSkill((await params).slug);
  if (!skill) notFound();
  const downstream = skill.downstream.map(getSkill).filter((item): item is typeof skill => Boolean(item)).slice(0, 3);
  const recommendations = downstream.length ? downstream : skills.filter(item => item.slug !== skill.slug && item.category === skill.category).sort((a, b) => a.order - b.order).slice(0, 3);

  return <main className="wrap skill-page">
    <Link href="/" className="back">← All skills</Link>
    <div className="skill-header"><div><h1>{skill.name}</h1><p className="lede">{skill.goal}</p></div></div>
    <div className="detail-grid">
      <section className="recipe-spec">
        <p className="eyebrow">RECIPE SPECIFICATION</p>
        <div className="spec-block"><h2>When to use it</h2><p>{skill.when}</p></div>
        <div className="spec-block"><h2>Required inputs</h2><ul>{skill.inputs.map(input => <li key={input}>{input}</li>)}</ul></div>
        {skill.requires_profile.length > 0 && <div className="spec-block"><h2>Cookbook foundation</h2><p>This workflow can be customized with your saved brand context. Recommended fields:</p><ul>{skill.requires_profile.map(field => <li key={field}>{field}</li>)}</ul></div>}
        <div className="spec-block"><h2>Expected output</h2><p>{skill.output}</p></div>
        <div className="spec-block"><h2>Safety note</h2><p>{skill.safety}</p></div>
      </section>
      <aside className="skill-sidebar">
        <SkillActions slug={skill.slug} markdown={skill.skill} />
        <div className="sidebar-section info-card"><h4 className="eyebrow">INFO</h4><dl className="meta-list"><div><dt>Category</dt><dd>{skill.category}</dd></div><div><dt>Version</dt><dd>v{skill.version}</dd></div><div><dt>Complexity</dt><dd>{skill.complexity}</dd></div><div><dt>Status</dt><dd>✓ Reviewed</dd></div></dl></div>
        <div className="sidebar-section trust-cues"><h4 className="eyebrow">TRUST CUES</h4><dl className="meta-list"><div><dt>Source</dt><dd>First-party repository</dd></div><div><dt>Supported agents</dt><dd>{skill.agents.join(", ")}</dd></div><div><dt>External actions</dt><dd>No external actions (read-only)</dd></div></dl></div>
      </aside>
    </div>
    {recommendations.length > 0 && <section className="skill-recommendations" aria-labelledby="recommended-skills"><div className="section-label"><h2 id="recommended-skills">Recommended next skills</h2><span className="count">{downstream.length ? "NEXT STEPS" : "RELATED SKILLS"}</span></div><div className="recommendation-list">{recommendations.map(item => <Link href={`/skills/${item.slug}`} className="recommendation-card" key={item.slug}><span className="eyebrow">{item.category} · {item.complexity}</span><h3>{item.name}</h3><p>{item.goal}</p><span className="arrow">↗</span></Link>)}</div></section>}
  </main>;
}
