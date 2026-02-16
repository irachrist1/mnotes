"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckSquare,
  Pencil,
  Plus,
  RefreshCcw,
  Sparkles,
  Square,
  Trash2,
  ListTodo,
  Wrench,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SlideOver } from "@/components/ui/SlideOver";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { AgentFileViewer } from "@/components/dashboard/AgentFileViewer";
import { TaskOutputRenderers } from "@/components/dashboard/TaskOutputRenderers";
import { track } from "@/lib/analytics";

type Priority = "low" | "medium" | "high";
type SourceType = "manual" | "ai-insight" | "chat";
type AgentStatus = "idle" | "queued" | "running" | "succeeded" | "failed";

const container = {
  enter: { transition: { staggerChildren: 0.04 } },
};
const item = {
  initial: { opacity: 0, y: 6 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as any },
  },
};

const priorityVariant = (p: string) => {
  switch (p) {
    case "high":
      return "danger" as const;
    case "medium":
      return "warning" as const;
    default:
      return "default" as const;
  }
};

type TaskForm = {
  title: string;
  note: string;
  priority: Priority;
  dueDate: string;
};

const emptyForm: TaskForm = { title: "", note: "", priority: "medium", dueDate: "" };

function clampPct(v: unknown) {
  const n = typeof v === "number" ? v : 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

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

function toolToSourceLabel(toolName: string): string {
  switch (toolName) {
    case "read_soul_file":
      return "Soul file";
    case "list_tasks":
      return "Tasks";
    case "list_income_streams":
      return "Income";
    case "list_ideas":
      return "Ideas";
    case "list_mentorship_sessions":
      return "Mentorship";
    case "search_insights":
      return "Saved insights";
    case "read_url":
      return "Web page";
    case "web_search":
      return "Web search";
    default:
      return toolName.replaceAll("_", " ");
  }
}

function extractSourceHost(toolName: string, toolInput: string): string | null {
  if (toolName !== "read_url" || !toolInput) return null;
  try {
    const parsed = JSON.parse(toolInput) as { url?: unknown };
    if (typeof parsed?.url !== "string") return null;
    const host = new URL(parsed.url).hostname;
    return host || null;
  } catch {
    return null;
  }
}

export function TasksContent() {
  const tasks = useQuery(api.tasks.list);
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const toggleDone = useMutation(api.tasks.toggleDone);
  const removeTask = useMutation(api.tasks.remove);
  const answerQuestion = useMutation(api.taskEvents.answerQuestion);
  const respondApproval = useMutation(api.taskEvents.respondApproval);
  const createAgentFile = useMutation(api.agentFiles.create);
  const startAgent = useAction(api.ai.taskAgent.start);
  const cancelAgent = useMutation(api.tasks.cancelAgent);
  const settings = useQuery(api.userSettings.get);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  type FilterTab = "all" | "running" | "done" | "failed";
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<"tasks"> | null>(null);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<Id<"tasks"> | null>(null);
  const [agentRestarting, setAgentRestarting] = useState(false);
  const [answeringEventId, setAnsweringEventId] = useState<string | null>(null);
  const [respondingApprovalEventId, setRespondingApprovalEventId] = useState<string | null>(null);
  const [outputView, setOutputView] = useState<"rich" | "raw">("rich");
  const [openFileId, setOpenFileId] = useState<Id<"agentFiles"> | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const closingPanelRef = useRef(false);

  const isLoading = tasks === undefined;
  const runningTasks = tasks?.filter((t) => !t.done && (t.agentStatus === "queued" || t.agentStatus === "running")) ?? [];
  const doneTasks = tasks?.filter((t) => t.done || t.agentStatus === "succeeded") ?? [];
  const failedTasks = tasks?.filter((t) => !t.done && t.agentStatus === "failed") ?? [];
  const visible = filterTab === "running" ? runningTasks
    : filterTab === "done" ? doneTasks
    : filterTab === "failed" ? failedTasks
    : tasks ?? [];

  const selectedTask = useMemo(() => {
    if (!selectedId || !tasks) return null;
    return tasks.find((t) => String(t._id) === String(selectedId)) ?? null;
  }, [selectedId, tasks]);

  const events = useQuery(
    api.taskEvents.listByTask,
    selectedId ? { taskId: selectedId } : "skip"
  );

  const agentFiles = useQuery(
    api.agentFiles.listByTask,
    selectedId ? { taskId: selectedId, limit: 30 } : "skip"
  );
  const connectors = useQuery(api.connectors.tokens.list, {});

  const sourceChips = useMemo(() => {
    if (!Array.isArray(events)) return [] as string[];
    const chips: string[] = [];
    const seen = new Set<string>();
    for (const e of events) {
      if (String(e?.kind || "") !== "tool") continue;
      const toolName = String(e?.toolName || "").trim();
      if (!toolName) continue;

      const label = toolToSourceLabel(toolName);
      if (!seen.has(label)) {
        seen.add(label);
        chips.push(label);
      }

      const host = extractSourceHost(toolName, typeof e?.toolInput === "string" ? e.toolInput : "");
      if (host && !seen.has(host)) {
        seen.add(host);
        chips.push(host);
      }
    }
    return chips.slice(0, 12);
  }, [events]);

  const missingConnectorSuggestions = useMemo(() => {
    if (!selectedTask) return [] as Array<{ provider: string; title: string; detail: string }>;
    const text = `${selectedTask.title}\n${selectedTask.note ?? ""}`.toLowerCase();
    const rows = Array.isArray(connectors) ? connectors : [];
    const hasGithub = rows.some((c: any) => c.provider === "github" && c.connected);
    const hasGmail = rows.some((c: any) => c.provider === "gmail" && c.connected);
    const hasCalendar = rows.some((c: any) => c.provider === "google-calendar" && c.connected);

    const suggestions: Array<{ provider: string; title: string; detail: string }> = [];

    if (!hasGithub && /\b(github|pull request|pr|issue|repo|repository)\b/.test(text)) {
      suggestions.push({
        provider: "github",
        title: "Connect GitHub",
        detail: "This task looks repo-related. Connect GitHub so Jarvis can read PRs and create issues.",
      });
    }
    if (!hasGmail && /\b(email|gmail|inbox|reply|draft)\b/.test(text)) {
      suggestions.push({
        provider: "gmail",
        title: "Connect Gmail",
        detail: "This task looks email-related. Connect Gmail so Jarvis can read mail, draft, and send with approval.",
      });
    }
    if (!hasCalendar && /\b(calendar|meeting|schedule|agenda|timeslot|availability)\b/.test(text)) {
      suggestions.push({
        provider: "google-calendar",
        title: "Connect Google Calendar",
        detail: "This task looks scheduling-related. Connect Calendar so Jarvis can check agenda and free slots.",
      });
    }

    return suggestions;
  }, [selectedTask, connectors]);

  const setTaskIdParam = (taskId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (taskId) params.set("taskId", taskId);
    else params.delete("taskId");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Deep-link support: /dashboard/data?tab=tasks&taskId=...
  useEffect(() => {
    if (closingPanelRef.current) {
      closingPanelRef.current = false;
      return;
    }
    const raw = searchParams.get("taskId");
    if (!raw) return;
    if (tasks === undefined) return;
    const found = tasks.find((t) => String(t._id) === String(raw));
    if (!found) return;
    if (String(found._id) === String(selectedId)) return;
    setSelectedId(found._id);
  }, [searchParams, tasks, selectedId]);

  useEffect(() => {
    setOpenFileId(null);
  }, [selectedId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (task: NonNullable<typeof tasks>[number]) => {
    setEditingId(task._id);
    setForm({
      title: task.title,
      note: task.note ?? "",
      priority: task.priority,
      dueDate: task.dueDate ?? "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateTask({
          id: editingId,
          title: form.title.trim(),
          note: form.note || undefined,
          priority: form.priority,
          dueDate: form.dueDate || undefined,
        });
        track("task_updated", { taskId: editingId });
        toast.success("Task updated");
      } else {
        const id = await createTask({
          title: form.title.trim(),
          note: form.note || undefined,
          sourceType: "manual" as SourceType,
          priority: form.priority,
          dueDate: form.dueDate || undefined,
        });
        track("task_created");
        toast.success("Agent queued. Opening activity.");
        setSelectedId(id);
        setTaskIdParam(String(id));
      }
      setShowForm(false);
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: Id<"tasks">) => {
    try {
      await toggleDone({ id });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: Id<"tasks">) => {
    if (!confirm("Delete this task?")) return;
    try {
      await removeTask({ id });
      toast.success("Task deleted");
      if (String(selectedId) === String(id)) {
        setSelectedId(null);
        setTaskIdParam(null);
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const agentStatus = (t: NonNullable<typeof tasks>[number]): AgentStatus =>
    (t.agentStatus as AgentStatus | undefined) ?? "idle";

  const agentBadge = (t: NonNullable<typeof tasks>[number]) => {
    const s = agentStatus(t);
    if (s === "queued" || s === "running") return <Badge variant="info">running</Badge>;
    if (s === "succeeded") return <Badge variant="success">ready</Badge>;
    if (s === "failed") return <Badge variant="danger">failed</Badge>;
    return <Badge variant="default">idle</Badge>;
  };

  const progressValue = (t: NonNullable<typeof tasks>[number]) => clampPct(t.agentProgress);

  const hasAiConfigured = useMemo(() => {
    if (!settings) return false;
    const p = settings.aiProvider;
    if (p === "openrouter" && settings.openrouterApiKey) return true;
    if (p === "google" && settings.googleApiKey) return true;
    if (p === "anthropic" && settings.anthropicApiKey) return true;
    return false;
  }, [settings]);

  const rerunAgent = async () => {
    if (!selectedId || agentRestarting) return;
    if (!hasAiConfigured) {
      toast.error("Please configure an AI provider and API key in Settings first.");
      return;
    }
    setAgentRestarting(true);
    try {
      const res = await startAgent({ taskId: selectedId });
      if (!res.started) {
        toast.error(res.error ?? "Failed to start agent");
      } else {
        toast.success("Agent restarted");
        track("task_agent_restarted", { taskId: selectedId });
      }
    } catch {
      toast.error("Failed to start agent");
    } finally {
      setAgentRestarting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Agent Tasks"
        description="Delegate work to your AI agent. Watch progress, then review the output."
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Agent Task
          </button>
        }
      />

      {settings !== undefined && !hasAiConfigured && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-500/[0.06] p-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            No AI provider configured. Tasks will fail until you{" "}
            <a href="/dashboard/settings" className="underline font-medium">set up an API key in Settings</a>.
          </p>
        </div>
      )}

      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {([
          { key: "all" as FilterTab, label: "All", count: tasks?.length ?? 0 },
          { key: "running" as FilterTab, label: "Running", count: runningTasks.length },
          { key: "done" as FilterTab, label: "Done", count: doneTasks.length },
          { key: "failed" as FilterTab, label: "Failed", count: failedTasks.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 shrink-0 ${
              filterTab === tab.key
                ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.06]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`tabular-nums ${
                filterTab === tab.key
                  ? "text-stone-300 dark:text-stone-600"
                  : "text-stone-400 dark:text-stone-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-label="Loading tasks">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : visible.length > 0 ? (
        <motion.div
          className="card divide-y divide-stone-100 dark:divide-stone-800"
          initial="initial"
          animate="enter"
          variants={container}
        >
          {visible.map((task) => {
            const status = agentStatus(task);
            return (
              <motion.div
                key={task._id}
                variants={item}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors duration-150 group cursor-pointer ${
                  status === "failed" ? "bg-red-50/40 dark:bg-red-500/[0.04]" : ""
                }`}
                onClick={() => {
                  setSelectedId(task._id);
                  setTaskIdParam(String(task._id));
                }}
              >
                {/* Status indicator dot */}
                <div className="flex-shrink-0">
                  {task.done || status === "succeeded" ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Done" />
                  ) : status === "queued" || status === "running" ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" title="Running" />
                  ) : status === "failed" ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" title="Failed" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-600" title="Idle" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium truncate ${
                      task.done
                        ? "text-stone-400 dark:text-stone-500 line-through"
                        : status === "failed"
                          ? "text-red-700 dark:text-red-400"
                          : "text-stone-900 dark:text-stone-100"
                    }`}
                  >
                    {task.title}
                  </p>
                  {!task.done && (status === "queued" || status === "running") && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                      {task.agentPhase ?? "Agent is working..."}
                    </p>
                  )}
                  {status === "succeeded" && !task.done && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Output ready — click to review
                    </p>
                  )}
                  {status === "failed" && (
                    <p className="text-[11px] text-red-500 dark:text-red-400 mt-0.5 truncate">
                      {task.agentError ?? "Agent failed"}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {(status === "queued" || status === "running") && (
                    <div className="hidden sm:flex items-center gap-2 w-24">
                      <div className="h-1.5 flex-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-[width] duration-500"
                          style={{ width: `${progressValue(task)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400 tabular-nums w-8 text-right">
                        {progressValue(task)}%
                      </span>
                    </div>
                  )}
                  <Badge variant={priorityVariant(task.priority)} className="hidden sm:inline-flex">
                    {task.priority}
                  </Badge>
                  <button
                    onClick={() => openEdit(task)}
                    className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    aria-label="Edit task"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClickCapture={(e) => e.stopPropagation()}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void handleDelete(task._id)}
                    className="p-1 rounded text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                    aria-label="Delete task"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClickCapture={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          icon={ListTodo}
          title="No agent tasks yet"
          description="Add a task and the agent will start working immediately."
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Agent Task
            </button>
          }
        />
      )}

      <SlideOver
        open={!!selectedId}
        onClose={() => {
          closingPanelRef.current = true;
          setSelectedId(null);
          setTaskIdParam(null);
        }}
        title="Agent Activity"
        wide
      >
        {!selectedTask ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="space-y-3">
                <div>
                  <p className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    {selectedTask.title}
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                    {selectedTask.agentPhase ? `Agent: ${selectedTask.agentPhase}` : "Agent activity and output."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {agentBadge(selectedTask)}
                  {(agentStatus(selectedTask) === "queued" || agentStatus(selectedTask) === "running") ? (
                    <button
                      onClick={async () => {
                        try {
                          await cancelAgent({ id: selectedTask._id });
                          toast.success("Agent cancelled");
                          track("task_agent_cancelled", { taskId: selectedTask._id });
                        } catch {
                          toast.error("Failed to cancel agent");
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.08] transition-colors duration-150"
                    >
                      <X className="w-3 h-3" />
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => void rerunAgent()}
                      disabled={agentRestarting}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors duration-150 disabled:opacity-60"
                    >
                      <RefreshCcw className="w-3 h-3" />
                      {agentRestarting ? "Restarting..." : "Re-run"}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                  <span>Progress</span>
                  <span>{progressValue(selectedTask)}%</span>
                </div>
                <div className="mt-2 h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                    style={{ width: `${progressValue(selectedTask)}%` }}
                  />
                </div>
                {selectedTask.agentError && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{selectedTask.agentError}</p>
                )}
                {selectedTask.agentSummary && (
                  <p className="mt-2 text-xs text-stone-600 dark:text-stone-400">{selectedTask.agentSummary}</p>
                )}
              </div>
            </div>

            {Array.isArray(selectedTask.agentPlan) && selectedTask.agentPlan.length > 0 && (
              <section className="card p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-900 dark:text-stone-100">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Proposed plan
                </div>
                <ol className="mt-3 space-y-2">
                  {selectedTask.agentPlan.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px] flex items-center justify-center tabular-nums shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-stone-700 dark:text-stone-300">{s}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Live activity</p>
                {Array.isArray(events) && events.length > 16 && (
                  <button
                    onClick={() => setShowAllEvents((v) => !v)}
                    className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
                  >
                    {showAllEvents ? "Show less" : `Show all (${events.length})`}
                  </button>
                )}
              </div>
              {sourceChips.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {sourceChips.map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center rounded-full border border-stone-200 dark:border-stone-800 px-2 py-0.5 text-[10px] font-medium text-stone-600 dark:text-stone-300"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
              {missingConnectorSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {missingConnectorSuggestions.map((s) => (
                    <div key={s.provider} className="rounded-lg border border-blue-200/70 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/[0.06] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                            {s.title}
                          </p>
                          <p className="text-xs text-blue-700/90 dark:text-blue-300/90 mt-1">
                            {s.detail}
                          </p>
                        </div>
                        <a
                          href="/dashboard/settings"
                          className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Connect
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {events === undefined ? (
                <div className="space-y-2 mt-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-3">
                  Waiting for the agent to start.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {(showAllEvents ? events : events.slice(-16)).map((e: any) => {
                    const kind = String(e.kind || "note");
                    if (kind === "question") {
                      const answered = Boolean(e.answered);
                      const options: string[] | null = Array.isArray(e.options) ? e.options : null;
                      return (
                        <div key={e._id} className="rounded-lg border border-stone-200 dark:border-stone-800 p-3 bg-white/50 dark:bg-black/10">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Question</p>
                            <span className="text-[10px] text-stone-400 tabular-nums shrink-0">
                              {relativeTime(e.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-stone-800 dark:text-stone-200 mt-1">{e.title}</p>
                          {answered ? (
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                              Answered: {String(e.answer || "")}
                            </p>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {options && options.length >= 2 ? (
                                <div className="flex flex-wrap gap-2">
                                  {options.map((opt) => (
                                    <button
                                      key={opt}
                                      disabled={answeringEventId === String(e._id)}
                                      onClick={async () => {
                                        setAnsweringEventId(String(e._id));
                                        try {
                                          await answerQuestion({ eventId: e._id, answer: opt });
                                          toast.success("Answer sent. Agent is resuming.");
                                        } catch {
                                          toast.error("Failed to send answer");
                                        } finally {
                                          setAnsweringEventId(null);
                                        }
                                      }}
                                      className="px-2.5 py-1 rounded-md text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                  Open the task in chat and reply there (options missing).
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (kind === "approval-request") {
                      const approved = e.approved as boolean | undefined;
                      const action = String(e.approvalAction || "");
                      const params = typeof e.approvalParams === "string" ? e.approvalParams : "";
                      return (
                        <div key={e._id} className="rounded-lg border border-stone-200 dark:border-stone-800 p-3 bg-white/50 dark:bg-black/10">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Approval</p>
                            <span className="text-[10px] text-stone-400 tabular-nums shrink-0">
                              {relativeTime(e.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-stone-800 dark:text-stone-200 mt-1">
                            {action ? `Allow: ${action}` : String(e.title || "Approval requested")}
                          </p>
                          {e.detail && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{e.detail}</p>
                          )}
                          {params && (
                            <pre className="mt-2 text-[11px] text-stone-600 dark:text-stone-300 whitespace-pre-wrap break-words font-mono rounded-md bg-black/5 dark:bg-white/[0.06] p-2">
                              {params}
                            </pre>
                          )}
                          {approved === undefined ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                disabled={respondingApprovalEventId === String(e._id)}
                                onClick={async () => {
                                  setRespondingApprovalEventId(String(e._id));
                                  try {
                                    await respondApproval({ eventId: e._id, approved: true });
                                    toast.success("Approved. Agent is resuming.");
                                  } catch {
                                    toast.error("Failed to approve");
                                  } finally {
                                    setRespondingApprovalEventId(null);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.08] disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                disabled={respondingApprovalEventId === String(e._id)}
                                onClick={async () => {
                                  setRespondingApprovalEventId(String(e._id));
                                  try {
                                    await respondApproval({ eventId: e._id, approved: false });
                                    toast.success("Denied. Agent is resuming.");
                                  } catch {
                                    toast.error("Failed to deny");
                                  } finally {
                                    setRespondingApprovalEventId(null);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-md text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                              >
                                Deny
                              </button>
                            </div>
                          ) : (
                            <p className={`text-xs mt-2 ${approved ? "text-emerald-700 dark:text-emerald-400" : "text-stone-600 dark:text-stone-400"}`}>
                              {approved ? "Approved" : "Denied"}
                            </p>
                          )}
                        </div>
                      );
                    }

                    if (kind === "tool") {
                      const toolName = String(e.toolName || "").trim();
                      const toolInput = typeof e.toolInput === "string" ? e.toolInput : "";
                      const toolOutput = typeof e.toolOutput === "string" ? e.toolOutput : "";
                      return (
                        <div key={e._id} className="rounded-lg border border-stone-200 dark:border-stone-800 p-3 bg-white/50 dark:bg-black/10">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Wrench className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                                {toolName ? `Tool: ${toolName}` : "Tool"}
                              </p>
                            </div>
                            <span className="text-[10px] text-stone-400 tabular-nums shrink-0">
                              {relativeTime(e.createdAt)}
                            </span>
                          </div>
                          {e.title && (
                            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{String(e.title)}</p>
                          )}
                          {toolInput && (
                            <pre className="mt-2 text-[11px] text-stone-600 dark:text-stone-300 whitespace-pre-wrap break-words font-mono rounded-md bg-black/5 dark:bg-white/[0.06] p-2">
                              {toolInput}
                            </pre>
                          )}
                          {toolOutput && (
                            <pre className="mt-2 text-[11px] text-stone-700 dark:text-stone-200 whitespace-pre-wrap break-words font-mono rounded-md bg-black/5 dark:bg-white/[0.06] p-2">
                              {toolOutput}
                            </pre>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={e._id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-stone-300 dark:bg-stone-600 mt-1.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm text-stone-800 dark:text-stone-200">{e.title}</p>
                            <span className="text-[10px] text-stone-400 tabular-nums shrink-0">
                              {relativeTime(e.createdAt)}
                            </span>
                          </div>
                          {e.detail && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{e.detail}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Output</p>
                <div className="flex items-center gap-2">
                  {selectedTask.agentResult && (
                    <div className="inline-flex items-center rounded-md border border-stone-200 dark:border-stone-800 overflow-hidden">
                      <button
                        onClick={() => setOutputView("rich")}
                        className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                          outputView === "rich"
                            ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                            : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        Rich
                      </button>
                      <button
                        onClick={() => setOutputView("raw")}
                        className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                          outputView === "raw"
                            ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                            : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.06]"
                        }`}
                      >
                        Raw
                      </button>
                    </div>
                  )}
                  {selectedTask.agentResult && (
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(selectedTask.agentResult!);
                        toast.success("Copied to clipboard");
                      }}
                      className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
                    >
                      Copy
                    </button>
                  )}
                  {selectedTask.agentResult && (
                    <button
                      onClick={async () => {
                        try {
                          const id = await createAgentFile({
                            taskId: selectedTask._id,
                            title: `${selectedTask.title} (Output)`,
                            content: selectedTask.agentResult!,
                            fileType: "document",
                          });
                          toast.success("Saved as file");
                          setOpenFileId(id);
                          track("agent_output_saved_as_file", { taskId: selectedTask._id, fileId: id });
                        } catch {
                          toast.error("Failed to save file");
                        }
                      }}
                      className="text-[11px] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors duration-150"
                    >
                      Save as file
                    </button>
                  )}
                </div>
              </div>
              {!selectedTask.agentResult ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ) : (
                outputView === "raw" ? (
                  <pre className="mt-3 text-xs text-stone-700 dark:text-stone-200 whitespace-pre-wrap break-words font-mono rounded-md bg-black/5 dark:bg-white/[0.06] p-3">
                    {selectedTask.agentResult}
                  </pre>
                ) : (
                  <div className="mt-3 text-sm text-stone-700 dark:text-stone-200">
                    <TaskOutputRenderers markdown={selectedTask.agentResult} />
                  </div>
                )
              )}
            </section>

            <section className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Files</p>
                {Array.isArray(agentFiles) && agentFiles.length > 0 && (
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    {agentFiles.length} file{agentFiles.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {agentFiles === undefined ? (
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : agentFiles.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-3">
                  No agent-created files yet.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {agentFiles.slice(0, 6).map((f: any) => (
                    <button
                      key={f._id}
                      onClick={() => setOpenFileId(f._id)}
                      className="w-full text-left rounded-md border border-stone-200 dark:border-stone-800 p-3 hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                          {f.title}
                        </span>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {relativeTime(f.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                        {String(f.fileType || "document")}
                      </p>
                    </button>
                  ))}

                  {openFileId && (
                    <AgentFileViewer
                      fileId={openFileId}
                      onClose={() => setOpenFileId(null)}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </SlideOver>

      <SlideOver
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Task" : "New Agent Task"}
      >
        <div className="space-y-4">
          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field text-base sm:text-sm"
              placeholder="What should the agent work on?"
            />
          </Field>
          <Field label="Context (optional)">
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input-field resize-none text-base sm:text-sm"
              rows={3}
              placeholder="Links, constraints, examples, or the goal..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority">
              <Select
                value={form.priority}
                onChange={(val) => setForm({ ...form, priority: val as Priority })}
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                ]}
              />
            </Field>
            <Field label="Due Date (optional)">
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input-field text-base sm:text-sm"
              />
            </Field>
          </div>
          <div className="flex items-center gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-md btn-primary text-sm transition-colors duration-150 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Queue agent"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-md text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      </SlideOver>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <span className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">{label}</span>
      {children}
    </div>
  );
}
