import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";

export const submit = mutation({
  args: {
    type: v.union(v.literal("bug"), v.literal("feature"), v.literal("general")),
    message: v.string(),
    page: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!args.message.trim()) {
      throw new Error("Feedback message cannot be empty");
    }
    if (args.message.length > 2000) {
      throw new Error("Feedback message must be 2000 characters or less");
    }
    return await ctx.db.insert("feedback", {
      userId,
      type: args.type,
      message: args.message.trim(),
      page: args.page,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});
