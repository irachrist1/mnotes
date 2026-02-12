import type { DataModel, Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import type { GenericQueryCtx } from "convex/server";
import { getUserId } from "./lib/auth";
import { trigramJaccardSimilarity } from "./ai/insightFingerprint";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type SavedInsightDoc = Doc<"savedInsights">;
type QueryCtx = GenericQueryCtx<DataModel>;

export type CommandPaletteInsightItem = {
  kind: "savedInsight";
  id: Id<"savedInsights">;
  title: string;
  subtitle: string;
  route: string;
  type: string;
  priority: "low" | "medium" | "high";
  pinned: boolean;
  savedAt: number;
  score: number;
};

export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const includeArchived = args.includeArchived ?? false;
    const limit = normalizeLimit(args.limit, 100);

    if (includeArchived) {
      return await ctx.db
        .query("savedInsights")
        .withIndex("by_user_savedAt", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("savedInsights")
      .withIndex("by_user_archived_savedAt", (q) =>
        q.eq("userId", userId).eq("archived", false)
      )
      .order("desc")
      .take(limit);
  },
});

export const getById = query({
  args: {
    id: v.id("savedInsights"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const insight = await ctx.db.get(args.id);
    if (!insight || insight.userId !== userId) return null;
    return insight;
  },
});

export const search = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
    includeArchived: v.optional(v.boolean()),
    type: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<CommandPaletteInsightItem[]> => {
    const userId = await getUserId(ctx);
    const includeArchived = args.includeArchived ?? false;
    const limit = normalizeLimit(args.limit);
    const queryText = args.q.trim();

    const candidates = queryText.length > 0
      ? await searchByText(ctx, {
        userId,
        q: queryText,
        includeArchived,
        fetchLimit: Math.min(limit * 4, MAX_LIMIT),
      })
      : await recentCandidates(ctx, {
        userId,
        includeArchived,
        fetchLimit: Math.min(limit * 4, MAX_LIMIT),
      });

    const now = Date.now();
    const filtered = candidates.filter((candidate) => {
      if (args.type && candidate.doc.type !== args.type) return false;
      if (args.priority && candidate.doc.priority !== args.priority) return false;
      if (args.pinned !== undefined && candidate.doc.pinned !== args.pinned) return false;
      if (!includeArchived && candidate.doc.archived) return false;
      return true;
    });

    return filtered
      .map((candidate) => {
        const score = computeCommandScore({
          textScore: candidate.textScore,
          savedAt: candidate.doc.savedAt,
          pinned: candidate.doc.pinned,
          usedCount: candidate.doc.usedCount,
          now,
        });
        return toCommandPaletteItem(candidate.doc, score);
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
});

export const archive = mutation({
  args: {
    id: v.id("savedInsights"),
    archived: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Saved insight not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.id, { archived: args.archived });
  },
});

export const togglePin = mutation({
  args: {
    id: v.id("savedInsights"),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Saved insight not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    const next = args.pinned ?? !existing.pinned;
    await ctx.db.patch(args.id, { pinned: next });
  },
});

export const remove = mutation({
  args: {
    id: v.id("savedInsights"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Saved insight not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});

export const touchUsage = mutation({
  args: {
    id: v.id("savedInsights"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Saved insight not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.id, {
      lastUsedAt: Date.now(),
      usedCount: existing.usedCount + 1,
    });
  },
});

export const findByHashInternal = internalQuery({
  args: {
    userId: v.string(),
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savedInsights")
      .withIndex("by_user_hash", (q) =>
        q.eq("userId", args.userId).eq("contentHash", args.contentHash)
      )
      .first();
  },
});

export const searchCandidatesInternal = internalQuery({
  args: {
    userId: v.string(),
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await searchByText(ctx, {
      userId: args.userId,
      q: args.q.trim(),
      includeArchived: false,
      fetchLimit: normalizeLimit(args.limit, 20),
    });
  },
});

export const listForEmbeddingMatchInternal = internalQuery({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savedInsights")
      .withIndex("by_user_archived_savedAt", (q) =>
        q.eq("userId", args.userId).eq("archived", false)
      )
      .order("desc")
      .take(normalizeLimit(args.limit, 100))
      .then((docs) => docs.filter((doc) => Array.isArray(doc.embedding)));
  },
});

export const listForLexicalDedupeInternal = internalQuery({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("savedInsights")
      .withIndex("by_user_archived_savedAt", (q) =>
        q.eq("userId", args.userId).eq("archived", false)
      )
      .order("desc")
      .take(normalizeLimit(args.limit, 80));
  },
});

export const createInternal = internalMutation({
  args: {
    userId: v.string(),
    sourceInsightId: v.id("aiInsights"),
    contentHash: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    bodySummary: v.string(),
    actionItems: v.array(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    confidence: v.number(),
    model: v.string(),
    keywords: v.array(v.string()),
    searchText: v.string(),
    embedding: v.optional(v.array(v.number())),
    embeddingModel: v.optional(v.string()),
    embeddingVersion: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
    archived: v.optional(v.boolean()),
    generatedAt: v.number(),
    savedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("savedInsights", {
      userId: args.userId,
      sourceInsightId: args.sourceInsightId,
      contentHash: args.contentHash,
      type: args.type,
      title: args.title,
      body: args.body,
      bodySummary: args.bodySummary,
      actionItems: args.actionItems,
      priority: args.priority,
      confidence: args.confidence,
      model: args.model,
      keywords: args.keywords,
      searchText: args.searchText,
      embedding: args.embedding,
      embeddingModel: args.embeddingModel,
      embeddingVersion: args.embeddingVersion,
      pinned: args.pinned ?? false,
      archived: args.archived ?? false,
      generatedAt: args.generatedAt,
      savedAt: args.savedAt,
      usedCount: 0,
    });
  },
});

export function findBestLexicalDuplicate(
  candidateText: string,
  existingInsights: SavedInsightDoc[],
  threshold = 0.88
): { candidateId: Id<"savedInsights">; similarity: number } | null {
  let best: { candidateId: Id<"savedInsights">; similarity: number } | null = null;
  for (const existing of existingInsights) {
    const similarity = trigramJaccardSimilarity(candidateText, existing.searchText);
    if (similarity < threshold) continue;
    if (!best || similarity > best.similarity) {
      best = { candidateId: existing._id, similarity };
    }
  }
  return best;
}

export function computeCommandScore(args: {
  textScore: number;
  savedAt: number;
  pinned: boolean;
  usedCount: number;
  now: number;
}): number {
  const ageDays = Math.max(0, (args.now - args.savedAt) / (24 * 60 * 60 * 1000));
  const recencyScore = Math.exp(-ageDays / 30);
  const pinnedBoost = args.pinned ? 1 : 0;
  const usageBoost = Math.min(args.usedCount / 10, 1);
  return (
    0.55 * args.textScore
    + 0.2 * recencyScore
    + 0.15 * pinnedBoost
    + 0.1 * usageBoost
  );
}

function toCommandPaletteItem(
  doc: SavedInsightDoc,
  score: number
): CommandPaletteInsightItem {
  return {
    kind: "savedInsight",
    id: doc._id,
    title: doc.title,
    subtitle: doc.bodySummary || doc.body.slice(0, 120),
    route: `/dashboard/ai-insights?tab=saved&saved=${doc._id}`,
    type: doc.type,
    priority: doc.priority,
    pinned: doc.pinned,
    savedAt: doc.savedAt,
    score,
  };
}

function normalizeLimit(limit: number | undefined, fallback = DEFAULT_LIMIT): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) return fallback;
  return Math.max(1, Math.min(Math.floor(limit), MAX_LIMIT));
}

