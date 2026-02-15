import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUserId } from "./lib/auth";
import { validateShortText } from "./lib/validate";

/** List all tasks for the current user, newest first. */
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        return await ctx.db
            .query("tasks")
            .withIndex("by_user_created", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

/** List overdue undone tasks (dueDate < today). */
export const listOverdue = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const today = new Date().toISOString().split("T")[0];
        const all = await ctx.db
            .query("tasks")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        return all
            .filter((t) => !t.done && t.dueDate && t.dueDate < today)
            .slice(0, 5);
    },
});

/** Count undone tasks for the current user (used for badges/nudges). */
export const countUndone = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const all = await ctx.db
            .query("tasks")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        return all.filter((t) => !t.done).length;
    },
});

/** Create a new task. */
export const create = mutation({
    args: {
        title: v.string(),
        note: v.optional(v.string()),
        sourceType: v.union(
            v.literal("manual"),
            v.literal("ai-insight"),
            v.literal("chat")
        ),
        sourceId: v.optional(v.string()),
        dueDate: v.optional(v.string()),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        validateShortText(args.title, "Title");
        const now = Date.now();
        const taskId = await ctx.db.insert("tasks", {
            userId,
            title: args.title,
            note: args.note,
            sourceType: args.sourceType,
            sourceId: args.sourceId,
            dueDate: args.dueDate,
            priority: args.priority,
            done: false,
            createdAt: now,

            agentStatus: "queued",
            agentProgress: 3,
            agentPhase: "Queued",
            agentStartedAt: now,
        });

        await ctx.db.insert("taskEvents", {
            userId,
            taskId,
            kind: "status",
            title: "Queued",
            detail: "Agent is about to start.",
            progress: 3,
            createdAt: now,
        });

        await ctx.db.insert("notifications", {
            userId,
            type: "agent-task",
            title: "Agent started a task",
            body: `Working on: ${args.title}`,
            actionUrl: `/dashboard/data?tab=tasks&taskId=${String(taskId)}`,
            read: false,
            dismissed: false,
            createdAt: now,
        });

        await ctx.scheduler.runAfter(0, internal.ai.taskAgent.runInternal, {
            userId,
            taskId,
        });

        return taskId;
    },
});

/** Update a task's editable fields. */
export const update = mutation({
    args: {
        id: v.id("tasks"),
        title: v.optional(v.string()),
        note: v.optional(v.string()),
        dueDate: v.optional(v.string()),
        priority: v.optional(
            v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Task not found");
        if (existing.userId !== userId) throw new Error("Unauthorized");
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

/** Toggle a task's done state. */
export const toggleDone = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Task not found");
        if (existing.userId !== userId) throw new Error("Unauthorized");
        await ctx.db.patch(args.id, { done: !existing.done });
    },
});

/** Delete a task. */
export const remove = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Task not found");
        if (existing.userId !== userId) throw new Error("Unauthorized");

        const events = await ctx.db
            .query("taskEvents")
            .withIndex("by_user_task_created", (q) =>
                q.eq("userId", userId).eq("taskId", args.id)
            )
            .collect();
        for (const e of events) {
            await ctx.db.delete(e._id);
        }

        await ctx.db.delete(args.id);
    },
});

/** Batch-create tasks from onboarding conversation (no agent execution). */
export const createFromOnboarding = mutation({
    args: {
        tasks: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const now = Date.now();
        const ids: string[] = [];
        for (const title of args.tasks.slice(0, 10)) {
            const taskId = await ctx.db.insert("tasks", {
                userId,
                title,
                sourceType: "chat",
                priority: "medium",
                done: false,
                createdAt: now,
            });
            ids.push(String(taskId));
        }
        return { created: ids.length, taskIds: ids };
    },
});

