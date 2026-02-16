import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listByTier = query({
  args: {
    tier: v.union(v.literal("persistent"), v.literal("archival"), v.literal("session")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { tier, limit = 50 }) => {
    const userId = await getUserId(ctx);
    return ctx.db
      .query("memoryEntries")
      .withIndex("by_user_tier_updated", (q) =>
        q.eq("userId", userId).eq("tier", tier)
      )
      .order("desc")
      .filter((q) => q.eq(q.field("archived"), false))
      .take(limit);
  },
});

export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    const userId = await getUserId(ctx);
    return ctx.db
      .query("memoryEntries")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .filter((q) => q.eq(q.field("archived"), false))
      .take(limit);
  },
});

export const search = query({
  args: {
    query: v.string(),
    tier: v.optional(v.union(v.literal("persistent"), v.literal("archival"), v.literal("session"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query: searchQuery, tier, limit = 20 }) => {
    const userId = await getUserId(ctx);
    return ctx.db
      .query("memoryEntries")
      .withSearchIndex("search_content", (q) => {
        let s = q.search("content", searchQuery).eq("userId", userId).eq("archived", false);
        if (tier) s = s.eq("tier", tier);
        return s;
      })
      .take(limit);
  },
});

// ─── Mutations ────────────────────────────────────────────────────────────────

export const save = mutation({
  args: {
    tier: v.union(v.literal("persistent"), v.literal("archival"), v.literal("session")),
    category: v.string(),
    title: v.string(),
    content: v.string(),
    importance: v.optional(v.number()),
    source: v.optional(v.union(v.literal("user"), v.literal("agent"))),
  },
  handler: async (ctx, { tier, category, title, content, importance = 5, source = "agent" }) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    return ctx.db.insert("memoryEntries", {
      userId,
      tier,
      category,
      title,
      content,
      importance,
      source,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    memoryId: v.id("memoryEntries"),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
    importance: v.optional(v.number()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, { memoryId, ...patch }) => {
    const userId = await getUserId(ctx);
    const entry = await ctx.db.get(memoryId);
    if (!entry || entry.userId !== userId) return;
    await ctx.db.patch(memoryId, { ...patch, updatedAt: Date.now() });
  },
});

export const archive = mutation({
  args: { memoryId: v.id("memoryEntries") },
  handler: async (ctx, { memoryId }) => {
    const userId = await getUserId(ctx);
    const entry = await ctx.db.get(memoryId);
    if (!entry || entry.userId !== userId) return;
    await ctx.db.patch(memoryId, { archived: true, updatedAt: Date.now() });
  },
});

// Clear all session memories (called at end of conversation)
export const clearSessionMemories = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const sessionEntries = await ctx.db
      .query("memoryEntries")
      .withIndex("by_user_tier_updated", (q) =>
        q.eq("userId", userId).eq("tier", "session")
      )
      .collect();
    for (const entry of sessionEntries) {
      await ctx.db.delete(entry._id);
    }
  },
});

// ─── Soul File (long-form user profile) ──────────────────────────────────────

export const getSoulFile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const upsertSoulFile = mutation({
  args: { content: v.string() },
  handler: async (ctx, { content }) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        content,
        version: existing.version + 1,
        updatedAt: now,
      });
      return existing._id;
    }
    return ctx.db.insert("soulFiles", {
      userId,
      content,
      version: 1,
      updatedAt: now,
    });
  },
});
