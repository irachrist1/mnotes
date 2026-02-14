"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SlideOver } from "@/components/ui/SlideOver";
import { Select } from "@/components/ui/Select";
import {
    CheckSquare,
    Square,
    Plus,
    Trash2,
    Pencil,
    ListTodo,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { track } from "@/lib/analytics";

type Priority = "low" | "medium" | "high";
type SourceType = "manual" | "ai-insight" | "chat";

const container = {
    enter: { transition: { staggerChildren: 0.04 } },
};
const item = {
    initial: { opacity: 0, y: 6 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
};

const priorityVariant = (p: string) => {
    switch (p) {
        case "high": return "danger" as const;
        case "medium": return "warning" as const;
        default: return "default" as const;
    }
};

type TaskForm = {
    title: string;
    note: string;
    priority: Priority;
    dueDate: string;
};

const emptyForm: TaskForm = { title: "", note: "", priority: "medium", dueDate: "" };

export function TasksContent() {
    const tasks = useQuery(api.tasks.list);
    const createTask = useMutation(api.tasks.create);
    const updateTask = useMutation(api.tasks.update);
    const toggleDone = useMutation(api.tasks.toggleDone);
    const removeTask = useMutation(api.tasks.remove);

    const [showCompleted, setShowCompleted] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<Id<"tasks"> | null>(null);
    const [form, setForm] = useState<TaskForm>(emptyForm);
    const [saving, setSaving] = useState(false);

    const isLoading = tasks === undefined;
    const todoTasks = tasks?.filter((t) => !t.done) ?? [];
    const doneTasks = tasks?.filter((t) => t.done) ?? [];
    const visible = showCompleted ? [...todoTasks, ...doneTasks] : todoTasks;

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
                await createTask({
                    title: form.title.trim(),
                    note: form.note || undefined,
                    sourceType: "manual" as SourceType,
                    priority: form.priority,
                    dueDate: form.dueDate || undefined,
                });
                track("task_created");
                toast.success("Task created");
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
        } catch {
            toast.error("Failed to delete");
        }
    };

    return (
        <>
            <PageHeader
                title="Tasks"
                description="Track your to-dos — AI suggested or manually added"
                action={
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Task
                    </button>
                }
            />

            <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                    {todoTasks.length} to do{doneTasks.length > 0 ? ` · ${doneTasks.length} done` : ""}
                </p>
                {doneTasks.length > 0 && (
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                    >
                        {showCompleted ? "Hide completed" : "Show completed"}
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-12 bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : visible.length > 0 ? (
                <motion.div
                    className="card divide-y divide-stone-100 dark:divide-stone-800"
                    initial="initial"
                    animate="enter"
                    variants={container}
                >
                    {visible.map((task) => (
                        <motion.div
                            key={task._id}
                            variants={item}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
                        >
                            <button
                                onClick={() => handleToggle(task._id)}
                                className="flex-shrink-0"
                                aria-label={task.done ? "Mark undone" : "Mark done"}
                            >
                                {task.done ? (
                                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                                ) : (
                                    <Square className="w-5 h-5 text-stone-300 dark:text-stone-600 hover:text-stone-500 transition-colors" />
                                )}
                            </button>

                            <div className="min-w-0 flex-1">
                                <p
                                    className={`text-sm font-medium truncate ${task.done
                                            ? "text-stone-400 dark:text-stone-500 line-through"
                                            : "text-stone-900 dark:text-stone-100"
                                        }`}
                                >
                                    {task.title}
                                </p>
                                {task.note && (
                                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                        {task.note}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                {task.dueDate && (
                                    <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums hidden sm:inline">
                                        {task.dueDate}
                                    </span>
                                )}
                                <Badge variant={priorityVariant(task.priority)} className="hidden sm:inline-flex">
                                    {task.priority}
                                </Badge>
                                {task.sourceType !== "manual" && (
                                    <Badge variant="info" className="hidden sm:inline-flex">
                                        {task.sourceType === "ai-insight" ? "AI" : "Chat"}
                                    </Badge>
                                )}
                                <button
                                    onClick={() => openEdit(task)}
                                    className="p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Edit task"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(task._id)}
                                    className="p-1 rounded text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Delete task"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <EmptyState
                    icon={ListTodo}
                    title="No tasks yet"
                    description="Create your first task or let the AI suggest some for you."
                    action={
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Task
                        </button>
                    }
                />
            )}

            <SlideOver
                open={showForm}
                onClose={() => setShowForm(false)}
                title={editingId ? "Edit Task" : "New Task"}
            >
                <div className="space-y-4">
                    <Field label="Title">
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="input-field text-base sm:text-sm"
                            placeholder="What needs to be done?"
                        />
                    </Field>
                    <Field label="Note (optional)">
                        <textarea
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                            className="input-field resize-none text-base sm:text-sm"
                            rows={3}
                            placeholder="Additional context…"
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
                            className="flex-1 px-4 py-2 rounded-md btn-primary text-sm transition-colors disabled:opacity-50"
                        >
                            {saving ? "Saving…" : editingId ? "Update" : "Create"}
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 rounded-md text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
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
            <span className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                {label}
            </span>
            {children}
        </div>
    );
}
