import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { getUserId } from "./lib/auth";
import { validateShortText, validateMediumText, validateArray, validateNumber } from "./lib/validate";

// Get all mentorship sessions for the current user
export const list = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("mentorshipSessions")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const listForUserInternal = internalQuery({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 30), 200));
    return await ctx.db
      .query("mentorshipSessions")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get sessions by type for the current user
export const byType = query({
  args: { sessionType: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("mentorshipSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("sessionType"), args.sessionType))
      .collect();
  },
});

// Create mentorship session
export const create = mutation({
  args: {
    mentorName: v.string(),
    date: v.string(),
    duration: v.number(),
    sessionType: v.union(v.literal("giving"), v.literal("receiving")),
    topics: v.array(v.string()),
    keyInsights: v.array(v.string()),
    actionItems: v.array(
      v.object({
        task: v.string(),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high")
        ),
        completed: v.boolean(),
        dueDate: v.optional(v.string()),
      })
    ),
    rating: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    validateShortText(args.mentorName, "Mentor name");
    validateNumber(args.duration, "Duration", 1, 480);
    validateArray(args.topics, "Topics");
    validateArray(args.keyInsights, "Key insights");
    validateArray(args.actionItems, "Action items");
    validateNumber(args.rating, "Rating", 1, 10);
    validateMediumText(args.notes, "Notes");
    return await ctx.db.insert("mentorshipSessions", {
      ...args,
      userId,
      createdAt: Date.now(),
    });
  },
});

// Update mentorship session
export const update = mutation({
  args: {
    id: v.id("mentorshipSessions"),
    mentorName: v.optional(v.string()),
    date: v.optional(v.string()),
    duration: v.optional(v.number()),
    sessionType: v.optional(v.union(v.literal("giving"), v.literal("receiving"))),
    topics: v.optional(v.array(v.string())),
    keyInsights: v.optional(v.array(v.string())),
    actionItems: v.optional(
      v.array(
        v.object({
          task: v.string(),
          priority: v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high")
          ),
          completed: v.boolean(),
          dueDate: v.optional(v.string()),
        })
      )
    ),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Session not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    if (updates.rating !== undefined) validateNumber(updates.rating, "Rating", 1, 10);
    if (updates.duration !== undefined) validateNumber(updates.duration, "Duration", 1, 480);
    await ctx.db.patch(id, updates);
  },
});

// Delete mentorship session
export const remove = mutation({
  args: { id: v.id("mentorshipSessions") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Session not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});

// Update action item completion
export const toggleActionItem = mutation({
  args: {
    id: v.id("mentorshipSessions"),
    actionItemIndex: v.number(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");
    if (session.userId !== userId) throw new Error("Unauthorized");

    const updatedActionItems = [...session.actionItems];
    updatedActionItems[args.actionItemIndex] = {
      ...updatedActionItems[args.actionItemIndex],
      completed: args.completed,
    };

    await ctx.db.patch(args.id, { actionItems: updatedActionItems });
  },
});
