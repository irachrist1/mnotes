import { query } from "./_generated/server";
import { getUserId } from "./lib/auth";

/**
 * Returns true when the user has zero domain data (no income streams, no ideas,
 * no mentorship sessions). Used to detect fresh-onboarded users for the
 * chat-first landing experience.
 */
export const isEmpty = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);

    const firstIncome = await ctx.db
      .query("incomeStreams")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (firstIncome) return false;

    const firstIdea = await ctx.db
      .query("ideas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (firstIdea) return false;

    const firstSession = await ctx.db
      .query("mentorshipSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (firstSession) return false;

    return true;
  },
});

// ---------------------------------------------------------------------------
// Recent Activity — union of latest items across all tables
// ---------------------------------------------------------------------------

type ActivityItem = {
  type: "income" | "idea" | "mentorship" | "task" | "insight";
  title: string;
  timestamp: number;
  id: string;
};

export const recentActivity = query({
  args: {},
  handler: async (ctx): Promise<ActivityItem[]> => {
    const userId = await getUserId(ctx);

    const [incomes, ideas, sessions, tasks, insights] = await Promise.all([
      ctx.db
        .query("incomeStreams")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(5),
      ctx.db
        .query("ideas")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(5),
      ctx.db
        .query("mentorshipSessions")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(5),
      ctx.db
        .query("tasks")
        .withIndex("by_user_created", (q) => q.eq("userId", userId))
        .order("desc")
        .take(5),
      ctx.db
        .query("aiInsights")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(5),
    ]);

    const items: ActivityItem[] = [
      ...incomes.map((i) => ({
        type: "income" as const,
        title: `Added income stream: ${i.name}`,
        timestamp: i.createdAt,
        id: i._id,
      })),
      ...ideas.map((i) => ({
        type: "idea" as const,
        title: `Idea: ${i.title}`,
        timestamp: new Date(i.createdDate).getTime() || i._creationTime,
        id: i._id,
      })),
      ...sessions.map((s) => ({
        type: "mentorship" as const,
        title: `Mentor session with ${s.mentorName}`,
        timestamp: s.createdAt,
        id: s._id,
      })),
      ...tasks.map((t) => ({
        type: "task" as const,
        title: t.done ? `Completed: ${t.title}` : `Task: ${t.title}`,
        timestamp: t.createdAt,
        id: t._id,
      })),
      ...insights.map((ins) => ({
        type: "insight" as const,
        title: ins.title,
        timestamp: ins.createdAt,
        id: ins._id,
      })),
    ];

    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, 15);
  },
});

// ---------------------------------------------------------------------------
// Goal Progress — parse soul file goals, cross-reference with data
// ---------------------------------------------------------------------------

type GoalItem = {
  label: string;
  current: number;
  target: number;
  unit: string;
  percentage: number;
};

export const goalProgress = query({
  args: {},
  handler: async (ctx): Promise<{ goals: GoalItem[] }> => {
    const userId = await getUserId(ctx);

    const soulFile = await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!soulFile) return { goals: [] };

    const goals: GoalItem[] = [];

    // Parse ## Goals section from soul file markdown
    const goalsMatch = soulFile.content.match(
      /## Goals\s*\n([\s\S]*?)(?=\n##\s|\n*$)/
    );
    if (!goalsMatch) return { goals: [] };

    const goalLines = goalsMatch[1]
      .split("\n")
      .map((l: string) => l.replace(/^[-*]\s*/, "").trim())
      .filter((l: string) => l.length > 0);

    // Look for revenue/money goals (e.g., "$10k", "$10,000")
    const revenueRegex =
      /\$\s*([\d,]+(?:\.\d+)?)\s*(k|K|m|M)?/;

    for (const line of goalLines) {
      const match = line.match(revenueRegex);
      if (match) {
        let target = parseFloat(match[1].replace(/,/g, ""));
        const suffix = match[2]?.toLowerCase();
        if (suffix === "k") target *= 1000;
        if (suffix === "m") target *= 1_000_000;

        // Get sum of active income streams
        const activeIncome = await ctx.db
          .query("incomeStreams")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        const totalMRR = activeIncome
          .filter((s) => s.status === "active")
          .reduce((sum, s) => sum + (s.monthlyRevenue || 0), 0);

        const percentage = target > 0 ? Math.round((totalMRR / target) * 100) : 0;

        goals.push({
          label: line.length > 60 ? line.slice(0, 57) + "..." : line,
          current: totalMRR,
          target,
          unit: "$",
          percentage: Math.min(percentage, 100),
        });
      }
    }

    // Count ideas in pipeline as a general goal if no revenue goals found
    if (goals.length === 0) {
      const ideaCount = await ctx.db
        .query("ideas")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const sessionCount = await ctx.db
        .query("mentorshipSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      if (ideaCount.length > 0) {
        const launched = ideaCount.filter((i) => i.stage === "launched").length;
        goals.push({
          label: "Ideas in pipeline",
          current: launched,
          target: ideaCount.length,
          unit: "ideas",
          percentage: Math.round((launched / ideaCount.length) * 100),
        });
      }
      if (sessionCount.length > 0) {
        goals.push({
          label: "Mentorship sessions this month",
          current: sessionCount.length,
          target: Math.max(sessionCount.length, 4),
          unit: "sessions",
          percentage: Math.round(
            (sessionCount.length / Math.max(sessionCount.length, 4)) * 100
          ),
        });
      }
    }

    return { goals };
  },
});
