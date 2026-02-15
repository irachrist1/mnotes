import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const createInternal = internalMutation({
  args: {
    userId: v.string(),
    provider: v.union(v.literal("google-calendar"), v.literal("gmail")),
    state: v.string(),
    origin: v.string(),
    scopes: v.array(v.string()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("connectorAuthSessions", {
      userId: args.userId,
      provider: args.provider,
      state: args.state,
      origin: args.origin,
      scopes: args.scopes,
      createdAt: now,
      expiresAt: args.expiresAt,
    });
  },
});

export const getByStateInternal = internalQuery({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connectorAuthSessions")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .first();
  },
});

export const deleteInternal = internalMutation({
  args: { id: v.id("connectorAuthSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

