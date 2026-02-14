import type { DataModel, Id } from "./_generated/dataModel";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getUserId } from "./lib/auth";
import type { GenericActionCtx } from "convex/server";
import {
  buildInsightHash,
  cosineSimilarity,
} from "./ai/insightFingerprint";
import { findBestLexicalDuplicate } from "./savedInsights";

const GENERATED_INSIGHT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const NEAR_DUPLICATE_VECTOR_THRESHOLD = 0.92;
const NEAR_DUPLICATE_LEXICAL_THRESHOLD = 0.88;

export type SaveGeneratedResult =
  | { status: "saved"; savedInsightId: Id<"savedInsights"> }
  | { status: "already_saved"; savedInsightId: Id<"savedInsights"> }
  | { status: "near_duplicate"; candidateId: Id<"savedInsights">; similarity: number };

export const listGenerated = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return insights.filter((insight) => {
      if (typeof insight.expiresAt !== "number") return true;
      return insight.expiresAt > now;
    });
  },
});

// Backward-compatible alias used by existing frontend code.
export const list = listGenerated;

export const create = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    body: v.string(),
    actionItems: v.array(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    confidence: v.number(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const createdAt = Date.now();
    const contentHash = buildInsightHash({
      type: args.type,
      title: args.title,
      body: args.body,
      actionItems: args.actionItems,
    });

    const existing = await ctx.db
      .query("aiInsights")
      .withIndex("by_user_hash", (q) =>
        q.eq("userId", userId).eq("contentHash", contentHash)
      )
      .first();

    if (existing && (!existing.expiresAt || existing.expiresAt > createdAt)) {
      return existing._id;
    }

    return await ctx.db.insert("aiInsights", {
      userId,
      type: args.type,
      title: args.title,
      body: args.body,
      actionItems: args.actionItems,
      priority: args.priority,
      confidence: args.confidence,
      model: args.model,
      status: "unread",
      contentHash,
      expiresAt: createdAt + GENERATED_INSIGHT_TTL_MS,
      createdAt,
    });
  },
});

export const saveGenerated = action({
  args: {
    generatedInsightId: v.id("aiInsights"),
    allowNearDuplicate: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<SaveGeneratedResult> => {
    const userId = await getUserId(ctx);
    const settings = await ctx.runQuery(internal.userSettings.getWithKeys, {});
    const generated = await ctx.runQuery(internal.aiInsights.getForSaveInternal, {
      id: args.generatedInsightId,
      userId,
    });
    if (!generated) {
      throw new Error("Generated insight not found");
    }

    const contentHash = generated.contentHash || buildInsightHash({
      type: generated.type,
      title: generated.title,
      body: generated.body,
      actionItems: generated.actionItems,
    });
    const existing = await ctx.runQuery(internal.savedInsights.findByHashInternal, {
      userId,
      contentHash,
    });
    if (existing) {
      return {
        status: "already_saved",
        savedInsightId: existing._id,
      };
    }

    const searchText = buildSearchText(generated);
    const embedResult = await tryEmbedForDedupe(ctx, {
      text: searchText,
      settings: settings ?? null,
    });

    let nearDuplicate: { candidateId: Id<"savedInsights">; similarity: number } | null = null;
    if (embedResult?.embedding) {
      nearDuplicate = await findNearDuplicateByVector(ctx, {
        userId,
        embedding: embedResult.embedding,
      });
    }

    if (!nearDuplicate) {
      const lexicalCandidates = await ctx.runQuery(
        internal.savedInsights.listForLexicalDedupeInternal,
        { userId, limit: 80 }
      );
      nearDuplicate = findBestLexicalDuplicate(
        searchText,
        lexicalCandidates,
        NEAR_DUPLICATE_LEXICAL_THRESHOLD
      );
    }

    if (nearDuplicate && !args.allowNearDuplicate) {
      return {
        status: "near_duplicate",
        candidateId: nearDuplicate.candidateId,
        similarity: nearDuplicate.similarity,
      };
    }

    const savedAt = Date.now();
    const savedInsightId = await ctx.runMutation(internal.savedInsights.createInternal, {
      userId,
      sourceInsightId: generated._id,
      contentHash,
      type: generated.type,
      title: generated.title,
      body: generated.body,
      bodySummary: summarizeInsightBody(generated.body),
      actionItems: generated.actionItems,
      priority: generated.priority,
      confidence: generated.confidence,
      model: generated.model,
      keywords: extractKeywords(generated),
      searchText,
      embedding: embedResult?.embedding,
      embeddingModel: embedResult?.model,
      embeddingVersion: embedResult?.version,
      generatedAt: generated.createdAt,
      savedAt,
    });

    return {
      status: "saved",
      savedInsightId,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("aiInsights"),
    status: v.union(v.literal("unread"), v.literal("read"), v.literal("dismissed")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Insight not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: {
    id: v.id("aiInsights"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Insight not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});

export const getForSaveInternal = internalQuery({
  args: {
    id: v.id("aiInsights"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.id);
    if (!insight || insight.userId !== args.userId) return null;
    return insight;
  },
});

export const cleanupExpiredInternal = internalMutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = Math.max(1, Math.min(args.limit ?? 500, 2000));
    const all = await ctx.db.query("aiInsights").collect();
    const expired = all
      .filter((insight) => typeof insight.expiresAt === "number" && insight.expiresAt <= now)
      .slice(0, limit);

    for (const insight of expired) {
      await ctx.db.delete(insight._id);
    }

    return {
      scanned: all.length,
      deleted: expired.length,
    };
  },
});

function summarizeInsightBody(body: string): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (normalized.length <= 260) return normalized;
  return `${normalized.slice(0, 257)}...`;
}

function buildSearchText(insight: {
  type: string;
  title: string;
  body: string;
  actionItems: string[];
}): string {
  return [
    insight.type,
    insight.title,
    insight.body,
    insight.actionItems.join(" "),
  ].join(" ").replace(/\s+/g, " ").trim();
}

function extractKeywords(insight: {
  type: string;
  title: string;
  body: string;
  actionItems: string[];
}): string[] {
  const seed = `${insight.type} ${insight.title} ${insight.actionItems.join(" ")}`;
  const tokens = seed
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) =>
      token.length >= 4
      && !["this", "that", "with", "from", "into", "your", "have", "will", "should"].includes(token)
    );

  const unique = Array.from(new Set(tokens));
  if (unique.length >= 8) return unique.slice(0, 8);

  const bodyTokens = insight.body
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 5);
  for (const token of bodyTokens) {
    if (!unique.includes(token)) unique.push(token);
    if (unique.length >= 8) break;
  }
  return unique;
}

