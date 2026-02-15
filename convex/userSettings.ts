import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";
import { validateApiKey, validateShortText } from "./lib/validate";
import { buildUserSettingsInsert, buildUserSettingsPatch } from "./userSettingsPatch";

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
    const MASK = "********";
    return {
      ...settings,
      openrouterApiKey: settings.openrouterApiKey ? MASK : undefined,
      googleApiKey: settings.googleApiKey ? MASK : undefined,
      anthropicApiKey: settings.anthropicApiKey ? MASK : undefined,
      searchApiKey: (settings as any).searchApiKey ? MASK : undefined,
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
    aiProvider: v.union(v.literal("openrouter"), v.literal("google"), v.literal("anthropic")),
    aiModel: v.string(),
    openrouterApiKey: v.optional(v.string()),
    googleApiKey: v.optional(v.string()),
    anthropicApiKey: v.optional(v.string()),
    searchProvider: v.optional(v.union(v.literal("jina"), v.literal("tavily"))),
    searchApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    validateShortText(args.aiModel, "AI model");
    validateApiKey(args.openrouterApiKey);
    validateApiKey(args.googleApiKey);
    validateApiKey(args.anthropicApiKey);
    validateApiKey(args.searchApiKey);

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    if (existing) {
      // Preserve existing API keys unless a new value was explicitly provided.
      const patch = buildUserSettingsPatch({
        aiProvider: args.aiProvider,
        aiModel: args.aiModel,
        openrouterApiKey: args.openrouterApiKey,
        googleApiKey: args.googleApiKey,
        anthropicApiKey: args.anthropicApiKey,
        searchProvider: args.searchProvider,
        searchApiKey: args.searchApiKey,
        updatedAt: now,
      });
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    const insert = buildUserSettingsInsert({
      userId,
      aiProvider: args.aiProvider,
      aiModel: args.aiModel,
      openrouterApiKey: args.openrouterApiKey,
      googleApiKey: args.googleApiKey,
      anthropicApiKey: args.anthropicApiKey,
      searchProvider: args.searchProvider,
      searchApiKey: args.searchApiKey,
      updatedAt: now,
    });
    return await ctx.db.insert("userSettings", insert);
  },
});

/**
 * Internal query that returns settings by userId directly.
 * Used by scheduled actions that don't have an auth context.
 */
export const getForUser = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

