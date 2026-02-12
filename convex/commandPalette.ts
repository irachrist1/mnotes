import { query } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;

export type CommandPaletteSearchResult = {
  kind: "savedInsight" | "idea" | "mentorship" | "income";
  id: string;
  title: string;
  subtitle: string;
  route: string;
  score: number;
  priority: "low" | "medium" | "high" | null;
};

type RankableCandidate = {
  kind: CommandPaletteSearchResult["kind"];
  id: string;
  title: string;
  subtitle: string;
  route: string;
  searchText: string;
  createdAt: number;
  pinnedBoost: number;
  priority: "low" | "medium" | "high" | null;
};

export const search = query({
  args: {
    q: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<CommandPaletteSearchResult[]> => {
    const userId = await getUserId(ctx);
    const limit = normalizeLimit(args.limit);
    const queryText = args.q.trim();
    const queryTokens = tokenizeQuery(queryText);

    const [savedInsights, ideas, mentorshipSessions, incomeStreams] = await Promise.all([
      ctx.db
        .query("savedInsights")
        .withIndex("by_user_archived_savedAt", (q) =>
          q.eq("userId", userId).eq("archived", false)
        )
        .order("desc")
        .take(180),
      ctx.db
        .query("ideas")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(180),
      ctx.db
        .query("mentorshipSessions")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(180),
      ctx.db
        .query("incomeStreams")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(180),
    ]);

    const candidates: RankableCandidate[] = [
      ...savedInsights.map((insight) => ({
        kind: "savedInsight" as const,
        id: String(insight._id),
        title: insight.title,
        subtitle: insight.bodySummary || insight.body.slice(0, 140),
        route: `/dashboard/ai-insights?tab=saved&saved=${insight._id}`,
        searchText: [
          insight.title,
          insight.bodySummary,
          insight.body,
          insight.actionItems.join(" "),
          insight.type,
          insight.keywords.join(" "),
        ].join(" "),
        createdAt: insight.savedAt,
        pinnedBoost: insight.pinned ? 0.2 : 0,
        priority: insight.priority,
      })),
      ...ideas.map((idea) => ({
        kind: "idea" as const,
        id: String(idea._id),
        title: idea.title,
        subtitle: `${formatIdeaStage(idea.stage)} • ${idea.potentialRevenue} revenue potential`,
        route: "/dashboard/ideas",
        searchText: [
          idea.title,
          idea.description,
          idea.category,
          idea.stage,
          idea.tags.join(" "),
          idea.nextSteps.join(" "),
          idea.sourceOfInspiration,
        ].join(" "),
        createdAt: Date.parse(idea.createdDate) || Date.now(),
        pinnedBoost: 0,
        priority: toPriorityFromRevenue(idea.potentialRevenue),
      })),
      ...mentorshipSessions.map((session) => ({
        kind: "mentorship" as const,
        id: String(session._id),
        title: session.mentorName,
        subtitle: `${session.sessionType} session • ${session.date}`,
        route: "/dashboard/mentorship",
        searchText: [
          session.mentorName,
          session.sessionType,
          session.topics.join(" "),
          session.keyInsights.join(" "),
          session.notes,
          session.actionItems.map((item) => item.task).join(" "),
        ].join(" "),
        createdAt: session.createdAt,
        pinnedBoost: 0,
        priority: toPriorityFromRating(session.rating),
      })),
      ...incomeStreams.map((stream) => ({
        kind: "income" as const,
        id: String(stream._id),
        title: stream.name,
        subtitle: `${stream.status} • $${stream.monthlyRevenue.toFixed(0)}/mo`,
        route: "/dashboard/income",
        searchText: [
          stream.name,
          stream.category,
          stream.status,
          stream.notes ?? "",
          stream.clientInfo ?? "",
        ].join(" "),
        createdAt: stream.createdAt,
        pinnedBoost: 0,
        priority: toPriorityFromRevenueAmount(stream.monthlyRevenue),
      })),
    ];

    const now = Date.now();
    const ranked = candidates
      .map((candidate) => ({
        ...candidate,
        textScore: computeTextScore(candidate.searchText, queryTokens, queryText),
      }))
      .filter((candidate) => {
        if (queryTokens.length === 0) return true;
        return candidate.textScore > 0;
      })
      .map((candidate) => ({
        ...candidate,
        score: computeResultScore({
          textScore: candidate.textScore,
          createdAt: candidate.createdAt,
          pinnedBoost: candidate.pinnedBoost,
          now,
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ranked.map((candidate) => ({
      kind: candidate.kind,
      id: candidate.id,
      title: candidate.title,
      subtitle: candidate.subtitle,
      route: candidate.route,
      score: candidate.score,
      priority: candidate.priority,
    }));
  },
});

export function tokenizeQuery(queryText: string): string[] {
  return queryText
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function computeTextScore(
  haystack: string,
  queryTokens: string[],
  queryText: string
): number {
  if (queryTokens.length === 0) return 0.5;
  const normalizedHaystack = haystack.toLowerCase();

  let tokenHits = 0;
  for (const token of queryTokens) {
    if (normalizedHaystack.includes(token)) {
      tokenHits += 1;
    }
  }

  const tokenCoverage = tokenHits / queryTokens.length;
  const phraseBonus = queryText.length > 0
    && normalizedHaystack.includes(queryText.toLowerCase())
    ? 0.2
    : 0;
  return Math.min(1, tokenCoverage + phraseBonus);
}

export function computeResultScore(args: {
  textScore: number;
  createdAt: number;
  pinnedBoost: number;
  now: number;
}): number {
  const ageDays = Math.max(0, (args.now - args.createdAt) / (24 * 60 * 60 * 1000));
  const recencyScore = Math.exp(-ageDays / 45);
  return (0.65 * args.textScore) + (0.25 * recencyScore) + args.pinnedBoost;
}

function normalizeLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)));
}

function toPriorityFromRevenue(
  value: "low" | "medium" | "high" | "very-high"
): "low" | "medium" | "high" {
  if (value === "very-high" || value === "high") return "high";
  if (value === "medium") return "medium";
  return "low";
}

function toPriorityFromRevenueAmount(value: number): "low" | "medium" | "high" {
  if (value >= 5000) return "high";
  if (value >= 1500) return "medium";
  return "low";
}

function toPriorityFromRating(value: number): "low" | "medium" | "high" {
  if (value >= 9) return "high";
  if (value >= 7) return "medium";
  return "low";
}

function formatIdeaStage(
  stage: "raw-thought" | "researching" | "validating" | "developing" | "testing" | "launched"
): string {
  switch (stage) {
    case "raw-thought":
      return "Raw thought";
    case "researching":
      return "Researching";
    case "validating":
      return "Validating";
    case "developing":
      return "Developing";
    case "testing":
      return "Testing";
    case "launched":
      return "Launched";
    default:
      return stage;
  }
}
