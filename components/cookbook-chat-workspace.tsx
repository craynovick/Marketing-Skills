"use client";
import { DecisionCard } from "./cookbook/decision-card";
import { QuickStart } from "./cookbook/quick-start";
import { answerText, defaultMode, entryCard, entryUrl, modeOf, quickStart, validMode, validWorkflow, workflows, type ChatMode, type CreateWorkflow, type DecisionAnswer, type SavedDecision } from "@/lib/cookbook-experience";
import Image from "next/image";
import cookbookLogo from "@/content/media/cookbook_logo_concept_2_ramen_chopsticks.svg";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { WorkflowChatTransport } from "@ai-sdk/workflow/client";
import { BrandFeatures } from "./cookbook/feature-context";
import { Adaptations } from "./cookbook/adaptations";
import { NewBrand } from "./cookbook/new-brand";
import type { BrandProject } from "@/lib/cookbook-projects";
import { BrandManager, BrandProposalCard } from "./cookbook/brand";
import { foundations, taskStatus } from "@/lib/cookbook-foundations";
import type { BrandState } from "@/lib/cookbook-brand-server";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { marketingChat } from "@/lib/cookbook-chat";
import { activeRunLifecycle, runLifecycle, terminalRunLifecycle, type RunLifecycle } from "@/lib/cookbook-run-lifecycle";
import { skills as catalog } from "@/lib/generated-skill-catalog";
import type { CookbookMessage } from "@/lib/cookbook-agent";
import { Composer } from "./cookbook/composer";
import { PanelToggle } from "./cookbook/panel-toggle";
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
  decisions: SavedDecision[];
  brand: BrandState | null;
};
type Initial = { text: string; files: File[]; answer?: DecisionAnswer };
function CookbookAvatar() {
  return (
    <Image
      className="cw-avatar"
      src={cookbookLogo}
      alt="Cookbook"
      width={64}
      height={52}
    />
  );
}

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

type WorkspaceProps = {
  initialSkillSlug?: string; initialMode?: ChatMode; initialWorkflow?: CreateWorkflow;
  initialTaskId?: string; initialProjectId?: string; initialPrompt?: string; durableEnabled?: boolean; initialBrandView?: boolean;
};
export function CookbookChatWorkspace(props: WorkspaceProps) {
  const [features, setFeatures] = useState(false);
  const [brands, setBrands] = useState<BrandProject[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState(props.initialTaskId);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const drafts = useRef(new Map<string, File[]>());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [setup, setSetup] = useState(false);
  const [switched, setSwitched] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    requestJSON<{brands: BrandProject[]; taskProjectId?: string; enabled: boolean}>(`/api/cookbook/brands${props.initialTaskId ? `?taskId=${props.initialTaskId}` : ""}`, { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        setBrands(result.brands); setFeatures(result.enabled);
        const requested = result.taskProjectId || props.initialProjectId || read("cookbook:active-brand");
        const selected = result.brands.find(b => b.id === requested)?.id || result.brands[0]?.id || "";
        setProjectId(selected); store("cookbook:active-brand", selected);
      }).catch(error => {
        if (controller.signal.aborted) return;
        if (error.status === 401) setProjectId(""); else setError(messageOf(error));
      });
    return () => controller.abort();
  }, [props.initialTaskId, props.initialProjectId, attempt]);
  if (error) return <div className="cw-empty"><p role="alert">{error}</p><button onClick={() => { setError(""); setAttempt(v => v + 1); }}>Retry</button></div>;
  if (projectId === null) return <div className="cw-empty" role="status">Opening your brands…</div>;
  return <BrandFeatures.Provider value={features}><BrandWorkspace key={projectId} {...props} initialTaskId={taskId} initialProjectId={projectId} brands={brands}
    initialSkillSlug={setup ? quickStart[0].slug : props.initialSkillSlug}
    initialMode={setup ? "skill-tuning" : props.initialMode}
    initialPrompt={props.initialPrompt}
    initialBrandView={setup ? false : switched || props.initialBrandView}
    initialFiles={selectedFiles}
    onFilesStored={files => drafts.current.set(projectId, files)}
    onSwitchBrand={(id, created, files) => {
      if (created) setBrands(current => [...current, created]);
      if (files) drafts.current.set(id, files);
      setSelectedFiles(drafts.current.get(id) || []);
      setTaskId(undefined); setSetup(!!created); setSwitched(true); store("cookbook:active-brand", id);
      history.pushState(null, "", `/create?projectId=${id}${created ? "&mode=skill-tuning&skill=audience-strategy-playbook" : "&view=cookbook"}`);
      setProjectId(id);
    }} /></BrandFeatures.Provider>;
}

