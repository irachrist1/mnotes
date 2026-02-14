import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const all = await ctx.db
      .query("actionableActions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return all.filter((a) => a.status !== "dismissed");
  },
});

export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("proposed"),
      v.literal("accepted"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("dismissed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("actionableActions")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", userId).eq("status", args.status)
      )
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueDate: v.optional(v.string()),
    aiNotes: v.optional(v.string()),
    sourceInsightId: v.optional(v.id("aiInsights")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!args.title.trim()) throw new Error("Title is required");
    const now = Date.now();
    return await ctx.db.insert("actionableActions", {
      userId,
      title: args.title.trim(),
      description: args.description.trim(),
      status: "proposed",
      priority: args.priority,
      dueDate: args.dueDate,
      aiNotes: args.aiNotes,
      sourceInsightId: args.sourceInsightId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("actionableActions"),
    status: v.union(
      v.literal("proposed"),
      v.literal("accepted"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("dismissed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: Date.now(),
    };
    if (args.status === "completed") {
      patch.completedAt = Date.now();
    }
    await ctx.db.patch(args.id, patch);
  },
});

export const update = mutation({
  args: {
    id: v.id("actionableActions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const dismiss = mutation({
  args: { id: v.id("actionableActions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    await ctx.db.patch(args.id, { status: "dismissed", updatedAt: Date.now() });
  },
});

export const createFromInsight = mutation({
  args: {
    insightId: v.id("aiInsights"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const insight = await ctx.db.get(args.insightId);
    if (!insight || insight.userId !== userId) throw new Error("Insight not found");

    const now = Date.now();
    const created: string[] = [];

    for (const item of insight.actionItems) {
      const id = await ctx.db.insert("actionableActions", {
        userId,
        sourceInsightId: args.insightId,
        title: item,
        description: `From AI insight: "${insight.title}"`,
        status: "proposed",
        priority: insight.priority,
        createdAt: now,
        updatedAt: now,
      });
      created.push(id);
    }

    return { created: created.length };
  },
});

export const getInternal = internalQuery({
  args: {
    id: v.id("actionableActions"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action || action.userId !== args.userId) return null;
    return action;
  },
});

export const patchResearchInternal = internalMutation({
  args: {
    id: v.id("actionableActions"),
    userId: v.string(),
    researchResults: v.string(),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.id);
    if (!action || action.userId !== args.userId) throw new Error("Not found");
    await ctx.db.patch(args.id, {
      researchResults: args.researchResults,
      updatedAt: Date.now(),
    });
  },
});
