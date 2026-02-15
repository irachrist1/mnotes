import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const MAX_RESPONSE_CHARS = 24_000;

export const getValidInternal = internalQuery({
  args: {
    userId: v.string(),
    scope: v.union(v.literal("chat"), v.literal("insight")),
    cacheKey: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const entry = await ctx.db
      .query("aiPromptCache")
      .withIndex("by_user_scope_key", (q) =>
        q.eq("userId", args.userId).eq("scope", args.scope).eq("cacheKey", args.cacheKey)
      )
      .first();

    if (!entry) return null;
    if (entry.expiresAt <= now) return null;
    return entry;
  },
});

export const setInternal = internalMutation({
  args: {
    userId: v.string(),
    scope: v.union(v.literal("chat"), v.literal("insight")),
    cacheKey: v.string(),
    provider: v.union(v.literal("openrouter"), v.literal("google"), v.literal("anthropic")),
    model: v.string(),
    responseText: v.string(),
    ttlSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ttlMs = Math.max(30_000, Math.min(args.ttlSeconds * 1000, 24 * 60 * 60 * 1000));
    const expiresAt = now + ttlMs;
    const responseText = args.responseText.slice(0, MAX_RESPONSE_CHARS);

    const existing = await ctx.db
      .query("aiPromptCache")
      .withIndex("by_user_scope_key", (q) =>
        q.eq("userId", args.userId).eq("scope", args.scope).eq("cacheKey", args.cacheKey)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        provider: args.provider,
        model: args.model,
        responseText,
        createdAt: now,
        expiresAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("aiPromptCache", {
      userId: args.userId,
      scope: args.scope,
      cacheKey: args.cacheKey,
      provider: args.provider,
      model: args.model,
      responseText,
      createdAt: now,
      expiresAt,
    });
  },
});

export const cleanupExpiredInternal = internalMutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 500), 3000));

    const all = await ctx.db.query("aiPromptCache").collect();
    const expired = all.filter((entry) => entry.expiresAt <= now).slice(0, limit);

    for (const entry of expired) {
      await ctx.db.delete(entry._id);
    }

    return {
      scanned: all.length,
      deleted: expired.length,
    };
  },
});
