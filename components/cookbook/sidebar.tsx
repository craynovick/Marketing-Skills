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
}: {
  tasks: Task[];
  activeId: string;
  busy: boolean;
  archived: boolean;
  onArchiveView: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onSettings: () => void;
  onClose: () => void;
}) {
  return (
    <nav className="cw-sidebar" aria-label="Cookbook navigation">
      <div className="cw-brand">
        <a href="/" aria-label="Cookbook home">
          Cookbook<span>YOUR MARKETING AGENT</span>
        </a>
        <button
          className="cw-icon"
          onClick={onClose}
          aria-label="Close navigation"
        >
          ‹
        </button>
      </div>
      <button className="cw-new" onClick={onNew} disabled={busy}>
        ＋ New task
      </button>
      <div className="cw-nav-heading">
        <h2>{archived ? "Archived" : "Your tasks"}</h2>
        <button disabled={busy} onClick={onArchiveView}>
          {archived ? "Active" : "Archived"}
        </button>
      </div>
      <div className="cw-task-list">
        {tasks
          .filter((t) => Boolean(t.archived_at) === archived)
          .map((task) => (
            <button
              key={task.id}
              onClick={() => onSelect(task.id)}
              disabled={busy}
              aria-current={task.id === activeId ? "page" : undefined}
            >
              <span>{task.title}</span>
              <small>
                {task.lifecycle === "accepted"
                  ? "Accepted"
                  : task.document
                    ? "Draft"
                    : "Ready to start"}
              </small>
            </button>
          ))}
        {!tasks.some((t) => Boolean(t.archived_at) === archived) && (
          <p>
            {archived ? "No archived tasks." : "Your work will appear here."}
          </p>
        )}
      </div>
      <div className="cw-sidebar-bottom">
        <a href="/cookbook">Brand context</a>
        <button onClick={onSettings}>Settings & account</button>
      </div>
    </nav>
  );
}
