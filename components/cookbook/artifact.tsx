"use client";
import { PanelToggle } from "./panel-toggle";
import { useEffect, useRef, useState } from "react";
import { Markdown, safeLink } from "./markdown";
import { json, messageOf, requestJSON, type Draft, type Task } from "./types";
export function Artifact({
  task,
  versions,
  busy,
  onRefresh,
  onClose,
}: {
  task: Task;
  versions: Draft[];
  busy: boolean;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [base, setBase] = useState(0);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [compare, setCompare] = useState("");
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { panel.current?.focus(); }, []);
  const document = task.document;
  const accepted = document?.id === task.accepted_version_id;
  async function action(url: string, body: unknown) {
    setPending(true);
    setNotice("");
    try {
      await requestJSON(
        url,
        json(body, url.endsWith("/document") ? "PATCH" : "POST"),
      );
      await onRefresh();
      setEditing(false);
      setNotice("Saved.");
    } catch (error) {
      setNotice(messageOf(error));
      if ((error as { status?: number }).status === 409) await onRefresh();
    } finally {
      setPending(false);
    }
  }
  function download() {
    if (!document) return;
    const url = URL.createObjectURL(
      new Blob([document.content], { type: "text/markdown" }),
    );
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${accepted ? "" : "draft-"}${task.file_name}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section ref={panel} tabIndex={-1} className="cw-artifact" aria-label="Draft workspace" onKeyDown={event => { if (event.key === "Escape" && !editing) onClose(); }}>
      <div className="cw-artifact-heading">
        <div>
          <small>{accepted ? "ACCEPTED" : "DRAFT WORKSPACE"}</small>
          <strong>
            {document
              ? `Version ${document.version}`
              : "Your draft will appear here"}
          </strong>
          <small>{task.file_name}</small>
        </div>
        <PanelToggle side="right" expanded label="Close draft workspace" onClick={onClose} />
      </div>
      {document ? (
        <>
          <div className="cw-artifact-actions">
            <button
              disabled={busy || pending || editing}
              onClick={() => {
                setText(document.content);
                setBase(document.version);
                setEditing(true);
              }}
            >
              Edit
            </button>
            <button
              disabled={busy || pending || editing || accepted}
              onClick={() =>
                action("/api/cookbook/workspace/accept", {
                  skillId: task.id,
                  version: document.version,
                })
              }
            >
              {accepted ? "Accepted" : "Accept draft"}
            </button>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(document.content);
                  setNotice("Copied Markdown.");
                } catch {
                  setNotice("Copy failed. Download the Markdown instead.");
                }
              }}
            >
              Copy
            </button>
            <button onClick={download}>
              Download {accepted ? "" : "draft"}
            </button>
          </div>
          <div className="cw-artifact-content">
            {editing ? (
              <>
                <label htmlFor="draft-editor">
                  Edit Markdown · based on v{base}
                </label>
                <textarea
                  id="draft-editor"
                  className="cw-editor"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={60000}
                />
                {base !== document.version && (
                  <div className="cw-error">
                    The server has v{document.version}. Your edits are preserved
                    above. Compare before saving.
                    <details>
                      <summary>Latest server draft</summary>
                      <Markdown value={document.content} />
                    </details>
                    <button onClick={() => setBase(document.version)}>
                      I reviewed the latest version; save my edited text next
                    </button>
                  </div>
                )}
                <div className="cw-artifact-actions">
                  <button
                    disabled={
                      busy ||
                      pending ||
                      !text.trim() ||
                      base !== document.version
                    }
                    onClick={() =>
                      action("/api/cookbook/workspace/document", {
                        skillId: task.id,
                        content: text,
                        expectedVersion: base,
                        requestId: crypto.randomUUID(),
                      })
                    }
                  >
                    Save changes
                  </button>
                  <button disabled={pending} onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <Markdown value={document.content} />
            )}
            {!!document.assumptions?.length && (
              <details>
                <summary>Assumptions ({document.assumptions.length})</summary>
                <ul>
                  {document.assumptions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </details>
            )}
            {!!document.unanswered_questions?.length && (
              <details>
                <summary>Open questions</summary>
                <ul>
                  {document.unanswered_questions.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </details>
            )}
            {!!document.evidence_references?.length && (
              <details>
                <summary>Sources</summary>
                {document.evidence_references.map((url, i) =>
                  safeLink(url) ? (
                    <a
                      className="cw-source"
                      key={i}
                      href={safeLink(url)!}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {url}
                    </a>
                  ) : null,
                )}
              </details>
            )}
            <details className="cw-history">
              <summary>Version history</summary>
              <label>
                Compare with{" "}
                <select
                  value={compare}
                  onChange={(e) => setCompare(e.target.value)}
                >
                  <option value="">Choose a version</option>
                  {versions
                    .filter((v) => v.id !== document.id)
                    .map((v) => (
                      <option value={v.id} key={v.id}>
                        v{v.version} · {v.source}
                      </option>
                    ))}
                </select>
              </label>
              {compare && versions.find((v) => v.id === compare) && (
                <div className="cw-comparison">
                  <p>
                    Previous v{versions.find((v) => v.id === compare)!.version}{" "}
                    (current v{document.version} is above)
                  </p>
                  <Markdown
                    value={versions.find((v) => v.id === compare)!.content}
                  />
                  <button
                    disabled={busy || pending || editing}
                    onClick={() =>
                      action("/api/cookbook/workspace/revert", {
                        skillId: task.id,
                        version: versions.find((v) => v.id === compare)!
                          .version,
                        expectedVersion: document.version,
                        requestId: crypto.randomUUID(),
                      })
                    }
                  >
                    Restore as a new draft
                  </button>
                </div>
              )}
            </details>
          </div>
        </>
      ) : (
        <div className="cw-artifact-empty">
          <span>▤</span>
          <h2>A place for the finished work</h2>
          <p>
            Ask Cookbook to create something. Review the draft here, refine it
            together, and accept it when it is ready.
          </p>
        </div>
      )}
      {notice && (
        <p className="cw-notice" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
