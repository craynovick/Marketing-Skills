import { Fragment, type ReactNode } from "react";
export function safeLink(value: string) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function inline(text: string): ReactNode {
  return text
    .split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, i) => {
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link && safeLink(link[2]);
      if (link && href)
        return (
          <a key={i} href={href} target="_blank" rel="noreferrer">
            {link[1]}
          </a>
        );
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return <code key={i}>{part.slice(1, -1)}</code>;
      return <Fragment key={i}>{part}</Fragment>;
    });
}
export function Markdown({ value }: { value: string }) {
  const lines = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const result: ReactNode[] = [];
  for (let i = 0; i < lines.length;) {
    const start = i;
    const line = lines[i++]; // Always advance, including malformed Markdown.
    if (!line.trim()) continue;
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = `h${heading[1].length}` as "h1" | "h2" | "h3";
      result.push(<Tag key={start}>{inline(heading[2])}</Tag>);
      continue;
    }
    if (line.startsWith("```")) {
      const code = [];
      while (i < lines.length && !lines[i].startsWith("```"))
        code.push(lines[i++]);
      if (i < lines.length) i++;
      result.push(
        <pre key={start}>
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    if (/^\|/.test(line) && /^\|?\s*:?-+/.test(lines[i] || "")) {
      const cells = (s: string) =>
        s
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((v) => v.trim());
      const header = cells(line);
      i++;
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|"))
        rows.push(cells(lines[i++]));
      result.push(
        <div
          className="cw-table"
          key={start}
          tabIndex={0}
          role="region"
          aria-label="Scrollable table"
        >
          <table>
            <thead>
              <tr>
                {header.map((s, j) => (
                  <th key={j}>{inline(s)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, j) => (
                <tr key={j}>
                  {r.map((s, k) => (
                    <td key={k}>{inline(s)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\d/.test(line);
      const values = [line.replace(/^([-*]|\d+\.)\s+/, "")];
      while (
        i < lines.length &&
        (ordered ? /^\d+\.\s+/ : /^[-*]\s+/).test(lines[i])
      )
        values.push(lines[i++].replace(/^([-*]|\d+\.)\s+/, ""));
      const Tag = ordered ? "ol" : "ul";
      result.push(
        <Tag key={start}>
          {values.map((v, j) => (
            <li key={j}>{inline(v)}</li>
          ))}
        </Tag>,
      );
      continue;
    }
    if (line.startsWith(">")) {
      result.push(
        <blockquote key={start}>
          {inline(line.replace(/^>\s?/, ""))}
        </blockquote>,
      );
      continue;
    }
    result.push(<p key={start}>{inline(line)}</p>);
  }
  return <div className="cw-markdown">{result}</div>;
}
