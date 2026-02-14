"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Square,
  Trash2,
  Sparkles,
  Calendar,
  Plus,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";

const PRIORITY_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "purple"> = {
  low: "default",
  medium: "info",
  high: "warning",
};

const container = {
  enter: { transition: { staggerChildren: 0.04 } },
};
const itemVariant = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

type Priority = "low" | "medium" | "high";

export default function ActionsPage() {
  const tasks = useQuery(api.tasks.list);
  const createTask = useMutation(api.tasks.create);
  const toggleDone = useMutation(api.tasks.toggleDone);
  const removeTask = useMutation(api.tasks.remove);

  const [showCompleted, setShowCompleted] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const isLoading = tasks === undefined;
  const visible = tasks?.filter((t) => showCompleted || !t.done) ?? [];
  const doneCount = tasks?.filter((t) => t.done).length ?? 0;
  const todoCount = tasks?.filter((t) => !t.done).length ?? 0;

  const handleToggle = async (id: Id<"tasks">) => {
    try {
      await toggleDone({ id });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: Id<"tasks">) => {
    try {
      await removeTask({ id });
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setSaving(true);
    try {
      await createTask({
        title,
        priority: newPriority,
        sourceType: "manual",
        ...(newDueDate ? { dueDate: newDueDate } : {}),
      });
      setNewTitle("");
      setNewPriority("medium");
      setNewDueDate("");
      setShowNewForm(false);
    } catch {
      toast.error("Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Your to-dos from AI insights, chat, and manual entry"
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500 dark:text-stone-400">
            {todoCount} to-do{todoCount !== 1 ? "s" : ""}
            {doneCount > 0 && ` · ${doneCount} done`}
          </span>
          {doneCount > 0 && (
            <button
              onClick={() => setShowCompleted((v) => !v)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showCompleted ? "Hide completed" : "Show completed"}
            </button>
          )}
        </div>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 dark:bg-white/90 text-white dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-white transition-colors"
        >
          {showNewForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showNewForm ? "Cancel" : "New Task"}
        </button>
      </div>

      {/* Inline new-task form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.form
            key="new-task-form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
            onSubmit={(e) => void handleCreate(e)}
            className="card p-4 mb-4 space-y-3"
          >
            <input
              autoFocus
              type="text"
              placeholder="Task title…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-transparent text-base sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 outline-none border-b border-stone-200 dark:border-stone-700 pb-1 focus:border-stone-400 dark:focus:border-stone-500 transition-colors"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-stone-500">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as Priority)}
                  className="text-base sm:text-xs text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-white/[0.06] rounded-md px-2 py-1 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-stone-500">Due</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="text-base sm:text-xs text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-white/[0.06] rounded-md px-2 py-1 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!newTitle.trim() || saving}
                className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Adding…" : "Add Task"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && visible.length === 0 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
            {doneCount > 0 && !showCompleted ? "All caught up!" : "No tasks yet"}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-xs mx-auto">
            {doneCount > 0 && !showCompleted
              ? "All tasks are done. Show completed to review them."
              : "Create a task above, or ask your AI assistant to recommend next steps."}
          </p>
        </div>
      )}

      {/* Task list */}
      {!isLoading && visible.length > 0 && (
        <motion.div
          variants={container}
          initial="initial"
          animate="enter"
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((task) => (
              <motion.div
                key={task._id}
                variants={itemVariant}
                layout
                exit={itemVariant.exit}
                className={`card p-3.5 flex items-start gap-3 group ${
                  task.done ? "opacity-60" : ""
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => void handleToggle(task._id)}
                  aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                  className="mt-0.5 shrink-0 text-stone-400 hover:text-blue-500 transition-colors"
                >
                  {task.done ? (
                    <CheckSquare className="w-4.5 h-4.5 text-blue-500" />
                  ) : (
                    <Square className="w-4.5 h-4.5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${
                    task.done
                      ? "line-through text-stone-400 dark:text-stone-500"
                      : "text-stone-900 dark:text-stone-100"
                  }`}>
                    {task.title}
                  </p>

                  {task.note && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 line-clamp-2">
                      {task.note}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant={PRIORITY_VARIANT[task.priority] ?? "default"}>
                      {task.priority}
                    </Badge>

                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </span>
                    )}

                    {task.sourceType === "ai-insight" && task.sourceId && (
                      <Link
                        href={`/dashboard/ai-insights?id=${task.sourceId}`}
                        className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        From AI Insight
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}

                    {task.sourceType === "chat" && (
                      <span className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Sparkles className="w-3 h-3" />
                        From Chat
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => void handleDelete(task._id)}
                  aria-label="Delete task"
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </>
  );
}
