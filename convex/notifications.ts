import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

export const list = query({
  args: { limit: v.optional(v.number()), unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, { limit = 20, unreadOnly = false }) => {
    const userId = await getUserId(ctx);
    const q = ctx.db
      .query("agentNotifications")
      .withIndex("by_user_created", (idx) => idx.eq("userId", userId))
      .order("desc");
    if (unreadOnly) {
      return q.filter((row) => row.eq(row.field("read"), false)).take(limit);
    }
    return q.take(limit);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const unread = await ctx.db
      .query("agentNotifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("agentNotifications") },
  handler: async (ctx, { notificationId }) => {
    const userId = await getUserId(ctx);
    const n = await ctx.db.get(notificationId);
    if (!n || n.userId !== userId) return;
    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const unread = await ctx.db
      .query("agentNotifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

// Internal: called by scheduled tasks / agent crons
export const createInternal = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.union(v.literal("briefing"), v.literal("alert"), v.literal("digest"), v.literal("reminder")),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("agentNotifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});
