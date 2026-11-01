import { Fragment, type ReactNode } from "react";

/**
 * Rendu Markdown léger et sûr pour les réponses de l'IA.
 * Aucun HTML n'est injecté : chaque bloc devient un élément React.
 * Supporte : titres (#, ##, ###), listes à puces et numérotées, tableaux,
 * citations, séparateurs, gras, italique et code en ligne.
 */

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "quote"; text: string }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "hr" };

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const splitRow = (l: string) =>
  l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

/** Certains modèles renvoient un tableau sur une seule ligne : on remet les retours. */
function normalize(src: string): string {
  return src
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => {
      // Ligne contenant l'en-tête ET le séparateur « |---| » : tableau aplati.
      if (!/\|\s*\|?\s*:?-{3,}/.test(line) || !/\|\s*\|/.test(line)) return line;
      const start = line.indexOf("|");
      const before = line.slice(0, start).trim();
      const rows = line.slice(start).replace(/\|\s*\|/g, "|\n|").split("\n");
      const cols = splitRow(rows[0]).length;
      const out: string[] = [];
      for (const row of rows) {
        // Une ligne a cols + 1 barres : le texte au-delà redevient un paragraphe.
        let pipes = 0;
        let cut = -1;
        for (let k = 0; k < row.length; k++) {
          if (row[k] === "|" && ++pipes === cols + 1) { cut = k; break; }
        }
        if (cut >= 0 && row.slice(cut + 1).trim()) {
          out.push(row.slice(0, cut + 1), "", row.slice(cut + 1).trim());
        } else out.push(row);
      }
      const table = out.join("\n");
      return before ? `${before}\n${table}` : table;
    })
    .join("\n");
}

function parseBlocks(src: string): Block[] {
  const lines = normalize(src).split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) { i++; continue; }

    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) { blocks.push({ kind: "heading", level: h[1].length, text: h[2] }); i++; continue; }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { blocks.push({ kind: "hr" }); i++; continue; }

    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) { rows.push(splitRow(lines[i])); i++; }
      blocks.push({ kind: "table", header, rows });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) { buf.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
      blocks.push({ kind: "quote", text: buf.join(" ") });
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) { items.push(lines[i].trim().replace(/^[-*•]\s+/, "")); i++; }
      blocks.push({ kind: "ul", items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].trim().replace(/^\d+[.)]\s+/, "")); i++; }
      blocks.push({ kind: "ol", items });
      continue;
    }

    const buf: string[] = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|[-*•]\s|\d+[.)]\s|>|\|)/.test(lines[i].trim())
    ) { buf.push(lines[i].trim()); i++; }
    blocks.push({ kind: "paragraph", text: buf.join(" ") });
  }
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**") || tok.startsWith("__")) {
      out.push(<strong key={k++} className="font-semibold text-gray-900 dark:text-white">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(<code key={k++} className="rounded bg-gray-100 px-1 py-0.5 text-[0.85em] dark:bg-gray-800">{tok.slice(1, -1)}</code>);
    } else {
      out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  // Astérisques orphelins laissés par le modèle
  return out.map((n) => (typeof n === "string" ? n.replace(/\*\*/g, "") : n));
}

export default function MarkdownContent({ content, compact = false }: { content: string; compact?: boolean }) {
  const blocks = parseBlocks(content);
  const gap = compact ? "space-y-2" : "space-y-3";
  return (
    <div className={`${gap} text-sm leading-relaxed text-gray-700 dark:text-gray-300`}>
      {blocks.map((b, idx) => {
        switch (b.kind) {
          case "heading": {
            const cls =
              b.level <= 2
                ? "text-base font-bold text-gray-900 dark:text-white"
                : "text-sm font-semibold text-brand-600 dark:text-brand-400";
            return <p key={idx} className={`${cls} ${idx > 0 ? "pt-1" : ""}`}>{renderInline(b.text)}</p>;
          }
          case "paragraph":
            return <p key={idx}>{renderInline(b.text)}</p>;
          case "ul":
            return (
              <ul key={idx} className="space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                    <span>{renderInline(it)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      {j + 1}
                    </span>
                    <span>{renderInline(it)}</span>
                  </li>
                ))}
              </ol>
            );
          case "quote":
            return (
              <div key={idx} className="rounded-lg bg-brand-25 px-3 py-2 text-gray-600 dark:bg-brand-500/5 dark:text-gray-400">
                {renderInline(b.text)}
              </div>
            );
          case "table":
            return (
              <div key={idx} className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-white/[0.03]">
                    <tr>
                      {b.header.map((h, j) => (
                        <th key={j} className="px-3 py-2 font-semibold uppercase tracking-wide text-gray-500">{renderInline(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} className="px-3 py-2 text-gray-700 dark:text-gray-300">{renderInline(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "hr":
            return <hr key={idx} className="border-gray-100 dark:border-gray-800" />;
          default:
            return <Fragment key={idx} />;
        }
      })}
    </div>
  );
}