function BrandWorkspace({
  brands, onSwitchBrand, initialFiles, onFilesStored,
  initialProjectId = "",
  initialSkillSlug,
  initialMode,
  initialWorkflow,
  initialTaskId,
  initialPrompt = "",
  durableEnabled = false,
  initialBrandView = false,
}: {
  brands: BrandProject[];
  onSwitchBrand: (id: string, created?: BrandProject, files?: File[]) => void;
  initialFiles: File[];
  onFilesStored: (files: File[]) => void;
  initialProjectId?: string;
  initialSkillSlug?: string;
  initialMode?: ChatMode;
  initialWorkflow?: CreateWorkflow;
  initialTaskId?: string;
  initialPrompt?: string;
  durableEnabled?: boolean;
  initialBrandView?: boolean;
}) {
  const features = useContext(BrandFeatures);
  const projectId = initialProjectId;
  const newBrand = useRef<HTMLDialogElement>(null);
  const [newBrandOpen, setNewBrandOpen] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  function openNewBrand() { if (account === "signed-out") { signIn(); return; } setNewBrandOpen(true); newBrand.current?.showModal(); }
  const [mode, setMode] = useState<ChatMode>(initialMode || defaultMode(initialSkillSlug));
  const [workflow, setWorkflow] = useState<CreateWorkflow>(initialWorkflow || "general");
  const [brandLoading, setBrandLoading] = useState(true);
  const [hostedWorkflows, setHostedWorkflows] = useState(true);
  const [brandView, setBrandView] = useState(initialBrandView);
  const [brand, setBrand] = useState<BrandState | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const uploadSetup = useRef<HTMLInputElement>(null);
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
  const [composerFocus, setComposerFocus] = useState(0);
  const [files, setFiles] = useState<File[]>(initialFiles);
  useEffect(() => { onFilesStored(files); }, [files, onFilesStored]);
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
      const data = await requestJSON<{ skills: Task[]; hostedWorkflows?: boolean; nextCursor?: string | null }>(
        `/api/cookbook/workspace?projectId=${projectId}&archived=${archived}`,
      );
      if (!mounted.current) return;
      setTasks((current) => [
        ...current.filter((task) => Boolean(task.archived_at) !== archived && !data.skills.some((incoming) => incoming.id === task.id)),
        ...data.skills,
      ]);
      setHostedWorkflows(data.hostedWorkflows !== false);
      setNextCursor(data.nextCursor || null);
      setAccount("ready");
    } catch (error) {
      setAccount(
        (error as { status?: number }).status === 401 ? "signed-out" : "error",
      );
      setNotice(messageOf(error));
    }
  }, [archived, projectId]);
  const loadBrand = useCallback(async () => {
    try { const next = await requestJSON<BrandState>(`/api/cookbook/foundations?projectId=${projectId}`); if (mounted.current) setBrand(next); } catch { /* Account state provides recovery. */ } finally { setBrandLoading(false); }
  }, [projectId]);
  useEffect(() => { void loadBrand(); window.addEventListener("cookbook-brand-changed", loadBrand); return () => window.removeEventListener("cookbook-brand-changed", loadBrand); }, [loadBrand]);
  async function moreTasks() {
    if (!nextCursor) return;
    try { const page = await requestJSON<{skills:Task[];nextCursor:string|null}>(`/api/cookbook/workspace?projectId=${projectId}&archived=${archived}&before=${encodeURIComponent(nextCursor)}`);
      setTasks(current=>[...current,...page.skills.filter(t=>!current.some(c=>c.id===t.id))]); setNextCursor(page.nextCursor);
    } catch(error) {setNotice(messageOf(error));}
  }
  useEffect(() => {
    void load();
    setInput(initialPrompt || read(`cookbook:new:${projectId}:input`));
    try {
      setCollapsed(localStorage.getItem("cookbook:collapsed") === "true");
      setEnterSends(localStorage.getItem("cookbook:enterSends") !== "false");
    } catch {}
  }, [load, initialPrompt, projectId]);
  useEffect(() => {
    function pop() {
      const params = new URL(location.href).searchParams;
      if ((params.get("projectId") && params.get("projectId") !== projectId) || params.get("task")) { location.reload(); return; }
      setSlug(params.get("skill") || "");
      setMode(validMode(params.get("mode")) ? params.get("mode") as ChatMode : defaultMode(params.get("skill")));
      setWorkflow(validWorkflow(params.get("workflow")) ? params.get("workflow") as CreateWorkflow : "general");
      setActiveId(params.get("task") || "");
      setBrandView(new URL(location.href).searchParams.get("view") === "cookbook");
    }
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  function changeInput(value: string) {
    setInput(value);
    store(`cookbook:new:${projectId}:input`, value);
  }
  function select(id: string) {
    if (busy || pending) return;
    setInitial(null);
    setBrandView(false);
    setActiveId(id);
    setNotice("");
    history.pushState(null, "", id ? `/create?task=${id}` : "/create?legacy=1");
    drawer.current?.close();
  }
  const updateTask = useCallback((task: Task) => {
    if (!mounted.current || task.project_id !== projectId) return;
    setTasks((current) =>
      current.some((t) => t.id === task.id)
        ? current.map((t) => (t.id === task.id ? task : t))
        : [task, ...current],
    );
  }, [projectId]);
  const consumeInitial = useCallback(() => setInitial(null), []);
  function showBrand() { setBrandView(true); history.pushState(null, "", `/create?projectId=${projectId}&view=cookbook`); drawer.current?.close(); }
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
    store(`cookbook:new:${projectId}:input`, input);
    location.assign(
      `/sign-in?next=${encodeURIComponent(activeId ? `/create?task=${activeId}` : entryUrl(mode, workflow, slug))}`,
    );
  }
  async function createTask(selected: string, prompt: Initial | null, contextScope: "brand" | "task" = "brand") {
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
          contextScope, mode, workflow, projectId,
        }),
      );
      if (!mounted.current) return;
      creationKey.current = crypto.randomUUID();
      setBrandView(false);
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
    if (!projectId) { openNewBrand(); return; }
    await createTask(slug || (hostedWorkflows ? marketingChat.slug : "brand-positioning-workshop"), { text: input.trim(), files });
  }

  function chooseEntry(nextMode: ChatMode, nextWorkflow: CreateWorkflow = "general", nextSlug = "") {
    if (busy || pending) return;
    const existing = nextMode === "skill-tuning" && nextSlug ? [...tasks, ...(brand?.legacy || [])].find(t => t.skill_slug === nextSlug && modeOf(t) === "skill-tuning" && !t.archived_at) : undefined;
    if (existing) { updateTask(existing); select(existing.id); return; }
    setInitial(null); setBrandView(false); setActiveId(""); setMode(nextMode); setWorkflow(nextWorkflow); setSlug(nextSlug); setNotice("");
    if (nextMode === "create") setComposerFocus(value => value + 1);
    history.pushState(null, "", `${entryUrl(nextMode, nextWorkflow, nextSlug)}&projectId=${projectId}`);
    picker.current?.close(); drawer.current?.close();
  }
  const welcomeCard = entryCard(mode, workflow, slug, Boolean(brand?.intakeReady));
  const selectedRecipe = slug ? catalog.find(item => item.slug === slug) : undefined;
  async function answerWelcome(answer: DecisionAnswer) {
    if (!projectId && account === "ready") { openNewBrand(); return; }
    const text = answerText(welcomeCard, answer);
    if (account === "signed-out") { store(`cookbook:new:${projectId}:input`, `${welcomeCard.prompt}\n${text}`); location.assign(`/sign-in?next=${encodeURIComponent(entryUrl(mode, workflow, slug))}`); return; }
    await createTask(slug || marketingChat.slug, { text: `${welcomeCard.prompt}\n${text}`, files, answer });
  }
  async function taskAction(target: Task, changes: Record<string, unknown>) {
    setPending(true);
    try {
      const data = await requestJSON<{ skill: Task }>(
        "/api/cookbook/workspace/task",
        json({ taskId: target.id, ...changes }, "PATCH"),
      );
      updateTask({ ...target, ...data.skill });
      taskMenu.current?.close();
      if (changes.archived && target.id === activeId) selectAfterArchive();
    } catch (error) {
      setNotice(messageOf(error));
    } finally {
      setPending(false);
    }
  }
  function selectAfterArchive() {
    setActiveId("");
    history.pushState(null, "", "/create?legacy=1");
  }
  const sidebar = (
    <Sidebar
      tasks={tasks}
      activeId={activeId}
      busy={busy || pending}
      archived={archived}
      onBrand={showBrand}
      onMore={nextCursor ? () => void moreTasks() : undefined}
      onArchiveView={() => setArchived((v) => !v)}
      onSelect={select}
      onTaskAction={(task, changes) => void taskAction(task, changes)}
      onNew={() => {
        chooseEntry("create");
      }}
      onSettings={() => settings.current?.showModal()}
      onClose={() => {
        if (drawer.current?.open) drawer.current.close();
        else {
          setCollapsed(true);
          store("cookbook:collapsed", "true");
        }
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
          <PanelToggle
            className="cw-navigation-open"
            side="left"
            expanded={false}
            label="Open navigation"
            onClick={navigation}
          />
          <button
            className="cw-task-title"
            disabled={!active || busy || pending}
            onClick={() => {
              setRename(active?.title || "");
              taskMenu.current?.showModal();
            }}
          >
            {brandView ? "Your Cookbook" : active?.title || "New chat"}
            {active && <span aria-hidden="true">⌄</span>}
          </button>
          <label className="cw-brand-selector"><span className="cw-sr-only">Active brand</span><select aria-label="Active brand" value={projectId} disabled={pending} onChange={e => onSwitchBrand(e.target.value)}>
            {!brands.length && <option value="">Choose a brand</option>}
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select></label>
          <button className="cw-add-brand" disabled={!features} onClick={openNewBrand} aria-label="New brand" title="New brand">＋<span> New brand</span></button>

          <span className="cw-header-status" role="status">
            {busy
              ? "Working…"
              : account === "loading"
                ? "Connecting…"
                : account === "error"
                  ? "Connection unavailable"
                : account === "signed-out"
                  ? "Sign in to create and save"
                  : active ? taskStatus(active) : "Ready to create"}
          </span>
          {account === "signed-out" && (
            <button className="cw-primary" onClick={signIn}>
              Sign in
            </button>
          )}
        </header>
        {brandView ? (
          <BrandManager key={projectId} projectId={projectId} onBack={() => chooseEntry("create")} onNewBrand={openNewBrand} onSkill={selected => chooseEntry("skill-tuning", "general", selected)} />
        ) : activeId ? (
          <TaskLoader
            key={activeId}
            taskId={activeId}
            initial={initial}
            onUpdate={updateTask}
            onBusy={setBusy}
            onConsumed={consumeInitial}
            onEntry={chooseEntry}
            durableEnabled={durableEnabled}
            enterSends={enterSends}
          />
        ) : (
          <div className="cw-new-task">
            <div className="cw-welcome">
              <CookbookAvatar />
              {mode === "skill-tuning" && <p className="cw-eyebrow">COOKBOOK</p>}
              <h1>{mode === "skill-tuning" ? selectedRecipe?.name || "Shape your brand’s playbooks" : "What do you want to work on?"}</h1>
              <p>{mode === "skill-tuning" ? "Build on what your brand already knows. Review each playbook before it becomes shared context." : "Start with the work. Cookbook will ask only when a choice is needed."}</p>
              {!hostedWorkflows && mode === "create" && <p>Content workflows require a hosted plan. <a href="/pricing">View plans</a> or configure your brand in Cookbook.</p>}
              {mode === "create" ? <>
                <div className="cw-entry-shortcuts" aria-label="Start with a recipe">
                  <button aria-pressed={workflow === "social-post"} onClick={() => chooseEntry("create", "social-post")}>Social post</button>
                  <button aria-pressed={workflow === "newsletter"} onClick={() => chooseEntry("create", "newsletter")}>Newsletter</button>
                  <button aria-pressed={slug === "conversion-audit"} onClick={() => chooseEntry("create", "general", "conversion-audit")}>Improve a page</button>
                  <button onClick={() => { setQuery(""); picker.current?.showModal(); }}>More recipes</button>
                </div>
              </> : <>
                <QuickStart brand={brand} selected={slug} busy={pending} onSelect={selected => chooseEntry("skill-tuning", "general", selected)} />
                <button className="cw-browse-skills" onClick={() => picker.current?.showModal()}>Browse all skills →</button>
                {!brandLoading && !brand?.intakeReady && <div className="cw-intake-actions"><button onClick={() => changeInput("Analyze this website to propose my brand name and offer for review: https://")}>Analyze</button><button onClick={() => uploadSetup.current?.click()}>Upload brand materials</button><input hidden type="file" multiple accept=".pdf,.docx,.txt,.md" ref={uploadSetup} onChange={event => { try { const incoming = Array.from(event.target.files || []); validateFiles([...files, ...incoming]); setFiles(current => [...current, ...incoming]); changeInput("Use these materials to propose my brand name and offer, then guide me through audience strategy."); } catch(error) { setNotice(messageOf(error)); } event.target.value = ""; }} /></div>}
              </>}
              {mode === "skill-tuning" && !brandLoading && <DecisionCard key={`${mode}:${workflow}:${slug}:${brand?.intakeReady}`} card={welcomeCard} onBack={quickStart.findIndex(s => s.slug === slug) > 0 ? () => chooseEntry("skill-tuning", "general", quickStart[quickStart.findIndex(s => s.slug === slug) - 1].slug) : undefined} busy={pending || account === "loading" || account === "error"} onAnswer={answerWelcome} />}
              {mode === "skill-tuning" && brand?.quickStart?.every(s => s.confirmed) && <div className="cw-intake-actions"><button onClick={() => chooseEntry("skill-tuning", "general", "content-pillar-planner")}>Plan content themes</button><button onClick={() => chooseEntry("skill-tuning", "general", "content-format-planner")}>Tailor formats to your channels</button></div>}
              {brandLoading && <p role="status">Loading your brand context…</p>}

            </div>
            {(notice || account === "error") && (
              <div className="cw-notice" role="status">
                {notice || "Connection unavailable. Retry to reopen your workspace."}
                {account === "error" && (
                  <button onClick={() => void load()}>Retry connection</button>
                )}
              </div>
            )}
            {mode === "create" && selectedRecipe && slug !== "conversion-audit" && <div className="cw-recipe-chip"><span>{selectedRecipe.name}</span><button aria-label="Remove selected recipe" onClick={() => chooseEntry("create")}>×</button></div>}
            <Composer
              placeholder={mode === "skill-tuning" ? "Share what you know, or ask to refine your playbook…" : workflow === "analyze" ? "What would you like to research? Add a URL or question…" : "Share a topic, source, or the content you want to create…"}
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
              focusKey={composerFocus}
            />
            {pending && (
              <p className="cw-notice" role="status">
                Opening your conversation…
              </p>
            )}
          </div>
        )}
      </main>
      <dialog ref={newBrand} className="cw-modal" onClose={() => setNewBrandOpen(false)}>
        {newBrandOpen && <NewBrand onClose={() => newBrand.current?.close()} onCreated={(created, uploaded) => { newBrand.current?.close(); onSwitchBrand(created.id, created, uploaded); }} />}
      </dialog>
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
                  chooseEntry(mode === "skill-tuning" ? "skill-tuning" : defaultMode(s.slug), "general", s.slug);
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
            chooseEntry("create");
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
          onClick={() => active && void taskAction(active, { title: rename })}
        >
          Save name
        </button>
        <button
          disabled={pending}
          onClick={() => active && void taskAction(active, { archived: !active.archived_at })}
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
  durableEnabled,
  onEntry,
}: {
  taskId: string;
  initial: Initial | null;
  onUpdate: (task: Task) => void;
  onBusy: (busy: boolean) => void;
  onConsumed: () => void;
  enterSends: boolean;
  durableEnabled: boolean;
  onEntry: (mode: ChatMode, workflow?: CreateWorkflow, slug?: string) => void;
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
      durableEnabled={durableEnabled}
      onEntry={onEntry}
    />
  );
}

function RunStatusCard({
  lifecycle,
  reconnecting,
  run,
  error,
  onRetry,
  onReconnect,
  onStop,
}: {
  lifecycle: RunLifecycle | null;
  reconnecting: boolean;
  run?: Run;
  error?: Error;
  onRetry: () => void;
  onReconnect: () => void;
  onStop: () => void;
}) {
  const [now, setNow] = useState(0);
  const active = activeRunLifecycle(lifecycle);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [active]);
  if (!lifecycle || lifecycle === "completed" || lifecycle === "awaiting_input") return null;
  const origin = run?.created_at ? Date.parse(run.created_at) : now;
  const elapsedSeconds = now ? Math.max(0, Math.floor((now - origin) / 1_000)) : 0;
  const title = reconnecting
    ? "Reconnecting"
    : lifecycle === "starting"
      ? "Starting"
      : lifecycle === "queued"
        ? "Waiting for an agent"
        : lifecycle === "running"
          ? "Drafting"
          : lifecycle === "cancelled"
            ? "Run stopped"
            : "This run did not finish";
  const detail = reconnecting
    ? "Your work is still active. Cookbook is restoring the live connection."
    : lifecycle === "starting"
      ? "Preparing your request."
      : lifecycle === "queued"
        ? "Your request is queued and will start automatically."
        : lifecycle === "running"
          ? "Cookbook is working in the background. You can switch tasks safely."
          : run?.error || error?.message || "Your prompt and saved work are retained.";
  return (
    <section className={`cw-run-status ${active ? "is-active" : "is-terminal"}`} aria-live="polite">
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
        {active && elapsedSeconds >= 5 && <small>{elapsedSeconds}s elapsed{elapsedSeconds >= 15 ? " · You can leave this task and return later." : ""}</small>}
      </div>
      <div className="cw-run-actions">
        {reconnecting && <button className="cw-primary" onClick={onReconnect}>Reconnect</button>}
        {!active && <button className="cw-primary" onClick={onRetry}>Retry request</button>}
        {active && <button onClick={onStop}>Stop run</button>}
      </div>
    </section>
  );
}

