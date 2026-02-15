export type ChecklistItem = {
  text: string;
  checked: boolean;
};

export type ParsedTaskOutput =
  | {
    type: "markdown";
    markdown: string;
  }
  | {
    type: "plaintext";
    text: string;
  }
  | {
    type: "checklist";
    introMarkdown: string;
    items: ChecklistItem[];
    outroMarkdown: string;
  }
  | {
    type: "table";
    introMarkdown: string;
    header: string[];
    rows: string[][];
    outroMarkdown: string;
  };

const CHECKBOX_LINE = /^\s*(?:[-*]|\d+\.)\s+\[([ xX])\]\s+(.+?)\s*$/;

export function parseTaskOutput(markdown: string): ParsedTaskOutput {
  const raw = String(markdown ?? "");
  const lines = raw.split(/\r?\n/);

  const matches: Array<{ lineIndex: number; item: ChecklistItem }> = [];
  for (let i = 0; i < lines.length; i++) {
    const m = CHECKBOX_LINE.exec(lines[i]);
    if (!m) continue;
    const mark = String(m[1] || " ");
    const text = String(m[2] || "").trim();
    if (!text) continue;
    const checked = mark.toLowerCase() === "x";
    matches.push({ lineIndex: i, item: { text, checked } });
  }

  // Only treat as a checklist when the output is clearly intended to be one.
  if (matches.length < 2) {
    const table = parseFirstMarkdownTable(lines);
    if (!table) {
      if (!looksLikeMarkdown(raw)) return { type: "plaintext", text: raw };
      return { type: "markdown", markdown: raw };
    }

    const introMarkdown = lines.slice(0, table.startLine).join("\n").trimEnd();
    const outroMarkdown = lines.slice(table.endLine + 1).join("\n").trimStart();
    return {
      type: "table",
      introMarkdown,
      header: table.header,
      rows: table.rows,
      outroMarkdown,
    };
  }

  const first = matches[0].lineIndex;
  const last = matches[matches.length - 1].lineIndex;

  const introMarkdown = lines.slice(0, first).join("\n").trimEnd();
  const outroMarkdown = lines.slice(last + 1).join("\n").trimStart();
  const items = matches.map((m) => m.item);

  return { type: "checklist", introMarkdown, items, outroMarkdown };
}

type ParsedTable = { startLine: number; endLine: number; header: string[]; rows: string[][] };

function looksLikeMarkdown(raw: string): boolean {
  // Conservative: only opt into plaintext when the output is clearly not using markdown features.
  const s = String(raw ?? "");
  if (!s.trim()) return false;
  if (s.includes("```")) return true;
  if (/^\s*#{1,6}\s+\S/m.test(s)) return true; // headings
  if (/^\s*(?:[-*+]\s+|\d+\.\s+)\S/m.test(s)) return true; // lists
  if (/^\s*>\s+\S/m.test(s)) return true; // blockquote
  if (/^\s*---\s*$/m.test(s)) return true; // horizontal rule
  if (/\[[^\]]+\]\([^)]+\)/.test(s)) return true; // links/images
  return false;
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("-")) return false;
  if (!trimmed.includes("|")) return false;

  const cells = splitTableRow(trimmed);
  if (cells.length < 2) return false;
  return cells.every((c) => {
    const s = c.replace(/ /g, "");
    if (!s) return false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch !== "-" && ch !== ":") return false;
    }
    // require at least 3 dashes somewhere in the cell
    return s.includes("---") || s.includes("----") || s.includes("-----") || s.includes("--");
  });
}

function parseFirstMarkdownTable(lines: string[]): ParsedTable | null {
  let inCode = false;
  for (let i = 0; i < lines.length - 2; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    if (line.trimStart().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;

    if (!line.includes("|")) continue;
    if (!isTableSeparatorLine(next)) continue;

    const header = splitTableRow(line);
    if (header.length < 2) continue;

    const rows: string[][] = [];
    let j = i + 2;
    for (; j < lines.length; j++) {
      const rowLine = lines[j];
      if (rowLine.trimStart().startsWith("```")) break;
      if (!rowLine.includes("|")) break;
      const row = splitTableRow(rowLine);
      if (row.length === 0) break;
      rows.push(row);
    }

    if (rows.length < 1) continue;

    const normRows = rows.map((r) => {
      if (r.length === header.length) return r;
      if (r.length < header.length) return [...r, ...Array(header.length - r.length).fill("")];
      return r.slice(0, header.length);
    });

    return { startLine: i, endLine: j - 1, header, rows: normRows };
  }

  return null;
}

export function serializeChecklist(args: {
  introMarkdown?: string;
  items: ChecklistItem[];
  outroMarkdown?: string;
}): string {
  const intro = (args.introMarkdown ?? "").trimEnd();
  const outro = (args.outroMarkdown ?? "").trimStart();
  const body = args.items
    .map((it) => `- [${it.checked ? "x" : " "}] ${it.text}`)
    .join("\n");

  const parts = [
    intro ? intro : null,
    body,
    outro ? outro : null,
  ].filter(Boolean);

  return parts.join("\n\n").trim() + "\n";
}

export function tableToMarkdown(args: { header: string[]; rows: string[][] }): string {
  const header = args.header.map((c) => c.trim());
  const rows = args.rows.map((r) => r.map((c) => c.trim()));
  const sep = header.map(() => "---");

  const line = (cols: string[]) => `| ${cols.join(" | ")} |`;
  return [line(header), line(sep), ...rows.map(line)].join("\n") + "\n";
}

export function tableToCsv(args: { header: string[]; rows: string[][] }): string {
  const escape = (v: string) => {
    const s = String(v ?? "");
    if (/[",\r\n]/.test(s)) return `"${s.split("\"").join("\"\"")}"`;
    return s;
  };

  const lines = [
    args.header.map(escape).join(","),
    ...args.rows.map((r) => r.map(escape).join(",")),
  ];
  return lines.join("\n") + "\n";
}
