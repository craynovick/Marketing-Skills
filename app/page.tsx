import { HomeCatalog } from "@/components/catalog";
import { skills } from "@/lib/skills";

export default function Home() {
  const skillCount = skills.length;
  return <main>
    <section className="hero-console"><div className="wrap hero-grid">
      <div><p className="eyebrow">A MARKETING SKILLS LIBRARY</p><div className="hero-wordmark">COOK<br/>BOOK</div><p className="hero-tagline">THE PRACTICAL<br/>MARKETING COOKBOOK</p></div>
      <div className="path-column"><p className="lede">Build reusable brand context, then use it across every marketing workflow.</p><div className="path-cards"><a href="#catalog" className="path-card"><span className="path-number">01</span><h2>Get started<br/>with skills.</h2><p>Choose a ready-to-run workflow for the work in front of you.</p><span>Browse the library ↗</span></a><a href="/cookbook" className="path-card path-card-deep"><span className="path-number">02</span><h2>Create your<br/>Cookbook.</h2><p>Save your brand voice, audience, proof, and constraints to reuse in every skill.</p><span>Build your context ↗</span></a></div><div className="hero-agents"><p>AVAILABLE FOR THESE AGENTS</p><div className="agent-marquee" aria-label="Supported AI agents"><div className="agent-track">{["cursor","windsurf","claude","codex","openai","cursor","windsurf","claude","codex","openai"].map((agent,index)=><span className="agent-mark" key={`${agent}-${index}`}><img src={`/agents/agent-${agent}.png`} alt={agent} /></span>)}</div></div></div></div>
    </div></section>
    <section className="wrap catalog-section" id="catalog"><div className="section-label"><div><p className="eyebrow">THE LIBRARY</p><h2>Find your next workflow.</h2></div><span className="count">{skillCount} reviewed skills</span></div><HomeCatalog skills={skills} /></section>
  </main>;
}