/** Batch-create tasks from an AI insight's action items. */
export const createFromInsight = mutation({
    args: { insightId: v.id("aiInsights") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const insight = await ctx.db.get(args.insightId);
        if (!insight || insight.userId !== userId) throw new Error("Insight not found");
        const now = Date.now();
        const createdIds: Array<string> = [];
        for (const item of insight.actionItems) {
            const taskId = await ctx.db.insert("tasks", {
                userId,
                title: item,
                sourceType: "ai-insight",
                sourceId: args.insightId,
                priority: insight.priority,
                done: false,
                createdAt: now,
                agentStatus: "queued",
                agentProgress: 3,
                agentPhase: "Queued",
                agentStartedAt: now,
            });
            createdIds.push(String(taskId));

            await ctx.db.insert("taskEvents", {
                userId,
                taskId,
                kind: "status",
                title: "Queued",
                detail: "Agent is about to start.",
                progress: 3,
                createdAt: now,
            });

            await ctx.scheduler.runAfter(0, internal.ai.taskAgent.runInternal, {
                userId,
                taskId,
            });
        }

        // One summary notification (avoid spamming the bell).
        await ctx.db.insert("notifications", {
            userId,
            type: "agent-task",
            title: `Agent queued ${insight.actionItems.length} task${insight.actionItems.length === 1 ? "" : "s"}`,
            body: "Open Agent Tasks to watch progress and review outputs.",
            actionUrl: "/dashboard/data?tab=tasks",
            read: false,
            dismissed: false,
            createdAt: now,
        });

        return { created: insight.actionItems.length, taskIds: createdIds };
  },
});

/** Patch execution metadata for a task (used by AI task executor actions). */
export const patchExecution = mutation({
    args: {
        id: v.id("tasks"),
        note: v.optional(v.string()),
        lastExecutionAt: v.optional(v.number()),
        lastExecutionStatus: v.optional(
            v.union(
                v.literal("idle"),
                v.literal("queued"),
                v.literal("succeeded"),
                v.literal("failed")
            )
        ),
        lastExecutionError: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Task not found");
        if (existing.userId !== userId) throw new Error("Unauthorized");
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const getInternal = internalQuery({
    args: { id: v.id("tasks"), userId: v.string() },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        if (!task || task.userId !== args.userId) return null;
        return task;
    },
});

export const listForUserInternal = internalQuery({
    args: {
        userId: v.string(),
        limit: v.optional(v.number()),
        includeDone: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 50), 200));
        const includeDone = args.includeDone ?? true;
        const all = await ctx.db
            .query("tasks")
            .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);
        return includeDone ? all : all.filter((t) => !t.done);
    },
});

export const patchExecutionInternal = internalMutation({
    args: {
        userId: v.string(),
        id: v.id("tasks"),
        note: v.optional(v.string()),
        lastExecutionAt: v.optional(v.number()),
        lastExecutionStatus: v.optional(
            v.union(
                v.literal("idle"),
                v.literal("queued"),
                v.literal("succeeded"),
                v.literal("failed")
            )
        ),
        lastExecutionError: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        if (!task || task.userId !== args.userId) throw new Error("Not found");
        const { id, userId, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const patchAgentInternal = internalMutation({
    args: {
        userId: v.string(),
        id: v.id("tasks"),
        agentStatus: v.optional(
            v.union(
                v.literal("idle"),
                v.literal("queued"),
                v.literal("running"),
                v.literal("succeeded"),
                v.literal("failed")
            )
        ),
        agentProgress: v.optional(v.number()),
        agentPhase: v.optional(v.string()),
        agentPlan: v.optional(v.array(v.string())),
        agentSummary: v.optional(v.string()),
        agentResult: v.optional(v.string()),
        agentStartedAt: v.optional(v.number()),
        agentCompletedAt: v.optional(v.number()),
        agentError: v.optional(v.string()),
        agentState: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const task = await ctx.db.get(args.id);
        if (!task || task.userId !== args.userId) throw new Error("Not found");
        const { id, userId, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});
