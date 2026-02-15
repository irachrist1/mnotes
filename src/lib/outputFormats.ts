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
    type: "checklist";
    introMarkdown: string;
    items: ChecklistItem[];
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
  if (matches.length < 2) return { type: "markdown", markdown: raw };

  const first = matches[0].lineIndex;
  const last = matches[matches.length - 1].lineIndex;

  const introMarkdown = lines.slice(0, first).join("\n").trimEnd();
  const outroMarkdown = lines.slice(last + 1).join("\n").trimStart();
  const items = matches.map((m) => m.item);

  return { type: "checklist", introMarkdown, items, outroMarkdown };
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
