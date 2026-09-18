"use client";

import { FormEvent, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

type SkillStatus = "Queue" | "Drafting" | "Ready";
type Skill = { id: string; file: string; title: string; status: SkillStatus; content: string };
type ChatItem =
  | { id: string; type: "assistant" | "user"; text: string }
  | { id: string; type: "tool"; host: string; pages: number }
  | { id: string; type: "artifact"; skillId: string; changed?: string };

const initialSkills: Skill[] = [
  { id: "identity", file: "01_identity.md", title: "Brand identity", status: "Drafting", content: "# Brand identity\n\n## The feeling\nA place where curiosity gets to lead.\n\n## The promise\nWe make close encounters with aviation feel personal, cinematic, and possible." },
  { id: "audience", file: "02_audience.md", title: "Audience", status: "Queue", content: "# Primary audience\n\nPeople looking for a memorable, all-ages day out with stories worth retelling." },
  { id: "voice", file: "03_voice_tone.md", title: "Voice & tone", status: "Ready", content: "# Voice & tone\n\n## We sound\nWonder-driven, warm, and specific. We invite people to look closer.\n\n## We avoid\nGeneric superlatives, institutional language, and calling staff “tour guides.”\n\n## In practice\nUse vivid details, active verbs, and the feeling of discovery." },
  { id: "pillars", file: "04_pillars.md", title: "Content pillars", status: "Queue", content: "# Content pillars\n\n- Objects with stories\n- The people behind flight\n- A day of discovery\n- The future in motion" },
  { id: "guardrails", file: "05_guardrails.md", title: "Guardrails", status: "Queue", content: "# Guardrails\n\nKeep claims grounded in approved source material. Let the objects do the talking." },
];

const initialThread: ChatItem[] = [
  { id: "welcome", type: "assistant", text: "Let’s build your brand’s working recipe. Share your website and I’ll gather the useful signals, then we’ll shape each skill together." },
];

function iconFor(status: SkillStatus) {
  return status === "Ready" ? "✓" : status === "Drafting" ? "✦" : "○";
}

export function CookbookChatWorkspace() {
  const [skills, setSkills] = useState(initialSkills);
  const [activeId, setActiveId] = useState("voice");
  const [thread, setThread] = useState(initialThread);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages: streamedMessages, sendMessage } = useChat({ transport });
  const activeSkill = skills.find(skill => skill.id === activeId) ?? skills[0];
  const activeArtifact = useMemo(() => thread.filter((item): item is Extract<ChatItem, { type: "artifact" }> => item.type === "artifact").at(-1), [thread]);

  function setActive(skillId: string) {
    setActiveId(skillId);
    const skill = skills.find(item => item.id === skillId);
    if (skill) setThread(current => [...current, { id: `context-${Date.now()}`, type: "assistant", text: `We’re now working on ${skill.file}. Ask for a first draft, a sharper point of view, or an edit.` }]);
  }

  function createSkill() {
    const firstQueue = skills.find(skill => skill.status === "Queue") ?? skills[0];
    setActive(firstQueue.id);
    setThread(current => [...current, { id: `new-${Date.now()}`, type: "assistant", text: `Starting ${firstQueue.file}. What is the one thing this needs to make unmistakably true about your brand?` }]);
  }

  function acceptSkill(skillId: string) {
    setSkills(current => current.map(skill => skill.id === skillId ? { ...skill, status: "Ready" } : skill));
    const skill = skills.find(item => item.id === skillId);
    if (skill) setThread(current => [...current, { id: `accepted-${Date.now()}`, type: "assistant", text: `${skill.file} is saved and ready to use across your skills.` }]);
  }

  async function copySkill() {
    await navigator.clipboard?.writeText(activeSkill.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function exportSkills() {
    const archive = skills.map(skill => `--- ${skill.file} ---\n${skill.content}`).join("\n\n");
    const url = URL.createObjectURL(new Blob([archive], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cookbook-skills.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  function send(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;
    setInput("");
    const userItem: ChatItem = { id: `user-${Date.now()}`, type: "user", text: message };
    void sendMessage({ text: message }, { body: { activeSkill: activeSkill.file } }).catch(() => undefined);
    if (/https?:\/\/|\b[a-z0-9-]+\.[a-z]{2,}\b/i.test(message)) {
      const rawHost = message.match(/(?:https?:\/\/)?([^/\s]+)/i)?.[1] ?? "your website";
      setThread(current => [...current, userItem, { id: `tool-${Date.now()}`, type: "tool", host: rawHost.replace(/^www\./, ""), pages: 4 }, { id: `artifact-${Date.now()}`, type: "artifact", skillId: activeId }]);
      setSkills(current => current.map(skill => skill.id === activeId ? { ...skill, status: "Drafting" } : skill));
      return;
    }
    const change = `Updated for: “${message}”`;
    setSkills(current => current.map(skill => skill.id === activeId ? { ...skill, status: "Drafting", content: `${skill.content}\n\n> Revision note: ${message}` } : skill));
    setThread(current => [...current, userItem, { id: `reply-${Date.now()}`, type: "assistant", text: `Done. I tightened ${activeSkill.file} around that direction and kept the language specific enough to be useful in a real brief.` }, { id: `artifact-${Date.now()}`, type: "artifact", skillId: activeId, changed: change }]);
  }

  return <section className="cookbook-chat-shell" aria-label="Cookbook skill builder">
    <aside className="cookbook-sidebar">
      <div className="cookbook-sidebar__top">
        <a className="cookbook-wordmark" href="/" aria-label="Cookbook home"><span>COOK</span><i>BOOK</i></a>
        <button className="new-skill" onClick={createSkill}><span>+</span> New Skill</button>
      </div>
      <div className="skill-nav-label">YOUR BRAND SKILLS</div>
      <nav className="skill-nav" aria-label="Brand skills">
        {skills.map(skill => <button className={skill.id === activeId ? "active" : ""} onClick={() => setActive(skill.id)} key={skill.id}>
          <span className={`skill-state ${skill.status.toLowerCase()}`}>{iconFor(skill.status)}</span>
          <span className="skill-nav__name"><b>{skill.file}</b><small>{skill.title}</small></span>
          <span className={`skill-status ${skill.status.toLowerCase()}`}>{skill.status === "Ready" ? "✓ Ready" : skill.status}</span>
        </button>)}
      </nav>
      <button className="export-skills" onClick={exportSkills}><span>↓</span> Export (.zip)</button>
    </aside>

    <main className="cookbook-thread">
      <header className="thread-header"><div><span className="thread-kicker">ACTIVE SKILL</span><h1>{activeSkill.file}</h1></div><div className="thread-actions"><span className="saved-pill"><i /> Auto-saved</span><button onClick={copySkill}>{copied ? "Copied ✓" : "Copy .md"}</button></div></header>
      <div className="thread-scroll">
        <div className="thread-inner">
          {thread.map(item => {
            if (item.type === "tool") return <article className="tool-card" key={item.id}><span className="tool-mark">✓</span><div><b>Website context gathered</b><p>Scraped {item.host} · {item.pages} useful pages</p></div><span className="tool-detail">View sources</span></article>;
            if (item.type === "artifact") { const skill = skills.find(entry => entry.id === item.skillId) ?? activeSkill; return <article className="skill-artifact" key={item.id}><div className="artifact-top"><span>GENERATED SKILL</span><span>{item.changed || "First draft ready"}</span></div><div className="markdown-card"><div className="markdown-file"><span>⌘</span> {skill.file}</div><pre>{skill.content}</pre></div><div className="artifact-actions"><button className="accept" onClick={() => acceptSkill(skill.id)}>Accept <span>✓</span></button><button onClick={() => setInput("Make this more wonder-driven and never say ‘tour guides’.")}>Tweak in chat</button></div></article>; }
            return <article className={`chat-message ${item.type}`} key={item.id}>{item.type === "assistant" && <span className="assistant-avatar">C</span>}<p>{item.text}</p></article>;
          })}
          {streamedMessages.map(message => {
            const text = message.parts.filter(part => part.type === "text").map(part => part.text).join("");
            return text ? <article className="chat-message assistant" key={message.id}><span className="assistant-avatar">C</span><p>{text}</p></article> : null;
          })}
          {activeArtifact && <p className="thread-hint">Your changes stay in this thread. Nothing is hidden in a separate setup step.</p>}
        </div>
      </div>
      <form className="thread-composer" onSubmit={send}><textarea value={input} onChange={event => setInput(event.target.value)} placeholder={`Ask to revise ${activeSkill.file} or paste your website…`} rows={1} /><button type="submit" aria-label="Send message">↑</button></form>
    </main>
  </section>;
}
