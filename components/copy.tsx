"use client";
import { useState } from "react";
export function CopyButton({ text }: { text: string }) {
  const [notice, setNotice] = useState("Copy");
  return <button className="copy" onClick={async () => { try { await navigator.clipboard.writeText(text); setNotice("Copied"); } catch { setNotice("Select to copy"); } }} aria-label={notice === "Copied" ? "Copied to clipboard" : "Copy command"}>{notice}</button>;
}
export function CommandCopy({ command }: { command: string }) { return <div className="command"><code><span>$</span> {command}</code><CopyButton text={command} /></div>; }
