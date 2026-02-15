"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import { FileText, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AgentFileViewer } from "@/components/dashboard/AgentFileViewer";
import { track } from "@/lib/analytics";

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

export function AgentFilesContent() {
  const files = useQuery(api.agentFiles.list, { limit: 80 });
  const removeFile = useMutation(api.agentFiles.remove);

  const [openFileId, setOpenFileId] = useState<Id<"agentFiles"> | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isLoading = files === undefined;
  const visible = useMemo(() => files ?? [], [files]);

  return (
    <>
      <PageHeader
        title="Agent Files"
        description="Draft documents created by Jarvis. Open, edit, and reuse them."
      />

      {isLoading ? (
        <div className="space-y-2" aria-label="Loading files">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No agent files yet"
          description="When Jarvis creates a deliverable, it will show up here as a draft file."
        />
      ) : (
        <div className="card divide-y divide-stone-100 dark:divide-stone-800">
          {visible.map((f) => (
            <button
              key={f._id}
              onClick={() => {
                setOpenFileId(f._id);
                track("agent_file_opened", { fileId: f._id });
              }}
              className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors duration-150 group"
            >
              <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-stone-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {f.title}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                  {String(f.fileType || "document")} · updated {relativeTime(f.updatedAt)}
                </p>
              </div>

              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm("Delete this agent file?")) return;
                  setRemovingId(String(f._id));
                  try {
                    await removeFile({ id: f._id });
                    track("agent_file_deleted", { fileId: f._id });
                    toast.success("File deleted");
                    if (String(openFileId) === String(f._id)) setOpenFileId(null);
                  } catch {
                    toast.error("Failed to delete file");
                  } finally {
                    setRemovingId(null);
                  }
                }}
                disabled={removingId === String(f._id)}
                className="p-1 rounded text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 disabled:opacity-60"
                aria-label="Delete file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </button>
          ))}
        </div>
      )}

      {openFileId && (
        <AgentFileViewer
          fileId={openFileId}
          onClose={() => setOpenFileId(null)}
        />
      )}
    </>
  );
}

