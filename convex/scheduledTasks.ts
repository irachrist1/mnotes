import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return ctx.db
      .query("scheduledAgentTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("scheduledAgentTasks")),
    name: v.string(),
    prompt: v.string(),
    schedule: v.string(),
    enabled: v.boolean(),
    connectors: v.array(v.string()),
  },
  handler: async (ctx, { id, ...args }) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing || existing.userId !== userId) return;
      await ctx.db.patch(id, { ...args, updatedAt: now });
      return id;
    }
    return ctx.db.insert("scheduledAgentTasks", {
      userId,
      ...args,
      lastRunAt: undefined,
      nextRunAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("scheduledAgentTasks") },
  handler: async (ctx, { id }) => {
    const userId = await getUserId(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) return;
    await ctx.db.delete(id);
  },
});

export const toggle = mutation({
  args: { id: v.id("scheduledAgentTasks"), enabled: v.boolean() },
  handler: async (ctx, { id, enabled }) => {
    const userId = await getUserId(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) return;
    await ctx.db.patch(id, { enabled, updatedAt: Date.now() });
  },
});

// Internal: list all enabled tasks due for execution
export const listDueInternal = query({
  args: { nowMs: v.number() },
  handler: async (ctx, { nowMs }) => {
    return ctx.db
      .query("scheduledAgentTasks")
      .withIndex("by_next_run", (q) => q.lte("nextRunAt", nowMs))
      .filter((q) => q.eq(q.field("enabled"), true))
      .collect();
  },
});

export const updateLastRunInternal = mutation({
  args: {
    id: v.id("scheduledAgentTasks"),
    lastRunAt: v.number(),
    nextRunAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastRunAt: args.lastRunAt,
      nextRunAt: args.nextRunAt,
      updatedAt: Date.now(),
    });
  },
});
