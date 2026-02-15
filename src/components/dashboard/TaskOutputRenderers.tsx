"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MarkdownMessage } from "@/components/ui/LazyMarkdownMessage";
import { parseTaskOutput, serializeChecklist, tableToCsv, tableToMarkdown, type ChecklistItem } from "@/lib/outputFormats";

export function TaskOutputRenderers(props: { markdown: string }) {
  const parsed = useMemo(() => parseTaskOutput(props.markdown), [props.markdown]);

  if (parsed.type === "markdown") {
    return <MarkdownMessage content={props.markdown} />;
  }

  if (parsed.type === "plaintext") {
    return (
      <div className="whitespace-pre-wrap break-words leading-relaxed">
        {parsed.text}
      </div>
    );
  }

  if (parsed.type === "checklist") {
    return <ChecklistRenderer parsed={parsed} />;
  }

  return <TableRenderer parsed={parsed} />;
}

function ChecklistRenderer(props: {
  parsed: {
    introMarkdown: string;
    items: ChecklistItem[];
    outroMarkdown: string;
  };
}) {
  const [items, setItems] = useState<ChecklistItem[]>(props.parsed.items);

  const copyUpdated = async () => {
    const md = serializeChecklist({
      introMarkdown: props.parsed.introMarkdown,
      items,
      outroMarkdown: props.parsed.outroMarkdown,
    });
    await navigator.clipboard.writeText(md);
    toast.success("Copied updated checklist (markdown)");
  };

  return (
    <div className="space-y-3">
      {props.parsed.introMarkdown && (
        <div className="text-sm text-stone-700 dark:text-stone-200">
          <MarkdownMessage content={props.parsed.introMarkdown} />
        </div>
      )}

      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-black/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-stone-800 dark:text-stone-200">
            Checklist
          </p>
          <button
            onClick={() => void copyUpdated()}
            className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
          >
            Copy updated
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {items.map((it, idx) => (
            <label key={`${idx}:${it.text}`} className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={it.checked}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, checked } : p)));
                }}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
              />
              <span className={`text-xs text-stone-800 dark:text-stone-200 ${it.checked ? "line-through opacity-70" : ""}`}>
                {it.text}
              </span>
            </label>
          ))}
        </div>
      </div>

      {props.parsed.outroMarkdown && (
        <div className="text-sm text-stone-700 dark:text-stone-200">
          <MarkdownMessage content={props.parsed.outroMarkdown} />
        </div>
      )}
    </div>
  );
}

function TableRenderer(props: {
  parsed: {
    introMarkdown: string;
    header: string[];
    rows: string[][];
    outroMarkdown: string;
  };
}) {
  const copyMarkdown = async () => {
    const md = [
      props.parsed.introMarkdown ? props.parsed.introMarkdown.trimEnd() : null,
      tableToMarkdown({ header: props.parsed.header, rows: props.parsed.rows }).trimEnd(),
      props.parsed.outroMarkdown ? props.parsed.outroMarkdown.trimStart() : null,
    ].filter(Boolean).join("\n\n").trim() + "\n";

    await navigator.clipboard.writeText(md);
    toast.success("Copied table (markdown)");
  };

  const copyCsv = async () => {
    await navigator.clipboard.writeText(tableToCsv({ header: props.parsed.header, rows: props.parsed.rows }));
    toast.success("Copied table (CSV)");
  };

  return (
    <div className="space-y-3">
      {props.parsed.introMarkdown && (
        <div className="text-sm text-stone-700 dark:text-stone-200">
          <MarkdownMessage content={props.parsed.introMarkdown} />
        </div>
      )}

      <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-black/10 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-stone-800 dark:text-stone-200">
            Table
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void copyMarkdown()}
              className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
            >
              Copy markdown
            </button>
            <button
              onClick={() => void copyCsv()}
              className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
            >
              Copy CSV
            </button>
          </div>
        </div>

        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-[11px]">
            <thead>
              <tr className="text-stone-700 dark:text-stone-200">
                {props.parsed.header.map((h, idx) => (
                  <th
                    key={`${idx}:${h}`}
                    className="text-left font-semibold px-2 py-1.5 border-b border-stone-200 dark:border-stone-800 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {props.parsed.rows.map((row, rIdx) => (
                <tr key={rIdx} className="text-stone-700 dark:text-stone-200">
                  {row.map((cell, cIdx) => (
                    <td
                      key={`${rIdx}:${cIdx}`}
                      className="px-2 py-1.5 border-b border-stone-100 dark:border-stone-900/50 align-top"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {props.parsed.outroMarkdown && (
        <div className="text-sm text-stone-700 dark:text-stone-200">
          <MarkdownMessage content={props.parsed.outroMarkdown} />
        </div>
      )}
    </div>
  );
}
