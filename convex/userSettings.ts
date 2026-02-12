import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";
import { validateShortText, validateApiKey } from "./lib/validate";

// SECURITY NOTE: API keys are stored in plaintext in Convex. For production,
// consider using Convex environment variables or a secrets manager. Full
// encryption at rest requires server-side key management via the Convex dashboard.

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!settings) return null;
    // Mask API keys before sending to client. Only return whether they are set.
    return {
      ...settings,
      openrouterApiKey: settings.openrouterApiKey ? "••••••••" : undefined,
      googleApiKey: settings.googleApiKey ? "••••••••" : undefined,
    };
  },
});

// Internal query that returns unmasked API keys. Only callable from other
// Convex functions (actions, mutations), never from the client.
export const getWithKeys = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
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
    validateShortText(args.aiModel, "AI model");
    validateApiKey(args.openrouterApiKey);
    validateApiKey(args.googleApiKey);

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
