"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";

import { MarkdownMessage } from "@/components/ui/MarkdownMessage";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AgentFileViewer(props: {
  fileId: Id<"agentFiles">;
  onClose: () => void;
}) {
  const file = useQuery(api.agentFiles.get, { id: props.fileId });
  const update = useMutation(api.agentFiles.update);

  const [view, setView] = useState<"rich" | "raw">("rich");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const loadedKey = useMemo(
    () => (file ? `${String(file._id)}:${file.updatedAt}` : null),
    [file]
  );

  useEffect(() => {
    if (!file) return;
    setTitle(file.title);
    setFileType(file.fileType);
    setContent(file.content);
  }, [loadedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (file === null) {
    return (
      <div className="mt-3 rounded-lg border border-stone-200 dark:border-stone-800 p-3">
        <p className="text-xs text-stone-500 dark:text-stone-400">File not found.</p>
      </div>
    );
  }

  if (file === undefined) {
    return (
      <div className="mt-3 rounded-lg border border-stone-200 dark:border-stone-800 p-3">
        <p className="text-xs text-stone-500 dark:text-stone-400">Loading file…</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await update({
        id: file._id,
        title: title.trim(),
        fileType: fileType.trim() || "document",
        content,
      });
      toast.success("File saved");
      setEditing(false);
    } catch {
      toast.error("Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-stone-200 dark:border-stone-800 p-3 bg-white/50 dark:bg-black/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
            {file.title}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
            {file.fileType} • updated {relativeTime(file.updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              void navigator.clipboard.writeText(file.content);
              toast.success("Copied file content");
            }}
            className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
          >
            Copy
          </button>
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
          >
            {editing ? "Done" : "Edit"}
          </button>
          <button
            onClick={props.onClose}
            className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
          >
            Close
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="inline-flex items-center rounded-md border border-stone-200 dark:border-stone-800 overflow-hidden">
          <button
            onClick={() => setView("rich")}
            className={`px-2 py-1 text-[11px] font-medium transition-colors ${
              view === "rich"
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            Rich
          </button>
          <button
            onClick={() => setView("raw")}
            className={`px-2 py-1 text-[11px] font-medium transition-colors ${
              view === "raw"
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            Raw
          </button>
        </div>
        {editing && (
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full"
              placeholder="Title"
            />
            <input
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="input-field w-full"
              placeholder="Type (document/checklist/...)"
            />
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="input-field w-full resize-none font-mono text-xs"
            rows={14}
          />
        </div>
      ) : view === "raw" ? (
        <pre className="mt-3 text-xs text-stone-700 dark:text-stone-200 whitespace-pre-wrap break-words font-mono rounded-md bg-black/5 dark:bg-white/[0.06] p-3">
          {file.content}
        </pre>
      ) : (
        <div className="mt-3 text-sm text-stone-700 dark:text-stone-200">
          <MarkdownMessage content={file.content} />
        </div>
      )}
    </div>
  );
}

