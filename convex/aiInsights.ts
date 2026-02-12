import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || "default";
    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return insights;
  },
});

export const create = mutation({
  args: {
    userId: v.optional(v.string()),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    actionItems: v.array(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    confidence: v.number(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || "default";
    return await ctx.db.insert("aiInsights", {
      userId,
      type: args.type,
      title: args.title,
      body: args.body,
      actionItems: args.actionItems,
      priority: args.priority,
      confidence: args.confidence,
      model: args.model,
      status: "unread",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("aiInsights"),
    status: v.union(v.literal("unread"), v.literal("read"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: {
    id: v.id("aiInsights"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
