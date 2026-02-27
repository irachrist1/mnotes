import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

/**
 * Run all scheduled agent tasks that are due.
 * Called by cron every hour.
 */
export const runDueTasks = internalAction({
  args: {},
  handler: async (ctx) => {
    const nowMs = Date.now();
    const dueTasks = await ctx.runQuery(api.scheduledTasks.listDueInternal, { nowMs });

    for (const task of dueTasks) {
      try {
        await ctx.runAction(internal.proactive.runTaskForUser, {
          taskId: task._id,
          userId: task.userId,
          prompt: task.prompt,
          connectors: task.connectors,
          taskName: task.name,
        });
      } catch (err) {
        console.error(`Failed to run scheduled task ${task.name} for user ${task.userId}:`, err);
      }
    }
  },
});

export const runTaskForUser = internalAction({
  args: {
    taskId: v.id("scheduledAgentTasks"),
    userId: v.string(),
    prompt: v.string(),
    connectors: v.array(v.string()),
    taskName: v.string(),
  },
  handler: async (ctx, args) => {
    const agentServerUrl = process.env.AGENT_SERVER_URL ?? "http://localhost:3001";
    const agentServerSecret = process.env.AGENT_SERVER_SECRET ?? "";

    // Get user's settings for API keys + preferences
    const settings = await ctx.runQuery(api.settings.getRaw, { userId: args.userId });

    // Get soul file + memories for context
    const soulFile = await ctx.runQuery(api.memory.getSoulFile, {});
    const memories = await ctx.runQuery(api.memory.listByTier, { tier: "persistent", limit: 30 });

    const body = {
      userId: args.userId,
      threadId: `scheduled-${args.taskId}-${Date.now()}`,
      message: args.prompt,
      connectors: args.connectors,
      soulFile: (soulFile as { content: string } | null)?.content ?? "",
      memories: (memories as Array<{ _id: string; tier: string; category: string; title: string; content: string; importance: number }>).map((m) => ({
        id: m._id,
        tier: m.tier,
        category: m.category,
        title: m.title,
        content: m.content,
        importance: m.importance,
      })),
      aiProvider: (settings as { aiProvider?: string } | null)?.aiProvider ?? "anthropic",
      aiModel: (settings as { aiModel?: string } | null)?.aiModel ?? "claude-sonnet-4-5-20250929",
      anthropicApiKey: (settings as { anthropicApiKey?: string } | null)?.anthropicApiKey,
      googleApiKey: (settings as { googleApiKey?: string } | null)?.googleApiKey,
    };

    const res = await fetch(`${agentServerUrl}/api/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agentServerSecret ? { Authorization: `Bearer ${agentServerSecret}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Agent task failed: ${res.status}`);
    }

    const result = await res.json() as { success: boolean; response: string; error?: string };
    if (!result.success) {
      throw new Error(`Agent task error: ${result.error}`);
    }

    // Save notification
    await ctx.runMutation(api.notifications.createInternal, {
      userId: args.userId,
      title: args.taskName,
      body: result.response,
      type: "briefing",
      source: args.connectors[0],
    });

    // Update task timing (schedule next run in 24 hours for daily tasks)
    const now = Date.now();
    await ctx.runMutation(api.scheduledTasks.updateLastRunInternal, {
      id: args.taskId,
      lastRunAt: now,
      nextRunAt: now + 24 * 60 * 60 * 1000, // simple: 24h from now
    });
  },
});