async function tryEmbedForDedupe(ctx: {
  runAction: GenericActionCtx<DataModel>["runAction"];
}, args: {
  text: string;
  settings: {
    aiProvider: "openrouter" | "google";
    openrouterApiKey?: string;
    googleApiKey?: string;
  } | null;
}): Promise<{
  embedding: number[];
  model: string;
  version: string;
} | null> {
  if (!args.settings) return null;
  const provider = args.settings.aiProvider;
  const apiKey = provider === "openrouter"
    ? args.settings.openrouterApiKey
    : args.settings.googleApiKey;
  if (!apiKey) return null;

  try {
    const response = await ctx.runAction(api.ai.embed.embedText, {
      text: args.text,
      provider,
      apiKey,
      dimensions: 1536,
    });
    return {
      embedding: response.embedding,
      model: response.model,
      version: response.version,
    };
  } catch {
    return null;
  }
}

export const createDigestInternal = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    actionItems: v.array(v.string()),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiInsights", {
      userId: args.userId,
      type: "weekly-digest",
      title: args.title,
      body: args.body,
      actionItems: args.actionItems,
      priority: "high",
      confidence: 1,
      model: args.model,
      status: "unread",
      createdAt: Date.now(),
    });
  },
});

export const getUnreadDigests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const all = await ctx.db
      .query("aiInsights")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return all.filter(
      (i) => i.type === "weekly-digest" && i.status === "unread"
    );
  },
});

async function findNearDuplicateByVector(ctx: {
  runQuery: GenericActionCtx<DataModel>["runQuery"];
}, args: {
  userId: string;
  embedding: number[];
}): Promise<{ candidateId: Id<"savedInsights">; similarity: number } | null> {
  const vectorCandidates = await ctx.runQuery(
    internal.savedInsights.listForEmbeddingMatchInternal,
    {
      userId: args.userId,
      limit: 100,
    }
  );

  let best: { candidateId: Id<"savedInsights">; similarity: number } | null = null;
  for (const candidate of vectorCandidates) {
    if (!Array.isArray(candidate.embedding)) continue;
    const similarity = cosineSimilarity(args.embedding, candidate.embedding);
    if (similarity < NEAR_DUPLICATE_VECTOR_THRESHOLD) continue;
    if (!best || similarity > best.similarity) {
      best = { candidateId: candidate._id, similarity };
    }
  }
  return best;
}
