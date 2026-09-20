"use client";
import { useState } from "react";
import Image from "next/image";
import { PanelToggle } from "./panel-toggle";
import { taskStatus } from "@/lib/cookbook-foundations";
import Link from "next/link";
import { modeOf } from "@/lib/cookbook-experience";
import type { Task } from "./types";
export function Sidebar({
  tasks,
  activeId,
  busy,
  archived,
  onArchiveView,
  onSelect,
  onNew,
  onSettings,
  onClose,
  onBrand,
  onMore,
  onTaskAction,
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
  onSettings: () => void;
  onClose: () => void;
  onTaskAction: (task: Task, changes: { archived?: boolean; pinned?: boolean }) => void;
}) {
  const [createOpen, setCreateOpen] = useState(true);
  return (
    <nav className="cw-sidebar" aria-label="Cookbook navigation">
      <div className="cw-brand">
        <Link href="/" aria-label="Cookbook home">
          <Image src="/cookbook-wordmark.svg" alt="Cookbook" width={164} height={28} />
        </Link>
        <PanelToggle side="left" expanded label="Close navigation" onClick={onClose} />
      </div>
      <button className="cw-new" onClick={onNew} disabled={busy}>
        ＋ Create
      </button>
      <button className="cw-new" onClick={onBrand}>▤ Your Cookbook</button>
      <div className="cw-navigation-sections">
        {["Create", "Archived"].map((section) => {
          const isChat = section === "Create";
          const isArchive = section === "Archived";
          const entries = tasks
            .filter((task) =>
              isArchive
                ? Boolean(task.archived_at)
                : !task.archived_at && (modeOf(task) === "create") === isChat,
            )
            .sort((a, b) => {
              if (Boolean(a.pinned_at) !== Boolean(b.pinned_at))
                return a.pinned_at ? -1 : 1;
              return (b.updated_at || "").localeCompare(a.updated_at || "");
            });
          return (
            <section key={section} aria-label={section}>
              <div className="cw-nav-heading">
                <h2>{isArchive ? (
                  <button className="cw-archive-toggle" disabled={busy} onClick={onArchiveView} aria-expanded={archived}>
                    Archived <span aria-hidden="true">{archived ? "⌃" : "⌄"}</span>
                  </button>
                ) : <button className="cw-archive-toggle" onClick={() => setCreateOpen(v => !v)} aria-expanded={createOpen}>Create <span aria-hidden="true">{createOpen ? "⌃" : "⌄"}</span></button>}</h2>
              </div>
              {(isArchive ? archived : createOpen) && <div className="cw-task-list">
                {entries.map((task) => (
                  <div className="cw-task-row" key={task.id}>
                    <button className="cw-task-select" onClick={() => onSelect(task.id)}
                      disabled={busy} title={task.title}
                      aria-current={task.id === activeId ? "page" : undefined}>
                      <span>{task.pinned_at && <span className="cw-pin" aria-label="Pinned">●</span>}{task.title}</span>
                      <small>{taskStatus(task)}</small>
                    </button>
                    <details className="cw-task-actions">
                      <summary aria-label={`Actions for ${task.title}`} title="Conversation actions">•••</summary>
                      <div role="group" aria-label={`Actions for ${task.title}`}>
                        <button disabled={busy} onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          onTaskAction(task, { pinned: !task.pinned_at });
                        }}>{task.pinned_at ? "Unpin" : "Pin"}</button>
                        <button disabled={busy} onClick={(event) => {
                          event.currentTarget.closest("details")?.removeAttribute("open");
                          onTaskAction(task, { archived: !task.archived_at });
                        }}>{task.archived_at ? "Restore" : "Archive"}</button>
                      </div>
                    </details>
                  </div>
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
