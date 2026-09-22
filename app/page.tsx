import Link from "next/link";
import { DirectionArrow } from "@/components/direction-arrow";
import { CommandCopy } from "@/components/copy";
import { HomeCatalog } from "@/components/catalog";
import { skills } from "@/lib/skills";

const sizzleFoods = [
  "steak", "ramen", "brussels sprouts", "tater tots", "oysters", "gummy bears",
  "caviar", "waffles", "kimchi", "dumplings", "lasagna", "peaches", "sardines",
  "croissants", "pickle chips", "mushrooms", "churros", "anchovies", "tacos",
  "popcorn", "miso", "beignets", "artichokes", "meatballs", "poutine", "olives",
  "mochi", "french fries", "halloumi", "sushi", "plantains", "corn dogs", "focaccia",
  "macarons", "bok choy", "burrata", "pretzels", "falafel", "hot honey", "pierogi",
  "charcuterie", "mangoes", "donuts", "cannoli", "edamame", "nachos", "ravioli",
  "persimmons", "empanadas", "zucchini", "s'mores", "tempura", "cereal", "paella",
  "jalapeños", "eggplant", "shortcake", "gnocchi", "truffles", "bananas",
];

export default function Home() {
  const skillCount = skills.length;
  return <main className="home-page">
    <section className="hero-console"><div className="wrap hero-grid">
      <div className="hero-brand-lockup"><img className="hero-wordmark" src="/cookbook-logo.svg" width={320} height={260} decoding="sync" alt="Cook Book" /><p className="hero-tagline" aria-label="Sizzle your brand">Sizzle your <span className="rotating-food" aria-hidden="true"><span className="rotating-food-track" style={{ "--food-count": sizzleFoods.length } as React.CSSProperties}>{[...sizzleFoods, sizzleFoods[0]].map((food, index) => <span key={`${food}-${index}`}>{food}</span>)}</span></span></p></div>
      <div className="path-column"><p className="lede">Skip the bland AI.<br/>Serve your brand’s flavor.</p><p className="hero-sublede">Open agent marketing skills that understand your brand.</p><a href="#catalog" className="hero-browse">Browse the skills <DirectionArrow direction="down" /></a><CommandCopy command="npx skills add https://www.cookbook.to" /><p className="hero-install-note"><a href="/api/skills/install">Download an offline installer</a> · <Link href="/docs/install">Install guide</Link></p><div className="hero-agents"><p>Works with these agents</p><div className="agent-marquee" aria-label="Supported AI agents"><div className="agent-track">{["cursor","windsurf","claude","codex","openai","cursor","windsurf","claude","codex","openai"].map((agent,index)=><span className="agent-mark" key={`${agent}-${index}`}><img src={`/agents/agent-${agent}.png`} alt={agent} /></span>)}</div></div></div></div>
    </div></section>
    <section className="wrap catalog-section" id="catalog"><div className="section-label"><div><h2>Marketing Skills</h2><p className="section-subhead">Turn your ideas into clear strategy, on-brand content, and campaigns you can put to work.</p></div><span className="count">{skillCount} reviewed skills</span></div><HomeCatalog skills={skills.map(({ slug, name, goal, tags, category, foundational, complexity, order }) => ({ slug, name, goal, tags, category, foundational, complexity, order }))} /></section>
    <section className="wrap home-contact-section" aria-labelledby="custom-skills-heading">
      <div className="home-contact-cta">
        <div><p className="eyebrow">BUILT FOR YOUR TEAM</p><h2 id="custom-skills-heading">Need custom skills?</h2><p>Bring your team’s workflows, brand, and ways of working into the AI tools you already use.</p></div>
        <Link href="/contact" className="home-contact-link">Contact us <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  </main>;
}
