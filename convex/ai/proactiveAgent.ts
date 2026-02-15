"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Proactive agent loop (P9) - minimal initial version.
 *
 * This does NOT run the agent automatically. It creates suggestions the user can approve
 * to create/queue real tasks.
 */
export const runAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.soulFile.listAllUserIds);
    for (const { userId } of users) {
      await ctx.scheduler.runAfter(0, internal.ai.proactiveAgent.generateForUser, { userId });
    }
  },
});

export const generateForUser = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Pick candidate tasks that are undone and haven't been run successfully.
    const tasks = await ctx.runQuery(internal.tasks.listForUserInternal, {
      userId: args.userId,
      limit: 40,
      includeDone: false,
    });

    const candidates = (tasks as any[]).filter((t) => {
      if (t.done) return false;
      const status = String(t.agentStatus ?? "idle");
      if (status === "queued" || status === "running") return false;
      // If succeeded and has output, don't suggest rerun by default.
      if (status === "succeeded" && typeof t.agentResult === "string" && t.agentResult.trim()) return false;
      return true;
    });

    // Prefer high priority, then oldest.
    const scorePriority = (p: string) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
    candidates.sort((a, b) => {
      const pa = scorePriority(String(a.priority ?? "medium"));
      const pb = scorePriority(String(b.priority ?? "medium"));
      if (pb !== pa) return pb - pa;
      return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    });

    const top = candidates.slice(0, 2);
    for (const t of top) {
      const title = `Want me to run Jarvis on: ${t.title}`;
      const body = "I can break this down into steps, pull relevant context from your notes, and produce a usable deliverable.";
      await ctx.runMutation(internal.proactiveSuggestions.createForTaskInternal, {
        userId: args.userId,
        sourceTaskId: t._id,
        title,
        body,
        taskTitle: t.title,
        taskNote: t.note,
        priority: t.priority ?? "medium",
      });
    }
  },
});

