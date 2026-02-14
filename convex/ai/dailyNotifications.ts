"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Daily notification pipeline.
 * `runAll` is triggered by a daily cron and fans out to `generateForUser`
 * for each user with a soul file.
 */
export const runAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.soulFile.listAllUserIds);
    for (const { userId } of users) {
      await ctx.scheduler.runAfter(0, internal.ai.dailyNotifications.generateForUser, {
        userId,
      });
    }
  },
});

export const generateForUser = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const [domainData, recentNotifications] = await Promise.all([
      ctx.runQuery(internal.chat.getDomainSummaryInput, {
        userId: args.userId,
        sampleLimit: 80,
      }),
      ctx.runQuery(internal.notifications.listRecentInternal, {
        userId: args.userId,
      }),
    ]);

    const now = Date.now();
    const recentTitles = new Set(recentNotifications.map((n: { title: string }) => n.title));

    // Rule 1: Stale ideas — ideas not updated in 14+ days
    for (const idea of domainData.ideas) {
      const lastUpdated = idea.lastUpdated
        ? new Date(idea.lastUpdated).getTime()
        : 0;
      if (lastUpdated > 0 && now - lastUpdated > FOURTEEN_DAYS_MS) {
        const title = `"${idea.title}" hasn't moved in 2 weeks`;
        if (recentTitles.has(title)) continue;
        await ctx.runMutation(internal.notifications.createInternal, {
          userId: args.userId,
          type: "stale-idea",
          title,
          body: `Your idea "${idea.title}" has been in the "${idea.stage}" stage for over 14 days. Consider moving it forward or archiving it.`,
          actionUrl: "/dashboard/data?tab=ideas",
        });
        recentTitles.add(title);
      }
    }

    // Rule 2: Overdue mentorship action items
    for (const session of domainData.sessions) {
      const actionItems = session.actionItems;
      if (!actionItems || !Array.isArray(actionItems)) continue;
      for (const item of actionItems) {
        if (item.completed) continue;
        if (!item.dueDate) continue;
        const due = new Date(item.dueDate).getTime();
        if (due < now) {
          const title = `Overdue: "${item.task}"`;
          if (recentTitles.has(title)) continue;
          await ctx.runMutation(internal.notifications.createInternal, {
            userId: args.userId,
            type: "overdue-action",
            title,
            body: `Action item from your session with ${session.mentorName} was due ${item.dueDate}. Mark it complete or reschedule.`,
            actionUrl: "/dashboard/data?tab=mentorship",
          });
          recentTitles.add(title);
        }
      }
    }

    // Rule 3: Revenue milestones
    const totalRevenue = domainData.incomeStreams.reduce(
      (sum: number, s: { monthlyRevenue: number }) => sum + s.monthlyRevenue,
      0
    );
    const milestones = [1000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 50000];
    for (const milestone of milestones) {
      if (totalRevenue >= milestone) {
        const title = `You've crossed $${(milestone / 1000).toFixed(milestone >= 1000 && milestone % 1000 === 0 ? 0 : 1)}k/mo!`;
        if (recentTitles.has(title)) continue;
        // Only notify for the highest milestone crossed
        const higher = milestones.find((m) => m > milestone && totalRevenue >= m);
        if (higher) continue;
        await ctx.runMutation(internal.notifications.createInternal, {
          userId: args.userId,
          type: "milestone",
          title,
          body: `Your total monthly revenue is now $${totalRevenue.toLocaleString()}/mo. Keep pushing!`,
          actionUrl: "/dashboard/data?tab=income",
        });
        recentTitles.add(title);
        break;
      }
    }

    // Rule 4: No activity in 7 days (pattern detection)
    const hasRecentSession = domainData.sessions.some((s: { date: string }) => {
      const d = new Date(s.date).getTime();
      return now - d < SEVEN_DAYS_MS;
    });
    if (domainData.sessions.length > 0 && !hasRecentSession) {
      const title = "No mentorship sessions this week";
      if (!recentTitles.has(title)) {
        await ctx.runMutation(internal.notifications.createInternal, {
          userId: args.userId,
          type: "pattern-detected",
          title,
          body: "You haven't logged a mentorship session in over a week. Staying connected with mentors accelerates growth.",
          actionUrl: "/dashboard/data?tab=mentorship",
        });
      }
    }

    console.log(`[NOTIFICATIONS] generated for userId=${args.userId}`);
  },
});