async function searchByText(
  ctx: QueryCtx,
  args: {
    userId: string;
    q: string;
    includeArchived: boolean;
    fetchLimit: number;
  }
): Promise<Array<{ doc: SavedInsightDoc; textScore: number }>> {
  if (args.q.length === 0) return [];

  const raw = await ctx.db
    .query("savedInsights")
    .withSearchIndex("search_text", (q) => {
      const base = q.search("searchText", args.q).eq("userId", args.userId);
      return args.includeArchived ? base : base.eq("archived", false);
    })
    .take(args.fetchLimit);

  const maxRank = Math.max(1, raw.length);
  return raw.map((doc: SavedInsightDoc, index: number) => ({
    doc,
    textScore: 1 - index / maxRank,
  }));
}

async function recentCandidates(
  ctx: QueryCtx,
  args: {
    userId: string;
    includeArchived: boolean;
    fetchLimit: number;
  }
): Promise<Array<{ doc: SavedInsightDoc; textScore: number }>> {
  const docs = args.includeArchived
    ? await ctx.db
      .query("savedInsights")
      .withIndex("by_user_savedAt", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.fetchLimit)
    : await ctx.db
      .query("savedInsights")
      .withIndex("by_user_archived_savedAt", (q: any) =>
        q.eq("userId", args.userId).eq("archived", false)
      )
      .order("desc")
      .take(args.fetchLimit);

  return docs.map((doc: SavedInsightDoc) => ({ doc, textScore: 0.5 }));
}
