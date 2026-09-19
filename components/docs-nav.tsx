import Link from "next/link";

const items = [["Overview", "/docs"], ["Use a workflow", "/docs/install"], ["Customize", "/docs/customize"], ["Format", "/docs/format"], ["Connect your AI app", "/docs/connect"], ["Self-hosting & licensing", "/docs/self-host"], ["Safety", "/docs/safety"], ["FAQ", "/docs/faq"]];
export function DocsNav({ current }: { current: string }) { return <nav className="docs-nav" aria-label="Documentation">{items.map(([label, href]) => <Link href={href} aria-current={href === current ? "page" : undefined} className={href === current ? "active" : ""} key={href}>{label}</Link>)}</nav>; }
