"use client";
import { useEffect, useRef, type KeyboardEvent } from "react";
import type { Attachment } from "./types";
export function Composer({
  value,
  onChange,
  onSubmit,
  onFiles,
  onRemove,
  attachments = [],
  files = [],
  onRemoveFile,
  skill,
  onSkill,
  busy,
  disabled,
  onStop,
  enterSends = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onFiles: (files: File[]) => void;
  onRemove?: (id: string) => void;
  attachments?: Attachment[];
  files?: File[];
  onRemoveFile?: (index: number) => void;
  skill: string;
  onSkill: () => void;
  busy: boolean;
  disabled?: boolean;
  onStop?: () => void;
  enterSends?: boolean;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (input.current) {
      input.current.style.height = "auto";
      input.current.style.height = `${Math.min(input.current.scrollHeight, 180)}px`;
    }
  }, [value]);
  function key(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      enterSends
    ) {
      event.preventDefault();
      if (!busy && !disabled && value.trim()) onSubmit();
    }
  }
  return (
    <form
      className="cw-composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {(attachments.length > 0 || files.length > 0) && (
        <div className="cw-files">
          {attachments.map((a) => (
            <span key={a.id}>
              {a.file_name}
              <button
                type="button"
                aria-label={`Remove ${a.file_name}`}
                disabled={busy || disabled}
                onClick={() => onRemove?.(a.id)}
              >
                ×
              </button>
            </span>
          ))}
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`}>
              {f.name}
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => onRemoveFile?.(i)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <label className="cw-sr" htmlFor="cookbook-message">
        Message Cookbook
      </label>
      <textarea
        ref={input}
        id="cookbook-message"
        rows={2}
        maxLength={4000}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={key}
        disabled={disabled}
        placeholder="Describe what you want to make, or paste a website…"
      />
      <div className="cw-composer-tools">
        <input
          className="cw-sr"
          ref={file}
          type="file"
          tabIndex={-1}
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={(event) => {
            onFiles(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className="cw-icon"
          title="Attach PDF, DOCX, TXT or Markdown"
          aria-label="Attach context files"
          disabled={busy || disabled || files.length + attachments.length >= 5}
          onClick={() => file.current?.click()}
        >
          ＋
        </button>
        <button
          type="button"
          className="cw-skill-button"
          disabled={busy || disabled}
          onClick={onSkill}
          title={skill}
        >
          {skill}
          <span aria-hidden="true">⌄</span>
        </button>
        <span className="cw-composer-hint">
          {enterSends ? "Enter to send" : "Use Send"} · {value.length}/4000
        </span>
        {busy ? (
          <button
            type="button"
            className="cw-send"
            aria-label="Stop generation"
            onClick={onStop}
          >
            ■
          </button>
        ) : (
          <button
            className="cw-send"
            type="submit"
            aria-label="Send message"
            disabled={disabled || !value.trim()}
          >
            ↑
          </button>
        )}
      </div>
      <p className="cw-upload-hint">
        Up to 5 files · PDF, DOCX, TXT, MD · 4 MB total per upload
      </p>
    </form>
  );
}
