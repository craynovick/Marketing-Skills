import { PanelToggle } from "./panel-toggle";
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
        <PanelToggle side="left" expanded label="Close navigation" onClick={onClose} />
      </div>
      <button className="cw-new" onClick={onNew} disabled={busy}>
        ＋ New chat
      </button>
      <button className="cw-new" onClick={onBrand}>▤ Your Cookbook</button>
      <div className="cw-navigation-sections">
        {["Chats", "Skills", "Archived"].map((section) => {
          const isChat = section === "Chats";
          const isArchive = section === "Archived";
          const entries = tasks.filter((task) =>
            isArchive
              ? Boolean(task.archived_at)
              : !task.archived_at && (task.skill_slug === marketingChat.slug) === isChat,
          );
          return (
            <section key={section} aria-label={section}>
              <div className="cw-nav-heading">
                <h2>{isArchive ? (
                  <button className="cw-archive-toggle" disabled={busy} onClick={onArchiveView} aria-expanded={archived}>
                    Archived <span aria-hidden="true">{archived ? "⌃" : "⌄"}</span>
                  </button>
                ) : section}</h2>
                {section === "Skills" && <button disabled={busy} onClick={onSkills}>Browse</button>}
              </div>
              {(!isArchive || archived) && <div className="cw-task-list">
                {entries.map((task) => (
                  <button key={task.id} onClick={() => onSelect(task.id)}
                    disabled={busy} title={task.title}
                    aria-current={task.id === activeId ? "page" : undefined}>
                    <span>{task.title}</span>
                    <small>{taskStatus(task)}</small>
                  </button>
                ))}
                {!entries.length && <p>{isArchive ? "Nothing archived yet." : isChat ? "Draft posts, emails, and campaigns in a new chat." : "Build reusable brand foundations with a skill."}</p>}
              </div>}
            </section>
          );
        })}
      </div>
      <div className="cw-sidebar-bottom">
        {onMore && <button onClick={onMore}>Load more {archived ? "archived items" : "conversations"}</button>}
        <button onClick={onSettings}>Settings & account</button>
      </div>
    </nav>
  );
}
