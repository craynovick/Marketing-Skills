"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

type SkillStatus = "Queue" | "Drafting" | "Ready";
type Skill = { id: string; file: string; title: string; status: SkillStatus; content: string };
type ToolPart = { type: string; state?: string; input?: unknown; output?: unknown };

const initialSkills: Skill[] = [
  { id: "identity", file: "01_identity.md", title: "Brand identity", status: "Queue", content: "# Brand identity\n\nWaiting for research." },
  { id: "audience", file: "02_audience.md", title: "Audience", status: "Queue", content: "# Primary audience\n\nWaiting for research." },
  { id: "voice", file: "03_voice_tone.md", title: "Voice & tone", status: "Queue", content: "# Voice & tone\n\nWaiting for research." },
  { id: "pillars", file: "04_pillars.md", title: "Content pillars", status: "Queue", content: "# Content pillars\n\nWaiting for research." },
  { id: "guardrails", file: "05_guardrails.md", title: "Guardrails", status: "Queue", content: "# Guardrails\n\nWaiting for research." },
];

function iconFor(status: SkillStatus) { return status === "Ready" ? "✓" : status === "Drafting" ? "✦" : "○"; }
function isSavedDraft(value: unknown): value is { fileName: string; content: string; status: SkillStatus } { return value !== null && typeof value === "object" && "fileName" in value && "content" in value && "status" in value; }
function toolLabel(part: ToolPart) { return part.type === "tool-scrapeWebsite" ? "Researching website" : part.type === "tool-saveSkillMarkdown" ? "Drafting skill" : "Working"; }

export function CookbookChatWorkspace() {
  const [skills, setSkills] = useState(initialSkills);
  const [activeId, setActiveId] = useState("voice");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, error } = useChat({ transport });
  const activeSkill = skills.find(skill => skill.id === activeId) ?? skills[0];

  useEffect(() => {
    for (const message of messages) for (const part of message.parts) {
      if (!part.type.startsWith("tool-")) continue;
      const tool = part as ToolPart;
      const draft = tool.output;
      if (!isSavedDraft(draft)) continue;
      setSkills(current => current.map(skill => skill.file === draft.fileName ? { ...skill, content: draft.content, status: draft.status } : skill));
    }
  }, [messages]);

  function setActive(skillId: string) { setActiveId(skillId); }
  async function copySkill() { await navigator.clipboard?.writeText(activeSkill.content); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  function exportSkills() { const archive = skills.map(skill => `--- ${skill.file} ---\n${skill.content}`).join("\n\n"); const url = URL.createObjectURL(new Blob([archive], { type: "text/markdown" })); const link = document.createElement("a"); link.href = url; link.download = "cookbook-skills.md"; link.click(); URL.revokeObjectURL(url); }
  function acceptSkill(skillId: string) { setSkills(current => current.map(skill => skill.id === skillId ? { ...skill, status: "Ready" } : skill)); }
  function submit(event?: FormEvent, value = input) { event?.preventDefault(); const text = value.trim(); if (!text || status === "submitted" || status === "streaming") return; setInput(""); void sendMessage({ text }, { body: { activeSkill: activeSkill.file, activeSkillContent: activeSkill.content } }); }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); } }

  return <section className="cookbook-chat-shell" aria-label="Cookbook skill builder">
    <aside className="cookbook-sidebar"><div className="cookbook-sidebar__top"><a className="cookbook-wordmark" href="/" aria-label="Cookbook home"><span>COOK</span><i>BOOK</i></a><button className="new-skill" onClick={() => setActive(skills.find(skill => skill.status === "Queue")?.id ?? activeId)}><span>+</span> New Skill</button></div><div className="skill-nav-label">YOUR BRAND SKILLS</div><nav className="skill-nav" aria-label="Brand skills">{skills.map(skill => <button className={skill.id === activeId ? "active" : ""} onClick={() => setActive(skill.id)} key={skill.id}><span className={`skill-state ${skill.status.toLowerCase()}`}>{iconFor(skill.status)}</span><span className="skill-nav__name"><b>{skill.file}</b><small>{skill.title}</small></span><span className={`skill-status ${skill.status.toLowerCase()}`}>{skill.status === "Ready" ? "✓ Ready" : skill.status}</span></button>)}</nav><button className="export-skills" onClick={exportSkills}><span>↓</span> Export (.zip)</button></aside>
    <main className="cookbook-thread"><header className="thread-header"><div><span className="thread-kicker">ACTIVE SKILL</span><h1>{activeSkill.file}</h1></div><div className="thread-actions"><span className="saved-pill"><i /> Auto-saved</span><button onClick={copySkill}>{copied ? "Copied ✓" : "Copy .md"}</button></div></header><div className="thread-scroll"><div className="thread-inner">
      {messages.length === 0 && <article className="chat-message assistant welcome-message"><span className="assistant-avatar">C</span><div><p>I’m Cookbook, your brand strategist. Send a website and I’ll research it, create a first outline for <b>{activeSkill.file}</b>, then ask the one question needed to improve it.</p><div className="prompt-suggestions"><button onClick={() => submit(undefined, "https://example.com")}>Analyze my website</button><button onClick={() => submit(undefined, "Help me start from scratch")}>Start from scratch</button></div></div></article>}
      {messages.map(message => <article className={`chat-message ${message.role === "user" ? "user" : "assistant"}`} key={message.id}>{message.role !== "user" && <span className="assistant-avatar">C</span>}<div className="message-body">{message.parts.map((part, index) => {
        if (part.type === "text") return <p key={`${message.id}-${index}`}>{part.text}</p>;
        if (!part.type.startsWith("tool-")) return null;
        const tool = part as ToolPart;
        const draft = tool.output;
        if (isSavedDraft(draft)) return <article className="skill-artifact" key={`${message.id}-${index}`}><div className="artifact-top"><span>WORKING OUTLINE</span><span>Review before accepting</span></div><div className="markdown-card"><div className="markdown-file"><span>⌘</span> {draft.fileName}</div><pre>{draft.content}</pre></div><div className="artifact-actions"><button className="accept" onClick={() => acceptSkill(skills.find(skill => skill.file === draft.fileName)?.id ?? activeId)}>Accept <span>✓</span></button><button onClick={() => setInput("Make this more specific and more ownable.")}>Tweak in chat</button></div></article>;
        return <article className={`agent-run ${tool.state === "output-available" ? "complete" : ""}`} key={`${message.id}-${index}`}><div className="agent-run__heading"><span className="assistant-avatar">C</span><div><b>{toolLabel(tool)}</b><p>{tool.state === "output-available" ? "Complete" : "Cookbook agent is working"}</p></div><span className="agent-run__state">{tool.state === "output-available" ? "Done" : "Working"}</span></div></article>;
      })}</div></article>)}
      {(status === "submitted" || status === "streaming") && <article className="assistant-thinking"><span className="assistant-avatar">C</span><span /><span /><span /></article>}
      {error && <p className="chat-error">{error.message}</p>}
    </div></div><form className="thread-composer" onSubmit={submit}><textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={onKeyDown} placeholder={`Message Cookbook about ${activeSkill.file}…`} rows={1} disabled={status === "submitted" || status === "streaming"}/><button type="submit" aria-label="Send message" disabled={!input.trim() || status === "submitted" || status === "streaming"}>↑</button><span className="composer-hint">Enter to send · Shift + Enter for a new line</span></form></main>
  </section>;
}
