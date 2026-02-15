import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { DataModel, Doc } from "../_generated/dataModel";
import { getUserId } from "../lib/auth";
import type { GenericActionCtx } from "convex/server";
import { cosineSimilarity } from "./insightFingerprint";

const DEFAULT_RETRIEVAL_LIMIT = 20;
const DEFAULT_TOP_K = 8;
const DEFAULT_MEMORY_BUDGET = 2500;
const DEFAULT_ROLLING_DIGEST_BUDGET = 500;

type SavedInsightDoc = Doc<"savedInsights">;
type VectorCandidate = { doc: SavedInsightDoc; score: number };
type ContextPacket = {
  contextOrder: readonly [
    "system_instructions",
    "saved_insights_memory",
    "live_business_snapshot",
    "recent_turns",
    "current_user_message",
  ];
  queryText: string;
  tokenBudget: number;
  memoryTokenEstimate: number;
  selectedInsightIds: Array<SavedInsightDoc["_id"]>;
  savedInsightsBlock: string;
  liveBusinessSnapshot: {
    revenue: { streamCount: number; totalMonthlyRevenue: number; activeStreams: number };
    ideas: { total: number; byStage: Record<string, number> };
    mentorship: { totalSessions: number; recentMentors: string[] };
  };
  recentTurns: string[];
  rollingDigest: string;
  cacheHint: { provider: "google" | "openrouter" | null; ttlSeconds: number; key: string | null };
};

export const buildContextPacket = action({
  args: {
    queryText: v.string(),
    recentTurns: v.optional(v.array(v.string())),
    tokenBudget: v.optional(v.number()),
    previousDigest: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<ContextPacket> => {
    const userId = await getUserId(ctx);
    const tokenBudget = normalizeBudget(args.tokenBudget, DEFAULT_MEMORY_BUDGET);
    const queryText = args.queryText.trim();

    const textCandidates = await ctx.runQuery(
      internal.savedInsights.searchCandidatesInternal,
      {
        userId,
        q: queryText,
        limit: DEFAULT_RETRIEVAL_LIMIT,
      }
    );

    const settings = await ctx.runQuery(internal.userSettings.getWithKeys, {});
    let vectorCandidates: VectorCandidate[] = [];
    let providerForCacheHint: "google" | "openrouter" | null = null;
    if (queryText.length > 0) {
      const provider = settings?.aiProvider;
      if (provider === "anthropic") {
        // Anthropic doesn't provide embeddings in this codebase; fall back to lexical retrieval only.
        providerForCacheHint = null;
      } else {
        const apiKey = provider === "openrouter" ? settings?.openrouterApiKey : settings?.googleApiKey;
      try {
        if (!provider || !apiKey) {
          throw new Error("No embedding credentials configured");
        }
        const embedding = await ctx.runAction(api.ai.embed.embedText, {
          text: queryText,
          provider,
          apiKey,
          dimensions: 1536,
        });
        providerForCacheHint = embedding.provider;
        const withEmbeddings = await ctx.runQuery(
          internal.savedInsights.listForEmbeddingMatchInternal,
          { userId, limit: 100 }
        );
        vectorCandidates = withEmbeddings
          .map((doc) => ({
            doc,
            score: doc.embedding ? cosineSimilarity(embedding.embedding, doc.embedding) : 0,
          }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, DEFAULT_RETRIEVAL_LIMIT);
      } catch {
        // Ignore embedding failures and continue with lexical retrieval only.
      }
      }
    }

    const fused = fuseRankings(textCandidates, vectorCandidates);
    const selected = fused.slice(0, DEFAULT_TOP_K).map((entry) => entry.doc);
    const memoryBlock = compressSavedInsightsForContext(selected, tokenBudget);
    const liveBusinessSnapshot = await buildLiveBusinessSnapshot(ctx);
    const previousDigest = args.previousDigest ?? "";
    const rollingDigest = buildRollingDigest(previousDigest, selected, DEFAULT_ROLLING_DIGEST_BUDGET);

    return {
      contextOrder: [
        "system_instructions",
        "saved_insights_memory",
        "live_business_snapshot",
        "recent_turns",
        "current_user_message",
      ] as const,
      queryText,
      tokenBudget,
      memoryTokenEstimate: estimateTokenCount(memoryBlock),
      selectedInsightIds: selected.map((entry) => entry._id),
      savedInsightsBlock: memoryBlock,
      liveBusinessSnapshot,
      recentTurns: args.recentTurns ?? [],
      rollingDigest,
      cacheHint: {
        provider: providerForCacheHint,
        ttlSeconds: providerForCacheHint === "google" ? 3600 : 0,
        key: providerForCacheHint === "google"
          ? `saved-insights:${userId}:${selected.map((s) => s._id).join(",")}`
          : null,
      },
    };
  },
});

export function fuseRankings(
  textCandidates: Array<{ doc: SavedInsightDoc; textScore: number }>,
  vectorCandidates: VectorCandidate[],
  rrfConstant = 60
): Array<{ doc: SavedInsightDoc; score: number }> {
  const byId = new Map<string, { doc: SavedInsightDoc; score: number }>();

  textCandidates.forEach((candidate, index) => {
    const id = String(candidate.doc._id);
    const score = (1 / (rrfConstant + index + 1)) + 0.25 * candidate.textScore;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, { doc: candidate.doc, score });
      return;
    }
    existing.score += score;
  });

  vectorCandidates.forEach((candidate, index) => {
    const id = String(candidate.doc._id);
    const score = (1 / (rrfConstant + index + 1)) + 0.25 * candidate.score;
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, { doc: candidate.doc, score });
      return;
    }
    existing.score += score;
  });

  return Array.from(byId.values()).sort((a, b) => b.score - a.score);
}

