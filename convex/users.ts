import { mutation, query } from "./_generated/server";
import { getUserId, getUserIdentity } from "./lib/auth";

// Get current user profile from Convex Auth identity
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return null;

    return {
      name: identity.name || undefined,
      email: identity.email || undefined,
      avatarUrl: identity.pictureUrl || undefined,
    };
  },
});

// One-time migration helper: reassign legacy local-dev records
// (stored under userId = "default") to the current authenticated user.
export const claimLegacyData = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getUserId(ctx);
    if (currentUserId === "default") {
      return { skipped: true, reason: "not_authenticated" as const };
    }

    const legacyUserId = "default";
    let moved = 0;

    const moveTable = async (
      table:
        | "incomeStreams"
        | "ideas"
        | "mentorshipSessions"
        | "aiInsights"
    ) => {
      const docs = await ctx.db
        .query(table)
        .withIndex("by_user", (q) => q.eq("userId", legacyUserId))
        .collect();
      for (const doc of docs) {
        await ctx.db.patch(doc._id, { userId: currentUserId });
        moved++;
      }
    };

    await moveTable("incomeStreams");
    await moveTable("ideas");
    await moveTable("mentorshipSessions");
    await moveTable("aiInsights");

    // userSettings has required userId and can block settings from appearing.
    const legacySettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", legacyUserId))
      .first();
    if (legacySettings) {
      const existing = await ctx.db
        .query("userSettings")
        .withIndex("by_user", (q) => q.eq("userId", currentUserId))
        .first();
      if (!existing) {
        await ctx.db.patch(legacySettings._id, { userId: currentUserId });
        moved++;
      }
    }

    return { moved, targetUserId: currentUserId };
  },
});
