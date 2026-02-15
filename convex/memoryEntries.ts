import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getUserId } from "./lib/auth";
import { validateShortText } from "./lib/validate";

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(min, Math.min(max, n));
}

const Kind = v.union(v.literal("semantic"), v.literal("procedural"), v.literal("episodic"));
const Source = v.union(v.literal("user"), v.literal("agent"), v.literal("system"));

export const list = query({
  args: {
    limit: v.optional(v.number()),
    kind: v.optional(Kind),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = clampInt(args.limit, 30, 1, 200);
    const includeArchived = Boolean(args.includeArchived);
    const kind = args.kind;

    const rows = kind
      ? await ctx.db
        .query("memoryEntries")
        .withIndex("by_user_kind_updated", (q) => q.eq("userId", userId).eq("kind", kind))
        .order("desc")
        .take(limit * 2)
      : await ctx.db
        .query("memoryEntries")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit * 2);

    const filtered = includeArchived ? rows : rows.filter((r) => !r.archived);
    return filtered.slice(0, limit);
  },
});

export const listInternal = internalQuery({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    kind: v.optional(Kind),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const limit = clampInt(args.limit, 30, 1, 200);
    const includeArchived = Boolean(args.includeArchived);
    const kind = args.kind;

    const rows = kind
      ? await ctx.db
        .query("memoryEntries")
        .withIndex("by_user_kind_updated", (q) => q.eq("userId", userId).eq("kind", kind))
        .order("desc")
        .take(limit * 2)
      : await ctx.db
        .query("memoryEntries")
        .withIndex("by_user_updated", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit * 2);

    const filtered = includeArchived ? rows : rows.filter((r) => !r.archived);
    return filtered.slice(0, limit);
  },
});

export const search = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
    kind: v.optional(Kind),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const q = args.q.trim();
    if (!q) return [];
    const limit = clampInt(args.limit, 8, 1, 20);
    const includeArchived = Boolean(args.includeArchived);
    const kind = args.kind;

    const res = await ctx.db
      .query("memoryEntries")
      .withSearchIndex("search_text", (q2) => {
        let query = q2.search("content", q).eq("userId", userId);
        if (kind) query = query.eq("kind", kind);
        if (!includeArchived) query = query.eq("archived", false);
        return query;
      })
      .take(limit);

    return res;
  },
});

export const searchInternal = internalQuery({
  args: {
    userId: v.string(),
    q: v.string(),
    limit: v.optional(v.number()),
    kind: v.optional(Kind),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const q = args.q.trim();
    if (!q) return [];
    const limit = clampInt(args.limit, 8, 1, 20);
    const includeArchived = Boolean(args.includeArchived);
    const kind = args.kind;

    const res = await ctx.db
      .query("memoryEntries")
      .withSearchIndex("search_text", (q2) => {
        let query = q2.search("content", q).eq("userId", userId);
        if (kind) query = query.eq("kind", kind);
        if (!includeArchived) query = query.eq("archived", false);
        return query;
      })
      .take(limit);

    return res;
  },
});

export const create = mutation({
  args: {
    kind: Kind,
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    validateShortText(args.title, "Title");
    const now = Date.now();
    return await ctx.db.insert("memoryEntries", {
      userId,
      kind: args.kind,
      title: args.title.trim(),
      content: args.content,
      source: "user",
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("memoryEntries"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");

    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title.trim();
    if (args.content !== undefined) patch.content = args.content;
    if (args.archived !== undefined) patch.archived = Boolean(args.archived);
    await ctx.db.patch(args.id, patch);
  },
});

export const createInternal = internalMutation({
  args: {
    userId: v.string(),
    kind: Kind,
    title: v.string(),
    content: v.string(),
    source: Source,
  },
  handler: async (ctx, args) => {
    validateShortText(args.title, "Title");
    const now = Date.now();
    return await ctx.db.insert("memoryEntries", {
      userId: args.userId,
      kind: args.kind,
      title: args.title.trim(),
      content: args.content,
      source: args.source,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});