export function compressSavedInsightsForContext(
  insights: SavedInsightDoc[],
  tokenBudget = DEFAULT_MEMORY_BUDGET
): string {
  if (insights.length === 0) return "";
  const sections: string[] = [];
  for (let i = 0; i < insights.length; i++) {
    const insight = insights[i];
    const includeFull = i < 3;
    const actionLine = insight.actionItems.length > 0
      ? `Actions: ${insight.actionItems.join("; ")}`
      : "Actions: none";
    const body = includeFull ? insight.body : insight.bodySummary;
    sections.push(
      [
        `#${i + 1} [${insight.type}] ${insight.title}`,
        `Priority: ${insight.priority}; Confidence: ${Math.round(insight.confidence * 100)}%`,
        body,
        actionLine,
      ].join("\n")
    );
  }

  const maxChars = tokenBudget * 4;
  const joined = sections.join("\n\n");
  if (joined.length <= maxChars) return joined;

  let trimmed = joined.slice(0, maxChars - 3);
  const lastBreak = trimmed.lastIndexOf("\n\n");
  if (lastBreak > 0) {
    trimmed = trimmed.slice(0, lastBreak);
  }
  return `${trimmed}...`;
}

export function estimateTokenCount(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / 4);
}

export function buildRollingDigest(
  previousDigest: string,
  selectedInsights: SavedInsightDoc[],
  tokenBudget = DEFAULT_ROLLING_DIGEST_BUDGET
): string {
  const lines = [
    previousDigest.trim(),
    ...selectedInsights.slice(0, 3).map((insight) =>
      `- ${insight.title}: ${insight.bodySummary || insight.body.slice(0, 140)}`
    ),
  ].filter((line) => line.length > 0);

  const joined = lines.join("\n");
  const maxChars = tokenBudget * 4;
  if (joined.length <= maxChars) return joined;
  return joined.slice(joined.length - maxChars);
}

async function buildLiveBusinessSnapshot(ctx: {
  runQuery: GenericActionCtx<DataModel>["runQuery"];
}): Promise<ContextPacket["liveBusinessSnapshot"]> {
  const [streams, ideas, mentorshipSessions]: [
    Array<{ monthlyRevenue: number; status: string }>,
    Array<{ stage: string }>,
    Array<{ mentorName: string }>,
  ] = await Promise.all([
    ctx.runQuery(api.incomeStreams.list, {}),
    ctx.runQuery(api.ideas.list, {}),
    ctx.runQuery(api.mentorshipSessions.list, {}),
  ]);

  const totalMonthlyRevenue = streams.reduce(
    (sum: number, stream: { monthlyRevenue: number }) => sum + stream.monthlyRevenue,
    0
  );

  return {
    revenue: {
      streamCount: streams.length,
      totalMonthlyRevenue,
      activeStreams: streams.filter((stream: { status: string }) => stream.status === "active").length,
    },
    ideas: {
      total: ideas.length,
      byStage: ideas.reduce((acc: Record<string, number>, idea: { stage: string }) => {
        acc[idea.stage] = (acc[idea.stage] ?? 0) + 1;
        return acc;
      }, {}),
    },
    mentorship: {
      totalSessions: mentorshipSessions.length,
      recentMentors: mentorshipSessions.slice(0, 5).map((session: { mentorName: string }) => session.mentorName),
    },
  };
}

function normalizeBudget(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(500, Math.min(8000, Math.floor(value)));
}
