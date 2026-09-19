"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { marketingChat } from "@/lib/cookbook-chat";
import { skills as catalog } from "@/lib/generated-skills";
import type { CookbookMessage } from "@/lib/cookbook-agent";
import { Composer } from "./cookbook/composer";
import { Sidebar } from "./cookbook/sidebar";
import { Artifact } from "./cookbook/artifact";
import { Markdown, safeLink } from "./cookbook/markdown";
import {
  json,
  messageOf,
  requestJSON,
  type Attachment,
  type Draft,
  type Run,
  type Task,
} from "./cookbook/types";

type ThreadData = {
  task: Task;
  messages: CookbookMessage[];
  versions: Draft[];
  attachments: Attachment[];
  run?: Run;
};
type Initial = { text: string; files: File[] };
function store(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* Private browsing may disable storage. */
  }
}
function read(key: string) {
  try {
    return sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}
function validateFiles(files: File[], existing = 0) {
  if (files.length + existing > 5)
    throw new Error("A task can hold up to five files.");
  if (files.some((f) => !f.size || !/\.(pdf|docx|txt|md)$/i.test(f.name)))
    throw new Error("Choose nonempty PDF, DOCX, TXT or Markdown files.");
  if (files.reduce((sum, f) => sum + f.size, 0) > 4 * 1024 * 1024)
    throw new Error("Choose files totaling 4 MB or less per upload.");
}

export function CookbookChatWorkspace({
  initialSkillSlug,
  initialTaskId,
}: {
  initialSkillSlug?: string;
  initialTaskId?: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState(initialTaskId || "");
  const [account, setAccount] = useState<
    "loading" | "ready" | "signed-out" | "error"
  >("loading");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [archived, setArchived] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [slug, setSlug] = useState(initialSkillSlug || "");
  const [query, setQuery] = useState("");
  const [initial, setInitial] = useState<Initial | null>(null);
  const [enterSends, setEnterSends] = useState(true);
  const [rename, setRename] = useState("");
  const drawer = useRef<HTMLDialogElement>(null);
  const picker = useRef<HTMLDialogElement>(null);
  const settings = useRef<HTMLDialogElement>(null);
  const taskMenu = useRef<HTMLDialogElement>(null);
  const creationKey = useRef(crypto.randomUUID());
  const creating = useRef(false);
  const active = tasks.find((task) => task.id === activeId);
  const filteredSkills = catalog.filter((skill) =>
    `${skill.name} ${skill.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const load = useCallback(async () => {
    setNotice("");
    try {
      const data = await requestJSON<{ skills: Task[] }>(
        "/api/cookbook/workspace",
      );
      setTasks(data.skills);
      setAccount("ready");
    } catch (error) {
      setAccount(
        (error as { status?: number }).status === 401 ? "signed-out" : "error",
      );
      setNotice(messageOf(error));
    }
  }, []);
  useEffect(() => {
    void load();
    setInput(read("cookbook:new:input"));
    try {
      setCollapsed(localStorage.getItem("cookbook:collapsed") === "true");
      setEnterSends(localStorage.getItem("cookbook:enterSends") !== "false");
    } catch {}
  }, [load]);
  useEffect(() => {
    function pop() {
      setActiveId(new URL(location.href).searchParams.get("task") || "");
    }
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  function changeInput(value: string) {
    setInput(value);
    store("cookbook:new:input", value);
  }
  function select(id: string) {
    if (busy || pending) return;
    setInitial(null);
    setActiveId(id);
    setNotice("");
    history.pushState(null, "", id ? `/create?task=${id}` : "/create");
    drawer.current?.close();
  }
  function updateTask(task: Task) {
    setTasks((current) =>
      current.some((t) => t.id === task.id)
        ? current.map((t) => (t.id === task.id ? task : t))
        : [task, ...current],
    );
  }
  function navigation() {
    if (matchMedia("(max-width: 1199px)").matches) drawer.current?.showModal();
    else {
      setCollapsed((value) => {
        try {
          localStorage.setItem("cookbook:collapsed", String(!value));
        } catch {}
        return !value;
      });
    }
  }
  function signIn() {
    store("cookbook:new:input", input);
    location.assign(
      `/sign-in?next=${encodeURIComponent(activeId ? `/create?task=${activeId}` : slug ? `/create?skill=${slug}` : "/create")}`,
    );
  }
  async function createTask(selected: string, prompt: Initial | null) {
    if (creating.current || account === "loading" || account === "error") return;
    if (account !== "ready") {
      setSlug(selected);
      picker.current?.close();
      setNotice(
        "Sign in to create your task. Your prompt is kept in this browser.",
      );
      return;
    }
    creating.current = true;
    setPending(true);
    setNotice("");
    try {
      const data = await requestJSON<{ skill: Task }>(
        "/api/cookbook/workspace/skill",
        json({
          slug: selected,
          requestId: creationKey.current,
          title: prompt?.text,
        }),
      );
      creationKey.current = crypto.randomUUID();
      updateTask(data.skill);
      setActiveId(data.skill.id);
      setInitial(prompt);
      setFiles([]);
      changeInput("");
      history.pushState(null, "", `/create?task=${data.skill.id}`);
      picker.current?.close();
      drawer.current?.close();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      creating.current = false;
      setPending(false);
    }
  }
  async function submit() {
    if (pending || !input.trim()) return;
    if (account === "error") return;
    if (account !== "ready") {
      signIn();
      return;
    }
    await createTask(slug || marketingChat.slug, { text: input.trim(), files });
  }

  async function taskAction(changes: Record<string, unknown>) {
    if (!active) return;
    setPending(true);
    try {
      const data = await requestJSON<{ skill: Task }>(
        "/api/cookbook/workspace/task",
        json({ taskId: active.id, ...changes }, "PATCH"),
      );
      updateTask({ ...active, ...data.skill });
      taskMenu.current?.close();
      if (changes.archived) selectAfterArchive();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setPending(false);
    }
  }
  function selectAfterArchive() {
    setActiveId("");
    history.pushState(null, "", "/create");
  }
  const sidebar = (
    <Sidebar
      tasks={tasks}
      activeId={activeId}
      busy={busy || pending}
      archived={archived}
      onArchiveView={() => setArchived((v) => !v)}
      onSelect={select}
      onNew={() => {
        setSlug("");
        select("");
      }}
      onSkills={() => {
        setQuery("");
        picker.current?.showModal();
      }}
      onSettings={() => settings.current?.showModal()}
      onClose={() => {
        drawer.current?.close();
        setCollapsed(true);
      }}
    />
  );
  return (
    <section
      className={`cw-shell ${collapsed ? "cw-collapsed" : ""}`}
      aria-label="Cookbook agent workspace"
    >
      <div className="cw-desktop-nav">{sidebar}</div>
      <dialog
        ref={drawer}
        className="cw-drawer"
        onClick={(event) => {
          if (event.target === drawer.current) drawer.current.close();
        }}
      >
        {sidebar}
      </dialog>
      <main className="cw-main">
        <header className="cw-header">
          <button
            className="cw-icon"
            onClick={navigation}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <button
            className="cw-task-title"
            disabled={!active || busy || pending}
            onClick={() => {
              setRename(active?.title || "");
              taskMenu.current?.showModal();
            }}
          >
            {active?.title || "New chat"}
            {active && <span aria-hidden="true">⌄</span>}
          </button>
          <span className="cw-header-status" role="status">
            {busy
              ? "Working…"
              : account === "loading"
                ? "Connecting…"
                : account === "error"
                  ? "Connection unavailable"
                : account === "signed-out"
                  ? "Sign in to save"
                  : active?.lifecycle === "accepted"
                    ? "Accepted"
                    : active
                      ? "Draft"
                      : "Ready to create"}
          </span>
          {account === "signed-out" && (
            <button className="cw-primary" onClick={signIn}>
              Sign in
            </button>
          )}
        </header>
        {activeId ? (
          <TaskLoader
            key={activeId}
            taskId={activeId}
            initial={initial}
            onUpdate={updateTask}
            onBusy={setBusy}
            onConsumed={() => setInitial(null)}
            enterSends={enterSends}
          />
        ) : (
          <div className="cw-new-task">
            <div className="cw-welcome">
              <span className="cw-avatar">C</span>
              <p className="cw-eyebrow">YOUR CONTEXT. YOUR CRAFT.</p>
              <h1>What are we making?</h1>
              <p>
                Draft a post, shape a campaign, or sharpen your message.
                Bring your goal and I’ll help turn it into content you can use.
              </p>
              <div className="cw-suggestions">
                <button
                  onClick={() => {
                    changeInput(
                      "Analyze this website and develop brand positioning: https://",
                    );
                    document.getElementById("cookbook-message")?.focus();
                  }}
                >
                  Analyze a website ↗
                </button>
                <button
                  onClick={() => {
                    changeInput("Draft three social posts about ");
                    document.getElementById("cookbook-message")?.focus();
                  }}
                >
                  Draft social posts ＋
                </button>
                <button
                  onClick={() => {
                    setQuery("");
                    picker.current?.showModal();
                  }}
                >
                  Explore skills ⌄
                </button>
              </div>
            </div>
            {(notice || account === "error") && (
              <div className="cw-notice" role="status">
                {notice || "Connection unavailable. Retry to reopen your workspace."}
                {account === "error" && (
                  <button onClick={() => void load()}>Retry connection</button>
                )}
              </div>
            )}
            <Composer
              value={input}
              onChange={changeInput}
              onSubmit={() => void submit()}
              files={files}
              onRemoveFile={(index) =>
                setFiles((current) => current.filter((_, i) => i !== index))
              }
              onFiles={(incoming) => {
                if (account !== "ready") {
                  signIn();
                  return;
                }
                try {
                  validateFiles([...files, ...incoming]);
                  setFiles((current) => [...current, ...incoming]);
                } catch (error) {
                  setNotice(messageOf(error));
                }
              }}
              skill={
                catalog.find((s) => s.slug === slug)?.name ||
                "Marketing chat"
              }
              onSkill={() => {
                setQuery("");
                picker.current?.showModal();
              }}
              busy={false}
              disabled={pending || account === "loading" || account === "error"}
              enterSends={enterSends}
            />
            {pending && (
              <p className="cw-notice" role="status">
                Opening your conversation…
              </p>
            )}
          </div>
        )}
      </main>
      <dialog ref={picker} className="cw-modal">
        <div className="cw-modal-heading">
          <h2>Choose a skill</h2>
          <button
            className="cw-icon"
            aria-label="Close skill picker"
            onClick={() => picker.current?.close()}
          >
            ×
          </button>
        </div>
        <p>Skills build reusable marketing foundations. Chats turn your context into content.</p>
        <input
          aria-label="Search skills"
          placeholder={`Search ${catalog.length} skills…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {notice && (
          <p className="cw-error" role="alert">
            {notice}
          </p>
        )}
        <div className="cw-catalog">
          {!filteredSkills.length && <p role="status">No matching skills. Try another search or use marketing chat.</p>}
          {filteredSkills.map((s) => (
              <button
                disabled={pending || account === "loading" || account === "error"}
                key={s.slug}
                onClick={() => {
                  void createTask(s.slug, input.trim() ? { text: input.trim(), files } : null);
                }}
              >
                <strong>{s.name}</strong>
                <small>{s.category}</small>
                <span>{s.description}</span>
              </button>
            ))}
        </div>
        <button
          onClick={() => {
            setSlug("");
            picker.current?.close();
            select("");
          }}
        >
          Use marketing chat
        </button>
      </dialog>
      <dialog ref={settings} className="cw-modal">
        <div className="cw-modal-heading">
          <h2>Workspace settings</h2>
          <button
            className="cw-icon"
            aria-label="Close settings"
            onClick={() => settings.current?.close()}
          >
            ×
          </button>
        </div>
        <label className="cw-setting">
          <input
            type="checkbox"
            checked={enterSends}
            onChange={(event) => {
              setEnterSends(event.target.checked);
              try {
                localStorage.setItem(
                  "cookbook:enterSends",
                  String(event.target.checked),
                );
              } catch {}
            }}
          />
          Enter sends a message
        </label>
        <p>Shift+Enter always adds a new line.</p>
        <a href="/account">Manage account & billing →</a>
        <p>
          <a href="/cookbook">Manage reusable brand context →</a>
        </p>
      </dialog>
      <dialog ref={taskMenu} className="cw-modal">
        <div className="cw-modal-heading">
          <h2>Task settings</h2>
          <button
            className="cw-icon"
            aria-label="Close task settings"
            onClick={() => taskMenu.current?.close()}
          >
            ×
          </button>
        </div>
        <label>
          Task name
          <input
            value={rename}
            onChange={(e) => setRename(e.target.value)}
            maxLength={100}
          />
        </label>
        <button
          disabled={pending || !rename.trim()}
          onClick={() => void taskAction({ title: rename })}
        >
          Save name
        </button>
        <button
          disabled={pending}
          onClick={() => void taskAction({ archived: !active?.archived_at })}
        >
          {active?.archived_at ? "Restore task" : "Archive task"}
        </button>
        {notice && <p role="alert">{notice}</p>}
      </dialog>
    </section>
  );
}

function TaskLoader({
  taskId,
  initial,
  onUpdate,
  onBusy,
  onConsumed,
  enterSends,
}: {
  taskId: string;
  initial: Initial | null;
  onUpdate: (task: Task) => void;
  onBusy: (busy: boolean) => void;
  onConsumed: () => void;
  enterSends: boolean;
}) {
  const [data, setData] = useState<ThreadData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    requestJSON<ThreadData>(`/api/cookbook/workspace/thread?taskId=${taskId}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((error) => {
        if (!controller.signal.aborted) setError(messageOf(error));
      });
    return () => controller.abort();
  }, [taskId, attempt]);
  if (error)
    return (
      <div className="cw-empty">
        <p role="alert">{error}</p>
        <button
          onClick={() => {
            setError("");
            setAttempt((v) => v + 1);
          }}
        >
          Retry
        </button>
        <a
          href={`/sign-in?next=${encodeURIComponent(`/create?task=${taskId}`)}`}
        >
          Sign in
        </a>
      </div>
    );
  if (!data)
    return (
      <div className="cw-empty" role="status">
        Opening your task…
      </div>
    );
  return (
    <TaskThread
      initialData={data}
      initial={initial}
      onUpdate={onUpdate}
      onBusy={onBusy}
      onConsumed={onConsumed}
      enterSends={enterSends}
    />
  );
}
function TaskThread({
  initialData,
  initial,
  onUpdate,
  onBusy,
  onConsumed,
  enterSends,
}: {
  initialData: ThreadData;
  initial: Initial | null;
  onUpdate: (task: Task) => void;
  onBusy: (busy: boolean) => void;
  onConsumed: () => void;
  enterSends: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState(false);
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const runId = useRef("");
  const started = useRef(false);
  const lastInput = useRef("");
  const lock = useRef(false);
  const feed = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const task = data.task;
  const key = `cookbook:${task.id}:input`;
  const transport = useMemo(
    () => new DefaultChatTransport<CookbookMessage>({ api: "/api/chat" }),
    [],
  );
  const refresh = useCallback(async () => {
    const next = await requestJSON<ThreadData>(
      `/api/cookbook/workspace/thread?taskId=${initialData.task.id}`,
    );
    setData(next);
    onUpdate(next.task);
  }, [initialData.task.id, onUpdate]);
  const { messages, sendMessage, status, error, clearError, stop } =
    useChat<CookbookMessage>({
      id: task.id,
      messages: initialData.messages,
      transport,
      onFinish: () => {
        lock.current = false;
        void refresh().catch((error) => setNotice(messageOf(error)));
      },
      onError: () => {
        lock.current = false;
        setInput(lastInput.current);
        store(key, lastInput.current);
        void refresh().catch(() => {});
      },
    });
  const streaming = status === "submitted" || status === "streaming";
  const busy = streaming || uploading;
  useEffect(() => {
    onBusy(busy);
    return () => onBusy(false);
  }, [busy, onBusy]);
  useEffect(() => {
    setInput(read(key));
  }, [key]);
  useEffect(() => {
    if (nearBottom.current && feed.current)
      feed.current.scrollTop = feed.current.scrollHeight;
  }, [messages]);
  useEffect(() => {
    if (!busy) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [busy]);
  useEffect(() => {
    if (data.run?.status !== "running" || streaming) return;
    const timer = setInterval(() => {
      void refresh().catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [data.run?.status, streaming, refresh]);
  function changeInput(value: string) {
    setInput(value);
    store(key, value);
  }
  async function upload(files: File[]) {
    validateFiles(files, data.attachments.length);
    const form = new FormData();
    form.set("skillId", task.id);
    files.forEach((f) => form.append("files", f));
    const result = await requestJSON<{ attachments: Attachment[] }>(
      "/api/cookbook/workspace/attachments",
      { method: "POST", body: form },
    );
    setData((current) => ({
      ...current,
      attachments: [...current.attachments, ...result.attachments],
    }));
    return result.attachments;
  }
  async function submit(value = input, files = draftFiles) {
    if (lock.current || busy || !value.trim() || task.archived_at) return;
    lock.current = true;
    setNotice("");
    clearError();
    lastInput.current = value;
    try {
      setUploading(true);
      const uploaded = files.length ? await upload(files) : [];
      setDraftFiles([]);
      const id = crypto.randomUUID();
      runId.current = id;
      setData((current) => ({ ...current, run: undefined }));
      changeInput("");
      setUploading(false);
      await sendMessage(
        { text: value },
        {
          body: {
            taskId: task.id,
            requestId: id,
            attachmentIds: [...data.attachments, ...uploaded].map((a) => a.id),
          },
        },
      );
    } catch (error) {
      changeInput(value);
      setNotice(messageOf(error));
    } finally {
      lock.current = false;
      setUploading(false);
    }
  }
  useEffect(() => {
    if (initial && !started.current) {
      started.current = true;
      setDraftFiles(initial.files);
      void submit(initial.text, initial.files);
      onConsumed();
    }
  }, [initial]);
  async function cancel() {
    const id = runId.current || data.run?.id;
    if (!id) return;
    try {
      await requestJSON(
        "/api/cookbook/workspace/run",
        json({ runId: id }, "PATCH"),
      );
      await stop();
      lock.current = false;
      await refresh();
      setNotice("Stopped. Saved drafts remain available.");
    } catch (error) {
      setNotice(messageOf(error));
    }
  }
  const skill =
    (task.skill_slug === marketingChat.slug ? marketingChat : undefined) ||
    catalog.find((s) => s.slug === task.skill_slug) ||
    catalog.find((s) => s.name === task.title);
  return (
    <div className={`cw-task-body ${panel ? "cw-panel-open" : ""}`}>
      <div className="cw-chat-pane">
        <div className="cw-conversation-heading">
          <span>{skill?.name || "Choose a skill for this legacy task"}</span>
          <button onClick={() => setPanel(true)}>
            Open {task.document ? "draft" : "workspace"} ▤
          </button>
        </div>
        <div
          className="cw-feed"
          ref={feed}
          onScroll={() => {
            const e = feed.current;
            if (e)
              nearBottom.current =
                e.scrollHeight - e.scrollTop - e.clientHeight < 100;
          }}
        >
          {!messages.length && (
            <div className="cw-task-welcome">
              <span className="cw-avatar">C</span>
              <h2>Let’s make {task.title.toLowerCase()}.</h2>
              <p>
                {skill?.description ||
                  "Select the right recipe below to continue this existing task."}
              </p>
              <p>
                Share the outcome you want and any useful context. I’ll put the
                work in your draft workspace.
              </p>
            </div>
          )}
          {!skill && (
            <label>
              Recipe for this task
              <select
                defaultValue=""
                onChange={async (e) => {
                  try {
                    await requestJSON(
                      "/api/cookbook/workspace/task",
                      json({ taskId: task.id, slug: e.target.value }, "PATCH"),
                    );
                    await refresh();
                  } catch (error) {
                    setNotice(messageOf(error));
                  }
                }}
              >
                <option value="" disabled>
                  Choose a skill
                </option>
                {catalog.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {messages.map((message) => (
            <article
              className={`cw-message cw-${message.role}`}
              key={message.id}
            >
              <span className="cw-message-label">
                {message.role === "user" ? "You" : "Cookbook"}
              </span>
              {message.parts.map((part, index) => {
                if (part.type === "text")
                  return <Markdown key={index} value={part.text} />;
                if (
                  part.type === "tool-askQuestion" &&
                  part.state === "output-available"
                )
                  return (
                    <div className="cw-question" key={index}>
                      <p>{part.output.prompt}</p>
                      <div>
                        {part.output.options.map((option) => (
                          <button
                            disabled={busy}
                            onClick={() => void submit(option)}
                            key={option}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <small>Or type your own answer below.</small>
                    </div>
                  );
                if (part.type === "tool-loadSkill")
                  return <div className="cw-tool" key={index}>
                    {part.state === "output-available" ? `Using ${part.output.name}` : part.state === "output-error" ? "Skill could not be loaded." : "Loading relevant skill…"}
                  </div>;
                if (part.type === "tool-scrapeWebsite")
                  return (
                    <details
                      className="cw-tool"
                      key={index}
                      open={part.state === "output-error"}
                    >
                      <summary>
                        {part.state === "output-available"
                          ? `Research complete · ${part.output.pageCount} pages`
                          : part.state === "output-error"
                            ? "Research failed"
                            : "Reading website…"}
                      </summary>
                      {part.state === "output-available" && (
                        <>
                          {part.output.pages.map(
                            (page) =>
                              safeLink(page.url) && (
                                <a
                                  className="cw-source"
                                  key={page.url}
                                  href={safeLink(page.url)!}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {page.title || page.url}
                                </a>
                              ),
                          )}
                          {!!part.output.failedPages.length && (
                            <p>
                              {part.output.failedPages.length} pages could not
                              be read.
                            </p>
                          )}
                        </>
                      )}
                      {part.state === "output-error" && (
                        <p>
                          Try another URL or continue with your own evidence.
                        </p>
                      )}
                    </details>
                  );
                if (part.type === "tool-saveSkillMarkdown")
                  return (
                    <div className="cw-tool" key={index}>
                      {part.state === "output-available" ? (
                        <button onClick={() => setPanel(true)}>
                          Draft v{part.output.version} saved · Review →
                        </button>
                      ) : part.state === "output-error" ? (
                        "Draft could not be saved. Retry or check for newer edits."
                      ) : (
                        "Updating draft…"
                      )}
                    </div>
                  );
                return null;
              })}
            </article>
          ))}
          {streaming && (
            <p className="cw-running" role="status">
              {status === "submitted"
                ? "Reviewing your request…"
                : "Cookbook is working…"}{" "}
              Keep this page open.
            </p>
          )}
          {(error || notice) && (
            <div className="cw-error" role="alert">
              {notice ||
                "This run did not finish. Your prompt and saved work are retained."}
              {error && (
                <button
                  disabled={busy}
                  onClick={() => void submit(lastInput.current || input)}
                >
                  Retry request
                </button>
              )}
            </div>
          )}
          {data.run &&
            ["failed", "interrupted", "cancelled"].includes(data.run.status) &&
            !streaming && (
              <div className="cw-notice">
                <p>
                  Run {data.run.status}.{" "}
                  {data.run.error ||
                    "Saved work is available in the workspace."}
                </p>
                <button
                  disabled={busy}
                  onClick={() => changeInput(data.run!.input)}
                >
                  Review request and retry
                </button>
              </div>
            )}
          {data.run?.status === "running" && !streaming && (
            <div className="cw-notice">
              This task has an active run.{" "}
              <button onClick={() => void cancel()}>Stop run</button>
            </div>
          )}
          {task.archived_at && (
            <p className="cw-notice">
              This task is archived. Restore it in Task settings to continue.
            </p>
          )}
        </div>
        <div className="cw-compose-area">
          <Composer
            value={input}
            onChange={changeInput}
            onSubmit={() => void submit()}
            skill={skill?.name || "Choose a skill"}
            busy={streaming}
            disabled={
              uploading ||
              !skill ||
              Boolean(task.archived_at) ||
              (!streaming && data.run?.status === "running")
            }
            onStop={() => void cancel()}
            attachments={data.attachments}
            files={draftFiles}
            onRemoveFile={(index) =>
              setDraftFiles((current) => current.filter((_, i) => i !== index))
            }
            onFiles={(files) => {
              try {
                validateFiles(
                  [...draftFiles, ...files],
                  data.attachments.length,
                );
                setDraftFiles((current) => [...current, ...files]);
              } catch (error) {
                setNotice(messageOf(error));
              }
            }}
            onRemove={async (id) => {
              setUploading(true);
              try {
                await requestJSON(
                  `/api/cookbook/workspace/attachments?id=${id}`,
                  { method: "DELETE" },
                );
                await refresh();
              } catch (error) {
                setNotice(messageOf(error));
              } finally {
                setUploading(false);
              }
            }}
            enterSends={enterSends}
          />
        </div>
      </div>
      {panel && (
        <Artifact
          task={task}
          versions={data.versions}
          busy={busy}
          onRefresh={refresh}
          onClose={() => setPanel(false)}
        />
      )}
    </div>
  );
}
