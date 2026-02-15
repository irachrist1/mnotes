import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { getUserId } from "./lib/auth";
import { validateShortText } from "./lib/validate";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = Math.max(1, Math.min(20, Math.floor(args.limit ?? 5)));
    const all = await ctx.db
      .query("proactiveSuggestions")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return all
      .filter((s) => !s.dismissedAt && !s.approvedAt)
      .slice(0, limit);
  },
});

export const dismiss = mutation({
  args: { id: v.id("proactiveSuggestions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    if (existing.dismissedAt || existing.approvedAt) return;
    await ctx.db.patch(args.id, { dismissedAt: Date.now() });
  },
});

export const approve = mutation({
  args: { id: v.id("proactiveSuggestions") },
  handler: async (ctx, args): Promise<{ createdTaskId: Id<"tasks"> | null }> => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    if (existing.dismissedAt || existing.approvedAt) return { createdTaskId: null };

    validateShortText(existing.taskTitle, "Task title");
    const now = Date.now();

    const taskId = await ctx.runMutation(internal.tasks.createInternal, {
      userId,
      title: existing.taskTitle,
      note: existing.taskNote,
      priority: existing.priority,
      sourceType: "manual",
      startAgent: true,
    }) as Id<"tasks">;

    await ctx.db.patch(args.id, {
      approvedAt: now,
      approvedTaskId: taskId,
    });

    await ctx.db.insert("notifications", {
      userId,
      type: "agent-task",
      title: "Proactive suggestion approved",
      body: `Queued: ${existing.taskTitle}`,
      actionUrl: `/dashboard/data?tab=tasks&taskId=${String(taskId)}`,
      read: false,
      dismissed: false,
      createdAt: now,
    });

    return { createdTaskId: taskId };
  },
});

// Internal helper: create suggestion if not already present for the same source task.
export const createForTaskInternal = internalMutation({
  args: {
    userId: v.string(),
    sourceTaskId: v.id("tasks"),
    title: v.string(),
    body: v.string(),
    taskTitle: v.string(),
    taskNote: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    validateShortText(args.title, "Title");
    validateShortText(args.taskTitle, "Task title");

    const existing = await ctx.db
      .query("proactiveSuggestions")
      .withIndex("by_user_sourceTask", (q) => q.eq("userId", args.userId).eq("sourceTaskId", args.sourceTaskId))
      .first();
    if (existing && !existing.dismissedAt && !existing.approvedAt) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("proactiveSuggestions", {
      userId: args.userId,
      title: args.title,
      body: args.body,
      taskTitle: args.taskTitle,
      taskNote: args.taskNote,
      priority: args.priority,
      sourceTaskId: args.sourceTaskId,
      createdAt: now,
    });
  },
});
