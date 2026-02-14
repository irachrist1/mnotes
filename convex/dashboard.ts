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
