"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Play,
  Clock,
  X,
  Sparkles,
  Calendar,
} from "lucide-react";
import { ResearchPanel } from "@/components/dashboard/ResearchPanel";
import { toast } from "sonner";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

type StatusFilter = "all" | "proposed" | "accepted" | "in-progress" | "completed";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Circle; variant: "default" | "info" | "warning" | "success" | "purple" }> = {
  proposed: { label: "Proposed", icon: Sparkles, variant: "default" },
  accepted: { label: "Accepted", icon: Circle, variant: "info" },
  "in-progress": { label: "In Progress", icon: Play, variant: "warning" },
  completed: { label: "Completed", icon: CheckCircle2, variant: "success" },
};

const PRIORITY_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "purple"> = {
  low: "default",
  medium: "info",
  high: "warning",
};

const container = {
  enter: { transition: { staggerChildren: 0.04 } },
};

const item = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function ActionsPage() {
  const actions = useQuery(api.actionableActions.list);
  const updateStatus = useMutation(api.actionableActions.updateStatus);
  const dismissAction = useMutation(api.actionableActions.dismiss);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const isLoading = actions === undefined;

  const filtered = actions?.filter((a) => filter === "all" || a.status === filter) ?? [];

  const counts = {
    all: actions?.length ?? 0,
    proposed: actions?.filter((a) => a.status === "proposed").length ?? 0,
    accepted: actions?.filter((a) => a.status === "accepted").length ?? 0,
    "in-progress": actions?.filter((a) => a.status === "in-progress").length ?? 0,
    completed: actions?.filter((a) => a.status === "completed").length ?? 0,
  };

  const statusLabel: Record<string, string> = {
    accepted: "Accepted",
    "in-progress": "In Progress",
    completed: "Completed",
  };

  const handleStatus = async (id: Id<"actionableActions">, status: "accepted" | "in-progress" | "completed") => {
    try {
      await updateStatus({ id, status });
      toast.success(
        status === "completed"
          ? "Action completed!"
          : `Action moved to ${statusLabel[status] ?? status}`
      );
      // Switch to "all" so the user can see where the item went
      if (filter !== "all") setFilter("all");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDismiss = async (id: Id<"actionableActions">) => {
    try {
      await dismissAction({ id });
      toast.success("Action dismissed");
    } catch {
      toast.error("Failed to dismiss");
    }
  };

  const nextStatus = (current: string): "accepted" | "in-progress" | "completed" | null => {
    switch (current) {
      case "proposed": return "accepted";
      case "accepted": return "in-progress";
      case "in-progress": return "completed";
      default: return null;
    }
  };

  const nextLabel = (current: string): string => {
    switch (current) {
      case "proposed": return "Accept";
      case "accepted": return "Start";
      case "in-progress": return "Complete";
      default: return "";
    }
  };

  return (
    <>
      <PageHeader
        title="Actions"
        description="Track and complete your recommended actions"
      />

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {(["all", "proposed", "accepted", "in-progress", "completed"] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900"
                : "bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/[0.1]"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
            <span className="ml-1.5 text-[10px] opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
            {filter === "all" ? "No actions yet" : `No ${filter} actions`}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-xs mx-auto">
            {filter === "all"
              ? "Actions are created from AI insights or via chat. Try asking your assistant to recommend next steps."
              : `No actions with status "${filter.replace("-", " ")}".`}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/[0.1] transition-colors"
            >
              View all actions
            </button>
          )}
        </div>
      )}

      {/* Action cards */}
      {!isLoading && filtered.length > 0 && (
        <motion.div
          variants={container}
          initial="initial"
          animate="enter"
          className="space-y-3"
        >
          {filtered.map((action) => {
            const config = STATUS_CONFIG[action.status];
            const next = nextStatus(action.status);
            const StatusIcon = config?.icon ?? Circle;

            return (
              <motion.div
                key={action._id}
                variants={item}
                className="card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <StatusIcon
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        action.status === "completed"
                          ? "text-emerald-500"
                          : action.status === "in-progress"
                          ? "text-amber-500"
                          : "text-stone-400"
                      }`}
                    />
                    <div className="min-w-0">
                      <h3 className={`text-sm font-semibold ${
                        action.status === "completed"
                          ? "text-stone-400 dark:text-stone-500 line-through"
                          : "text-stone-900 dark:text-stone-100"
                      }`}>
                        {action.title}
                      </h3>
                      {action.description && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                          {action.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant={config?.variant ?? "default"}>
                          {config?.label ?? action.status}
                        </Badge>
                        <Badge variant={PRIORITY_VARIANT[action.priority] ?? "default"}>
                          {action.priority}
                        </Badge>
                        {action.dueDate && (
                          <span className="flex items-center gap-1 text-[10px] text-stone-400">
                            <Calendar className="w-3 h-3" />
                            {action.dueDate}
                          </span>
                        )}
                        {action.sourceInsightId && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-500">
                            <Sparkles className="w-3 h-3" />
                            AI suggested
                          </span>
                        )}
                      </div>
                      {action.aiNotes && (
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-2 italic">
                          {action.aiNotes}
                        </p>
                      )}
                      {/* Research panel — show for accepted/in-progress actions */}
                      {(action.status === "accepted" || action.status === "in-progress") && (
                        <ResearchPanel
                          actionId={action._id}
                          researchResults={action.researchResults}
                          actionTitle={action.title}
                        />
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {next && (
                      <button
                        onClick={() => void handleStatus(action._id, next)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        {nextLabel(action.status)}
                      </button>
                    )}
                    {action.status !== "completed" && (
                      <button
                        onClick={() => void handleDismiss(action._id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </>
  );
}
