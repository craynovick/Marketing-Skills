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
  return <main>
    <section className="hero-console"><div className="wrap hero-grid">
      <div className="hero-brand-lockup"><p className="eyebrow">On-brand marketing turns your brand on</p><img className="hero-wordmark" src="/cookbook-logo.svg" width={320} height={260} decoding="sync" alt="Cook Book" /><p className="hero-tagline" aria-label="Sizzle your brand">Sizzle your <span className="rotating-food" aria-hidden="true"><span className="rotating-food-track" style={{ "--food-count": sizzleFoods.length } as React.CSSProperties}>{[...sizzleFoods, sizzleFoods[0]].map((food, index) => <span key={`${food}-${index}`}>{food}</span>)}</span></span></p></div>
      <div className="path-column"><p className="lede">Skip the bland AI.<br/>Serve your brand’s flavor.</p><p className="hero-sublede">Pre-built workflows for strategy, launch campaigns, and content, primed with your positioning, proof, and secret sauce so your agents never sound generic.</p><div className="path-cards"><a href="#catalog" className="path-card"><span className="path-number">01</span><h2>Skills</h2><p>Start with a reviewed marketing skill, then turn your brief and evidence into a usable draft.</p><span>Explore the menu ↗</span></a><a href="/create" className="path-card path-card-deep"><span className="path-number">02</span><h2>Create</h2><p>Build a reusable Cookbook from your brand context, then create focused tasks that keep every draft on-voice.</p><span>Get Cooking ↗</span></a></div><div className="hero-agents"><p>SYRUP FOR YOUR FAVORITE AI STACK</p><div className="agent-marquee" aria-label="Supported AI agents"><div className="agent-track">{["cursor","windsurf","claude","codex","openai","cursor","windsurf","claude","codex","openai"].map((agent,index)=><span className="agent-mark" key={`${agent}-${index}`}><img src={`/agents/agent-${agent}.png`} alt={agent} /></span>)}</div></div></div></div>
    </div></section>
    <section className="wrap catalog-section" id="catalog"><div className="section-label"><div><p className="eyebrow">THE LIBRARY</p><h2>What are we cooking today?</h2><p className="section-subhead">{skillCount} field-tested marketing recipes ready to run in Claude, Cursor, ChatGPT, and your CLI.</p></div><span className="count">{skillCount} reviewed skills</span></div><HomeCatalog skills={skills} /></section>
  </main>;
}
