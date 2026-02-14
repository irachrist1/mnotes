import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { getUserId } from "./lib/auth";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return [];

    return await ctx.db
      .query("taskEvents")
      .withIndex("by_user_task_created", (q) =>
        q.eq("userId", userId).eq("taskId", args.taskId)
      )
      .order("asc")
      .collect();
  },
});

export const addInternal = internalMutation({
  args: {
    userId: v.string(),
    taskId: v.id("tasks"),
    kind: v.union(
      v.literal("status"),
      v.literal("progress"),
      v.literal("note"),
      v.literal("result"),
      v.literal("error")
    ),
    title: v.string(),
    detail: v.optional(v.string()),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== args.userId) throw new Error("Task not found");

    return await ctx.db.insert("taskEvents", {
      userId: args.userId,
      taskId: args.taskId,
      kind: args.kind,
      title: args.title,
      detail: args.detail,
      progress: args.progress,
      createdAt: Date.now(),
    });
  },
});

export const clearForTaskInternal = internalMutation({
  args: { userId: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== args.userId) throw new Error("Task not found");

    const events = await ctx.db
      .query("taskEvents")
      .withIndex("by_user_task_created", (q) =>
        q.eq("userId", args.userId).eq("taskId", args.taskId)
      )
      .collect();
    for (const e of events) {
      await ctx.db.delete(e._id);
    }
  },
});

