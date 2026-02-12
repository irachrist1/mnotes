import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    return settings;
  },
});

export const upsert = mutation({
  args: {
    aiProvider: v.union(v.literal("openrouter"), v.literal("google")),
    aiModel: v.string(),
    openrouterApiKey: v.optional(v.string()),
    googleApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const data = {
      userId,
      aiProvider: args.aiProvider,
      aiModel: args.aiModel,
      openrouterApiKey: args.openrouterApiKey,
      googleApiKey: args.googleApiKey,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("userSettings", data);
    }
  },
});
