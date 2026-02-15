import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { getUserId } from "./lib/auth";

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(min, Math.min(max, n));
}

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = clampInt(args.limit, 30, 1, 200);
    return await ctx.db
      .query("agentFiles")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return [];

    const limit = clampInt(args.limit, 30, 1, 200);
    return await ctx.db
      .query("agentFiles")
      .withIndex("by_task_updated", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .filter((q) => q.eq(q.field("userId"), userId))
      .take(limit);
  },
});

export const get = query({
  args: { id: v.id("agentFiles") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) return null;
    return doc;
  },
});

export const create = mutation({
  args: {
    taskId: v.optional(v.id("tasks")),
    title: v.string(),
    content: v.string(),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task || task.userId !== userId) throw new Error("Task not found");
    }
    return await ctx.db.insert("agentFiles", {
      userId,
      taskId: args.taskId,
      title: args.title.trim(),
      content: args.content,
      fileType: (args.fileType ?? "document").trim() || "document",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("agentFiles"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.content !== undefined) updates.content = args.content;
    if (args.fileType !== undefined) updates.fileType = args.fileType.trim() || existing.fileType;
    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("agentFiles") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(args.id);
  },
});

// Internal APIs (for agent tools / actions)

export const getInternal = internalQuery({
  args: { userId: v.string(), id: v.id("agentFiles") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== args.userId) return null;
    return doc;
  },
});

export const listByTaskInternal = internalQuery({
  args: { userId: v.string(), taskId: v.id("tasks"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== args.userId) return [];

    const limit = clampInt(args.limit, 30, 1, 200);
    return await ctx.db
      .query("agentFiles")
      .withIndex("by_task_updated", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .take(limit);
  },
});

export const createInternal = internalMutation({
  args: {
    userId: v.string(),
    taskId: v.optional(v.id("tasks")),
    title: v.string(),
    content: v.string(),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task || task.userId !== args.userId) throw new Error("Task not found");
    }
    return await ctx.db.insert("agentFiles", {
      userId: args.userId,
      taskId: args.taskId,
      title: args.title.trim(),
      content: args.content,
      fileType: (args.fileType ?? "document").trim() || "document",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateInternal = internalMutation({
  args: {
    userId: v.string(),
    id: v.id("agentFiles"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== args.userId) throw new Error("Not found");

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title.trim();
    if (args.content !== undefined) updates.content = args.content;
    if (args.fileType !== undefined) updates.fileType = args.fileType.trim() || existing.fileType;
    await ctx.db.patch(args.id, updates);
  },
});