function TaskThread({
  initialData,
  initial,
  onUpdate,
  onBusy,
  onConsumed,
  enterSends,
  durableEnabled,
  onEntry,
}: {
  initialData: ThreadData;
  initial: Initial | null;
  onUpdate: (task: Task) => void;
  onBusy: (busy: boolean) => void;
  onConsumed: () => void;
  enterSends: boolean;
  durableEnabled: boolean;
  onEntry: (mode: ChatMode, workflow?: CreateWorkflow, slug?: string) => void;
}) {
  const [data, setData] = useState(initialData);
  useEffect(() => { onUpdate(initialData.task); }, [initialData.task, onUpdate]);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const panelPreferenceKey = `cookbook:${initialData.task.id}:draft-panel`;
  const [panel, setPanel] = useState(Boolean(initialData.task.document));
  const [panelMounted, setPanelMounted] = useState(Boolean(initialData.task.document));
  const [mobileView, setMobileView] = useState<"chat" | "draft">("chat");
  const seenDocument = useRef(initialData.task.document?.id || "");
  const [draftFiles, setDraftFiles] = useState<File[]>([]);
  const runId = useRef(initialData.run?.id || "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [brandState, setBrandState] = useState<BrandState | null>(initialData.brand);
  const syncMessages = useRef<((messages: CookbookMessage[]) => void) | null>(null);
  const isStreaming = useRef(false);
  const resumed = useRef(false);
  const reconnectAttempts = useRef(0);
  const started = useRef(false);
  const lastInput = useRef("");
  const lock = useRef(false);
  const feed = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const task = data.task;
  const key = `cookbook:${task.id}:input`;
  const transport = useMemo(
    () => durableEnabled ? new WorkflowChatTransport<CookbookMessage>({ api: "/api/cookbook/runs",
      onChatSendMessage: () => { setAcknowledged(true); },
    }) : new DefaultChatTransport<CookbookMessage>({ api: "/api/chat" }),
    [durableEnabled, task.id],
  );
  const refresh = useCallback(async () => {
    const next = await requestJSON<ThreadData>(
      `/api/cookbook/workspace/thread?taskId=${initialData.task.id}`,
    );
    setData(next);
    if (!isStreaming.current) syncMessages.current?.(next.messages);
    onUpdate(next.task);
    setBrandState(next.brand);
    return next;
  }, [initialData.task.id, onUpdate, durableEnabled, task.id]);
  const { messages, sendMessage, status, error, clearError, stop, setMessages, resumeStream } =
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
        void refresh().catch(() => {});
      },
    });
  const streaming = status === "submitted" || status === "streaming";
  useEffect(() => {
    const wasStreaming = isStreaming.current;
    isStreaming.current = streaming;
    syncMessages.current = setMessages;
    if (wasStreaming && !streaming) void refresh().catch(error => setNotice(messageOf(error)));
  }, [streaming, setMessages, refresh]);
  const lifecycle = runLifecycle(data.run, status);
  const runActive = activeRunLifecycle(lifecycle);
  const runTerminal = terminalRunLifecycle(lifecycle);
  const reconnecting = durableEnabled && runActive && Boolean(error);
  const busy = uploading || runActive;
  useEffect(() => {
    if(durableEnabled && data.run && ["queued","running"].includes(data.run.status) && !resumed.current) {
      resumed.current=true;
      // Replay this run from its beginning, replacing its checkpointed assistant.
      setMessages(data.messages.filter(m=>m.id!==`${data.run!.id}:assistant`));
      void resumeStream();
    }
  }, [durableEnabled, task.id, data.run, data.messages, setMessages, resumeStream]);
  useEffect(() => {
    if (!durableEnabled || !error || !runActive) {
      if (!error) reconnectAttempts.current = 0;
      return;
    }
    if (reconnectAttempts.current >= 5) return;
    const attempt = reconnectAttempts.current++;
    const delay = Math.min(8_000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
    const timer = window.setTimeout(async () => {
      try {
        const next = await refresh();
        if (!next.run || !["queued", "running"].includes(next.run.status)) return;
        clearError();
        await resumeStream();
      } catch {
        // The next persisted-status poll or bounded reconnect attempt retries.
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [durableEnabled, error, runActive, refresh, clearError, resumeStream]);
  useEffect(() => {
    const retained = data.run?.input || lastInput.current;
    if (!runTerminal || !retained || input) return;
    changeInput(retained);
  }, [runTerminal, data.run?.input, error]);
  useEffect(() => {
    onBusy(durableEnabled ? uploading || (status === "submitted" && !acknowledged) : busy);
    return () => onBusy(false);
  }, [busy, onBusy, durableEnabled, uploading, status, acknowledged]);
  useEffect(() => {
    setInput(read(key));
  }, [key]);
  useEffect(() => {
    if (!initialData.task.document) return;
    try {
      if (localStorage.getItem(panelPreferenceKey) === "hidden") setPanel(false);
    } catch {}
  }, [initialData.task.document, panelPreferenceKey]);
  useEffect(() => {
    if (nearBottom.current && feed.current)
      feed.current.scrollTop = feed.current.scrollHeight;
  }, [messages]);
  useEffect(() => {
    const next = task.document?.id || "";
    if (next && next !== seenDocument.current) {
      setPanelMounted(true);
      let hidden = false;
      try { hidden = localStorage.getItem(panelPreferenceKey) === "hidden"; } catch {}
      if (!hidden) setPanel(true);
    }
    if (next) seenDocument.current = next;
  }, [task.document?.id, panelPreferenceKey]);
  function showDraft() {
    setPanelMounted(true);
    setPanel(true);
    setMobileView("draft");
    try { localStorage.setItem(panelPreferenceKey, "visible"); } catch {}
  }
  function hideDraft() {
    setPanel(false);
    setMobileView("chat");
    try { localStorage.setItem(panelPreferenceKey, "hidden"); } catch {}
  }
  useEffect(() => {
    if (!busy || durableEnabled) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [busy, durableEnabled]);
  useEffect(() => {
    if (!runActive || streaming) return;
    const timer = setInterval(() => {
      void refresh().catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [runActive, streaming, refresh]);
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
  async function submit(value = input, files = draftFiles, requestId?: string) {
    if (lock.current || busy || !value.trim() || task.archived_at) return;
    const unanswered = data.decisions.filter(d => !d.answer).at(-1);
    if (!requestId && unanswered) { await respondDecision(unanswered, { text: value }, files); return; }
    lock.current = true;
    setNotice("");
    clearError();
    lastInput.current = value;
    let handingOff = false;
    try {
      setUploading(true);
      const uploaded = files.length ? await upload(files) : [];
      setDraftFiles([]);
      setAcknowledged(false);
      const id = requestId || crypto.randomUUID();
      runId.current = id;
      setData((current) => ({ ...current, run: undefined }));
      changeInput("");
      setUploading(false);
      handingOff = true;
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
      if (!durableEnabled || !handingOff) setNotice(messageOf(error));
    } finally {
      lock.current = false;
      setUploading(false);
    }
  }
  useEffect(() => {
    if (initial && !started.current) {
      started.current = true;
      setDraftFiles(initial.files);
      if (initial.answer) void respondDecision({ id: "entry", card: entryCard(modeOf(task), task.create_workflow || "general", task.skill_slug, task.context_scope === "task" || initialData.brand?.intakeReady), answer: null, revision: 0 }, initial.answer, initial.files).catch(error => setNotice(messageOf(error)));
      else void submit(initial.text, initial.files);
      onConsumed();
    }
  }, [initial]);
  const decisionRequests = useRef(new Map<string, { payload: string; id: string }>());
  async function respondDecision(decision: SavedDecision, answer: DecisionAnswer, files: File[] = []) {
    const payload = JSON.stringify(answer);
    const previous = decisionRequests.current.get(decision.id);
    const requestId = previous?.payload === payload ? previous.id : crypto.randomUUID();
    decisionRequests.current.set(decision.id, { payload, id: requestId });
    const result = await requestJSON<{ decision: SavedDecision; prompt: string }>("/api/cookbook/decisions", json({ taskId: task.id, decisionId: decision.id, revision: decision.revision, answer, requestId }));
    setData(current => ({ ...current, decisions: [...current.decisions.filter(d => d.id !== decision.id), result.decision] }));
    await submit(result.prompt, files, requestId);
  }
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
      setNotice("");
    } catch (error) {
      setNotice(messageOf(error));
    }
  }
  async function reconnect() {
    setNotice("");
    clearError();
    reconnectAttempts.current = 0;
    const next = await refresh();
    if (next.run && ["queued", "running"].includes(next.run.status))
      await resumeStream();
  }
  async function continueOnboarding() {
    const state = await requestJSON<BrandState>(`/api/cookbook/foundations?projectId=${task.project_id}`);
    setBrandState(state);
    window.dispatchEvent(new Event("cookbook-brand-changed"));
    const next = quickStart.find(s => !state.quickStart?.find(p => p.slug === s.slug)?.confirmed);
    if (next && next.slug !== task.skill_slug) onEntry("skill-tuning", "general", next.slug);
    else if (next) await submit("The proposed context is approved. Continue this skill using those facts; ask only the next missing material question.");
    else onEntry("create");
  }
  const skill =
    (task.skill_slug === marketingChat.slug ? marketingChat : undefined) ||
    catalog.find((s) => s.slug === task.skill_slug) ||
    catalog.find((s) => s.name === task.title);
  return (
    <div className={`cw-task-body ${panel ? "cw-panel-open" : ""} cw-mobile-${mobileView}`}>
      {panel && <nav className="cw-workspace-tabs" aria-label="Workspace view"><button aria-pressed={mobileView === "chat"} onClick={() => setMobileView("chat")}>Chat</button><button aria-pressed={mobileView === "draft"} onClick={() => setMobileView("draft")}>Draft{task.document ? ` · v${task.document.version}` : ""}</button></nav>}
      <div className="cw-chat-pane">
        <div className="cw-conversation-heading">
          <span>{task.context_scope === "task" ? "This brief only · Brand memory excluded" : skill?.name || "Choose a skill for this legacy task"}</span>
          {!panel && <PanelToggle side="right" expanded={false} label="Open draft workspace" onClick={showDraft} />}
        </div>
        {modeOf(task) === "skill-tuning" && <QuickStart brand={brandState} selected={task.skill_slug} busy={busy} onSelect={slug => onEntry("skill-tuning", "general", slug)} />}
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
              <CookbookAvatar />
              {modeOf(task) === "skill-tuning" && <p className="cw-eyebrow">COOKBOOK</p>}
              <h2>{modeOf(task) === "skill-tuning" ? `Let’s shape your ${skill?.name || "playbook"}` : workflows.find(w => w.id === task.create_workflow)?.name || "What would you like to create?"}</h2>
              <p>{skill?.description}</p>
              {!data.decisions.length && <DecisionCard card={entryCard(modeOf(task), task.create_workflow || "general", task.skill_slug, task.context_scope === "task" || brandState?.intakeReady)} busy={busy} onAnswer={answer => respondDecision({ id: "entry", card: entryCard(modeOf(task), task.create_workflow || "general", task.skill_slug, task.context_scope === "task" || brandState?.intakeReady), answer: null, revision: 0 }, answer)} />}

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
          {data.decisions.filter(d => d.id === "entry").map(d => <DecisionCard key={`${d.id}:${d.revision}`} card={d.card} answer={d.answer} busy={busy} onAnswer={answer => respondDecision(d, answer)} />)}
          {modeOf(task) === "skill-tuning" && task.document && <details className="cw-brand-proposal"><summary>Review your {skill?.name || "playbook"} · v{task.document.version}</summary><Markdown value={task.document.content} /><button className="cw-primary" disabled={busy || task.document.id === task.accepted_version_id} onClick={async () => { try { await requestJSON("/api/cookbook/workspace/accept", json({ skillId: task.id, version: task.document!.version })); await refresh(); await continueOnboarding(); } catch(error) { setNotice(messageOf(error)); } }}>{task.document.id === task.accepted_version_id ? "Approved" : "Approve and continue"}</button><button onClick={showDraft}>Edit or export</button></details>}
          {data.decisions.filter(d => d.id !== "entry" && !messages.some(m => m.parts.some(p => (p.type === "tool-askQuestion" || p.type === "dynamic-tool" && p.toolName === "askQuestion") && p.state === "output-available" && (p.output as {id?: string})?.id === d.id))).map(d => <DecisionCard key={`${d.id}:${d.revision}`} card={d.card} answer={d.answer} busy={busy} onAnswer={answer => respondDecision(d, answer)} />)}
          {task.source_task_id && <p className="cw-notice"><a href={`/create?task=${task.source_task_id}`}>Original draft →</a>{task.sourceChanged && " Source changed since this adaptation. Review before using."}</p>}
          {task.document && task.create_workflow === "social-post" && !task.source_task_id && <Adaptations task={task} busy={busy} durable={durableEnabled} />}
          {task.reviewSuggested && <p className="cw-notice" role="status">Review suggested: approved brand context has changed. <button disabled={busy} onClick={() => void submit("Review this draft against the latest approved brand context. Propose only the affected changes and preserve approvals.")}>Review changes</button></p>}
          {messages.map((message) => (
            <article
              className={`cw-message cw-${message.role}`}
              key={message.id}
            >
              <span className="cw-message-label">
                {message.role === "user" ? "You" : "Cookbook"}
              </span>
              {message.parts.map((rawPart, index) => {
                const part = (rawPart.type === "dynamic-tool" ? {...rawPart, type: `tool-${rawPart.toolName}`} : rawPart) as CookbookMessage["parts"][number];
                if (part.type === "tool-proposeBrandUpdates") {
                  const proposal = part.state === "output-available" ? brandState?.proposals.find(p=>p.id===part.output.proposalId) : undefined;
                  return proposal ? <BrandProposalCard key={index} proposal={proposal} busy={busy} onRefresh={async () => { await refresh(); }} approveLabel={modeOf(task) === "skill-tuning" ? "Approve and continue" : undefined} onDecision={async action => { if (action === "kept") await continueOnboarding(); }} /> : <div className="cw-tool" key={index}>{part.state === "output-available" ? <button onClick={()=>void refresh()}>Brand drafts saved · Review</button> : part.state === "output-error" || !busy ? "Brand update did not finish. Confirmed context is unchanged." : "Preparing brand updates…"}</div>;
                }
                if (part.type === "tool-useTaskOnlyContext") return <div className="cw-tool" key={index}>Using this brief only · Account brand context excluded</div>;
                if (part.type === "text")
                  return <Markdown key={index} value={part.text} />;
                if (
                  part.type === "tool-askQuestion" &&
                  part.state === "output-available"
                )
                  return (() => {
                    const saved = data.decisions.find(d => d.id === part.output.id);
                    if (!part.output.id || !Array.isArray(part.output.options) || part.output.options.some(o => typeof o !== "object")) return <div key={index} className="cw-question"><p>{part.output.prompt}</p><small>Reply in the message box below.</small></div>;
                    const decision = saved || { id: part.output.id, card: part.output, answer: null, revision: 0 };
                    return <DecisionCard key={`${index}:${decision.revision}`} card={decision.card} answer={decision.answer} busy={busy} onAnswer={answer => respondDecision(decision, answer)} />;
                  })();
                if (part.type === "tool-loadSkill")
                  return <div className="cw-tool" key={index}>
                    {part.state === "output-available" ? `Using ${part.output.name}` : part.state === "output-error" ? "Skill could not be loaded." : busy ? "Loading relevant skill…" : "Skill loading stopped."}
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
                            : busy ? "Reading website…" : "Research stopped"}
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
                        <button onClick={showDraft}>
                          Draft v{part.output.version} saved · Review →
                        </button>
                      ) : part.state === "output-error" ? (
                        "Draft could not be saved. Retry or check for newer edits."
                      ) : (
                        busy ? "Updating draft…" : "Draft save did not finish."
                      )}
                    </div>
                  );
                return null;
              })}
            </article>
          ))}
          {durableEnabled ? (
            <RunStatusCard
              lifecycle={lifecycle}
              reconnecting={reconnecting}
              run={data.run}
              error={error}
              onRetry={() => void submit(data.run?.input || lastInput.current || input)}
              onReconnect={() => void reconnect().catch((error) => setNotice(messageOf(error)))}
              onStop={() => void cancel()}
            />
          ) : streaming ? (
            <p className="cw-running" role="status">Cookbook is working… Keep this page open.</p>
          ) : null}
          {notice && (
            <div className="cw-error" role="alert">
              {notice}
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
            placeholder={modeOf(task) === "skill-tuning" ? "Answer here, add evidence, or refine your playbook…" : "Share your brief or ask for a revision…"}
            value={input}
            onChange={changeInput}
            onSubmit={() => void submit()}
            skill={skill?.name || "Choose a skill"}
            busy={busy}
            disabled={
              uploading ||
              !skill ||
              Boolean(task.archived_at) ||
              runActive
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
      {panelMounted && (
        <Artifact
          task={task}
          versions={data.versions}
          busy={busy}
          active={panel}
          onRefresh={async () => { await refresh(); }}
          onApproved={modeOf(task) === "skill-tuning" ? continueOnboarding : undefined}
          onClose={hideDraft}
        />
      )}
    </div>
  );
}
