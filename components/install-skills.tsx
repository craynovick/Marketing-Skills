'use client';
import { useState } from 'react';
import { BrandSetupHint } from '@/components/brand-setup-hint';

export function InstallSkills({ downloadUrl = '/api/skills/install', hasBrand = false, firstPrompt }: { downloadUrl?: string; hasBrand?: boolean; firstPrompt?: string }) {
  const [agent, setAgent] = useState('codex');
  const [notice, setNotice] = useState('');
  const command = `node ~/Downloads/cookbook-install.mjs --agent ${agent}`;
  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setNotice('Copied.'); }
    catch { setNotice('Clipboard unavailable. Select and copy the text below.'); }
  }
  const prompt = firstPrompt || (hasBrand ? 'Read .cookbook/brand.md, then use the landing-page-copywriter skill to draft a homepage headline and introduction. Use only supported claims.' : 'Use cookbook-brand-context to research and create my shared brand brief. Here is my brand: ');
  return <section className="pack-install" aria-label="Install your skills">
    <h2>{hasBrand ? 'Your brand. Your AI app.' : 'Take the skills with you.'}</h2>
    <p>{hasBrand ? 'Your private download includes the skill library and one shared brand brief.' : 'Install the library, then describe your brand in your AI app.'}</p>
    <label>AI app<select value={agent} onChange={e => setAgent(e.target.value)}><option value="codex">Codex</option><option value="claude-code">Claude Code</option></select></label>
    <ol><li><a className="pack-primary" href={downloadUrl} download="cookbook-install.mjs">Download {hasBrand ? 'my brand pack' : 'the skills'}</a></li><li>Open a terminal in your project folder and run this command:</li></ol>
    <div className="pack-command"><code>{command}</code><button type="button" onClick={() => void copy(command)}>Copy</button></div>
    <p className="pack-small">Requires Node.js 22+. If your download folder or filename differs, use that path instead. The installer is readable JavaScript; it makes no network calls and never overwrites your local brand brief. Restart or refresh your AI app after installation.</p>
    <details><summary>What gets installed?</summary><p>Skills go in {agent === 'codex' ? '.agents/skills/' : '.claude/skills/'}. {hasBrand ? 'Your shared brief goes in .cookbook/brand.md, with supporting sources in .cookbook/evidence.md.' : 'The Brand Context skill creates .cookbook/brand.md when you describe your brand.'} Private context is ignored by Git by default. Existing files and local edits are preserved. No global instructions or MCP connection are changed.</p><p>To update unchanged managed skills, add <code>--update</code>. To preview changes, add <code>--dry-run</code>. To remove managed skills while keeping your context, add <code>--remove</code>. Conflicting local skill edits require a manual review.</p></details>
    {hasBrand ? <><h3>Try it in your AI app</h3><div className="pack-prompt"><p>{prompt}</p><button type="button" onClick={() => void copy(prompt)}>Copy prompt</button></div></> : <BrandSetupHint />}
    <p role="status" className="pack-small">{notice}</p>
  </section>;
}
