"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MarkdownMessage } from "@/components/ui/LazyMarkdownMessage";
import { parseTaskOutput, serializeChecklist, type ChecklistItem } from "@/lib/outputFormats";

export function TaskOutputRenderers(props: { markdown: string }) {
  const parsed = useMemo(() => parseTaskOutput(props.markdown), [props.markdown]);

  if (parsed.type === "markdown") {
    return <MarkdownMessage content={props.markdown} />;
  }

  return <ChecklistRenderer parsed={parsed} />;
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

