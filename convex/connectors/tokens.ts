import { v } from "convex/values";
import { getUserId } from "../lib/auth";
import { validateApiKey } from "../lib/validate";
import { internalQuery, internalMutation, query, mutation } from "../_generated/server";

export type ConnectorProvider = "github" | "google-calendar" | "gmail";

const PROVIDERS: ConnectorProvider[] = ["github", "google-calendar", "gmail"];

export const list = query({
  args: {},
  handler: async (ctx): Promise<Array<{ provider: ConnectorProvider; connected: boolean; updatedAt: number | null; scopes: string[] | null; expiresAt: number | null }>> => {
    const userId = await getUserId(ctx);
    const tokens = await ctx.db
      .query("connectorTokens")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return PROVIDERS.map((p) => {
      const found = tokens.find((t) => t.provider === p);
      return {
        provider: p,
        connected: Boolean(found),
        updatedAt: found?.updatedAt ?? null,
        scopes: found?.scopes ?? null,
        expiresAt: found?.expiresAt ?? null,
      };
    });
  },
});

export const setToken = mutation({
  args: {
    provider: v.union(v.literal("github"), v.literal("google-calendar"), v.literal("gmail")),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    validateApiKey(args.accessToken);
    validateApiKey(args.refreshToken);

    const existing = await ctx.db
      .query("connectorTokens")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId).eq("provider", args.provider))
      .first();

    const now = Date.now();
    // Preserve refresh tokens unless explicitly replaced. Google often omits refresh_token on
    // subsequent OAuth exchanges, and refresh is required for long-lived access.
    const refreshToken = args.refreshToken !== undefined ? args.refreshToken : existing?.refreshToken;
    const scopes = args.scopes !== undefined ? args.scopes : existing?.scopes;
    const expiresAt = args.expiresAt !== undefined ? args.expiresAt : existing?.expiresAt;
    const data = {
      userId,
      provider: args.provider,
      accessToken: args.accessToken,
      refreshToken,
      scopes,
      expiresAt,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("connectorTokens", { ...data, createdAt: now });
  },
});

export const clearToken = mutation({
  args: { provider: v.union(v.literal("github"), v.literal("google-calendar"), v.literal("gmail")) },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("connectorTokens")
      .withIndex("by_user_provider", (q) => q.eq("userId", userId).eq("provider", args.provider))
      .first();
    if (!existing) return;
    await ctx.db.delete(existing._id);
  },
});

// Internal: fetch a token for use in actions/tools.
export const getInternal = internalQuery({
  args: {
    userId: v.string(),
    provider: v.union(v.literal("github"), v.literal("google-calendar"), v.literal("gmail")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connectorTokens")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", args.provider))
      .first();
  },
});

// Internal: upsert token directly by userId (no auth context).
export const setInternal = internalMutation({
  args: {
    userId: v.string(),
    provider: v.union(v.literal("github"), v.literal("google-calendar"), v.literal("gmail")),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    validateApiKey(args.accessToken);
    validateApiKey(args.refreshToken);
    const existing = await ctx.db
      .query("connectorTokens")
      .withIndex("by_user_provider", (q) => q.eq("userId", args.userId).eq("provider", args.provider))
      .first();
    const now = Date.now();
    const refreshToken = args.refreshToken !== undefined ? args.refreshToken : existing?.refreshToken;
    const scopes = args.scopes !== undefined ? args.scopes : existing?.scopes;
    const expiresAt = args.expiresAt !== undefined ? args.expiresAt : existing?.expiresAt;
    const data = {
      userId: args.userId,
      provider: args.provider,
      accessToken: args.accessToken,
      refreshToken,
      scopes,
      expiresAt,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }
    return await ctx.db.insert("connectorTokens", { ...data, createdAt: now });
  },
});
