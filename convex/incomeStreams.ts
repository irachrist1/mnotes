import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserId } from "./lib/auth";

// Get all income streams for the current user
export const list = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("incomeStreams")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Get income streams by status for the current user
export const byStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("incomeStreams")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// Create income stream
export const create = mutation({
  args: {
    name: v.string(),
    category: v.union(
      v.literal("consulting"),
      v.literal("employment"),
      v.literal("content"),
      v.literal("product"),
      v.literal("project-based")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("developing"),
      v.literal("planned"),
      v.literal("paused")
    ),
    monthlyRevenue: v.number(),
    timeInvestment: v.number(),
    growthRate: v.number(),
    notes: v.optional(v.string()),
    clientInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("incomeStreams", {
      ...args,
      userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update income stream
export const update = mutation({
  args: {
    id: v.id("incomeStreams"),
    name: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("consulting"),
        v.literal("employment"),
        v.literal("content"),
        v.literal("product"),
        v.literal("project-based")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("developing"),
        v.literal("planned"),
        v.literal("paused")
      )
    ),
    monthlyRevenue: v.optional(v.number()),
    timeInvestment: v.optional(v.number()),
    growthRate: v.optional(v.number()),
    notes: v.optional(v.string()),
    clientInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete income stream
export const remove = mutation({
  args: { id: v.id("incomeStreams") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
