import { taskStatus } from "@/lib/cookbook-foundations";
import Link from "next/link";
import { marketingChat } from "@/lib/cookbook-chat";
import type { Task } from "./types";
export function Sidebar({
  tasks,
  activeId,
  busy,
  archived,
  onArchiveView,
  onSelect,
  onNew,
  onSkills,
  onSettings,
  onClose,
  onBrand,
  onMore,
}: {
  onBrand?: () => void;
  onMore?: () => void;
  tasks: Task[];
  activeId: string;
  busy: boolean;
  archived: boolean;
  onArchiveView: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onSkills: () => void;
  onSettings: () => void;
  onClose: () => void;
}) {
  return (
    <nav className="cw-sidebar" aria-label="Cookbook navigation">
      <div className="cw-brand">
        <Link href="/" aria-label="Cookbook home">
          Cookbook<span>YOUR MARKETING AGENT</span>
        </Link>
        <button
          className="cw-icon"
          onClick={onClose}
          aria-label="Close navigation"
        >
          ‹
        </button>
      </div>
      <button className="cw-new" onClick={onNew} disabled={busy}>
        ＋ New chat
      </button>
      <button className="cw-new" onClick={onBrand}>▤ Your Cookbook</button>
      <div className="cw-navigation-sections">
        {["Chats", "Skills"].map((section) => {
          const isChat = section === "Chats";
          const entries = tasks.filter((task) =>
            Boolean(task.archived_at) === archived &&
            (task.skill_slug === marketingChat.slug) === isChat,
          );
          return (
            <section key={section} aria-label={section}>
              <div className="cw-nav-heading">
                <h2>{archived ? `Archived ${section.toLowerCase()}` : section}</h2>
                <button disabled={busy} onClick={isChat ? onArchiveView : onSkills}>
                  {isChat ? (archived ? "Active" : "Archived") : "Browse"}
                </button>
              </div>
              <div className="cw-task-list">
                {entries.map((task) => (
                  <button key={task.id} onClick={() => onSelect(task.id)}
                    disabled={busy} title={task.title}
                    aria-current={task.id === activeId ? "page" : undefined}>
                    <span>{task.title}</span>
                    <small>{taskStatus(task)}</small>
                  </button>
                ))}
                {!entries.length && <p>{archived ? "Nothing archived here." : isChat ? "Draft posts, emails, and campaigns in a new chat." : "Build reusable brand foundations with a skill."}</p>}
              </div>
            </section>
          );
        })}
      </div>
      <div className="cw-sidebar-bottom">
        {onMore && <button onClick={onMore}>Load more conversations</button>}
        <button onClick={onSettings}>Settings & account</button>
      </div>
    </nav>
  );
}
