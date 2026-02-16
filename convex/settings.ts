import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!settings) return null;
    // Mask API keys before sending to client
    return {
      ...settings,
      anthropicApiKey: settings.anthropicApiKey ? "***" : undefined,
      googleApiKey: settings.googleApiKey ? "***" : undefined,
      openrouterApiKey: settings.openrouterApiKey ? "***" : undefined,
      agentServerSecret: settings.agentServerSecret ? "***" : undefined,
      hasAnthropicKey: !!settings.anthropicApiKey,
      hasGoogleKey: !!settings.googleApiKey,
      hasOpenrouterKey: !!settings.openrouterApiKey,
    };
  },
});

export const upsert = mutation({
  args: {
    aiProvider: v.optional(v.union(
      v.literal("anthropic"),
      v.literal("google"),
      v.literal("openrouter")
    )),
    aiModel: v.optional(v.string()),
    anthropicApiKey: v.optional(v.string()),
    googleApiKey: v.optional(v.string()),
    openrouterApiKey: v.optional(v.string()),
    agentServerUrl: v.optional(v.string()),
    agentServerSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };
    // Only update fields that are explicitly provided
    if (args.aiProvider !== undefined) patch.aiProvider = args.aiProvider;
    if (args.aiModel !== undefined) patch.aiModel = args.aiModel;
    if (args.anthropicApiKey !== undefined) patch.anthropicApiKey = args.anthropicApiKey;
    if (args.googleApiKey !== undefined) patch.googleApiKey = args.googleApiKey;
    if (args.openrouterApiKey !== undefined) patch.openrouterApiKey = args.openrouterApiKey;
    if (args.agentServerUrl !== undefined) patch.agentServerUrl = args.agentServerUrl;
    if (args.agentServerSecret !== undefined) patch.agentServerSecret = args.agentServerSecret;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return ctx.db.insert("userSettings", {
      userId,
      aiProvider: (args.aiProvider as "anthropic" | "google" | "openrouter") ?? "anthropic",
      aiModel: args.aiModel ?? "claude-sonnet-4-5-20250929",
      anthropicApiKey: args.anthropicApiKey,
      googleApiKey: args.googleApiKey,
      openrouterApiKey: args.openrouterApiKey,
      agentServerUrl: args.agentServerUrl,
      agentServerSecret: args.agentServerSecret,
      updatedAt: now,
    });
  },
});

// Internal: get raw (unmasked) settings — used only by agent server
export const getRaw = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});
