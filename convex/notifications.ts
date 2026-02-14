import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return all.filter((n) => !n.dismissed && n.createdAt > cutoff);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    return unread.filter((n) => !n.dismissed).length;
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const n = await ctx.db.get(args.id);
    if (!n || n.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

export const dismiss = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const n = await ctx.db.get(args.id);
    if (!n || n.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.id, { dismissed: true });
  },
});

export const listRecentInternal = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - SEVEN_DAYS_MS;
    const all = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return all.filter((n) => n.createdAt > cutoff);
  },
});

export const createInternal = internalMutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("goal-check-in"),
      v.literal("stale-idea"),
      v.literal("overdue-action"),
      v.literal("pattern-detected"),
      v.literal("milestone"),
      v.literal("agent-task")
    ),
    title: v.string(),
    body: v.string(),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      actionUrl: args.actionUrl,
      read: false,
      dismissed: false,
      createdAt: Date.now(),
    });
  },
});
