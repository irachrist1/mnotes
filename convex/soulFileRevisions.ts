import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getUserId } from "./lib/auth";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = Math.max(1, Math.min(30, Math.floor(args.limit ?? 10)));
    const rows = await ctx.db
      .query("soulFileRevisions")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return rows.map((r) => ({
      _id: r._id,
      version: r.version,
      source: r.source,
      createdAt: r.createdAt,
    }));
  },
});

export const restore = mutation({
  args: { revisionId: v.id("soulFileRevisions") },
  handler: async (ctx, args): Promise<{ restored: boolean }> => {
    const userId = await getUserId(ctx);
    const rev = await ctx.db.get(args.revisionId);
    if (!rev || rev.userId !== userId) throw new Error("Not found");

    const soul = await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!soul) throw new Error("Soul file not found");

    // Save current state as a revision before restoring.
    await ctx.db.insert("soulFileRevisions", {
      userId,
      soulFileId: soul._id,
      version: soul.version,
      content: soul.content,
      source: "manual",
      createdAt: Date.now(),
    });

    await ctx.db.patch(soul._id, {
      content: rev.content,
      version: soul.version + 1,
      updatedAt: Date.now(),
    });

    return { restored: true };
  },
});

// Internal helper used by soulFile evolve paths.
export const captureRevisionInternal = internalMutation({
  args: {
    userId: v.string(),
    soulFileId: v.id("soulFiles"),
    version: v.number(),
    content: v.string(),
    source: v.union(v.literal("manual"), v.literal("ai-evolve")),
  },
  handler: async (ctx, args): Promise<Id<"soulFileRevisions">> => {
    return await ctx.db.insert("soulFileRevisions", {
      userId: args.userId,
      soulFileId: args.soulFileId,
      version: args.version,
      content: args.content,
      source: args.source,
      createdAt: Date.now(),
    });
  },
});

