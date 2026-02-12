import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";

// ---------------------------------------------------------------------------
// Thread queries / mutations
// ---------------------------------------------------------------------------

/**
 * List chat threads for the current user, newest first.
 */
export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("chatThreads")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);
  },
});

/**
 * Create a new chat thread. Returns the new thread ID.
 */
export const createThread = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    const threadId = await ctx.db.insert("chatThreads", {
      userId,
      title: "New chat",
      createdAt: now,
      lastMessageAt: now,
    });
    return { threadId };
  },
});

/**
 * Delete a thread and all its messages.
 */
export const deleteThread = mutation({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(args.threadId);
    if (!thread || thread.userId !== userId) throw new Error("Thread not found");

    // Delete all messages in this thread
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
      .collect();
    await Promise.all(messages.map((m) => ctx.db.delete(m._id)));

    await ctx.db.delete(args.threadId);
  },
});

// ---------------------------------------------------------------------------
// Message queries
// ---------------------------------------------------------------------------

/**
 * Get recent chat messages for a given thread (or legacy user-scoped fallback).
 */
export const listMessages = query({
  args: {
    threadId: v.optional(v.id("chatThreads")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const limit = args.limit ?? 50;

    if (args.threadId) {
      // Verify thread belongs to user
      const thread = await ctx.db.get(args.threadId);
      if (!thread || thread.userId !== userId) return [];

      const messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
        .order("desc")
        .take(limit);
      return messages.reverse();
    }

    // Fallback: legacy user-scoped query (for messages without a threadId)
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    return messages.reverse();
  },
});

// ---------------------------------------------------------------------------
// Internal helpers — used by actions and scheduled jobs
// ---------------------------------------------------------------------------

/**
 * Count user messages in a thread. Used to decide when to trigger soul file evolution.
 */
export const countUserMessages = internalQuery({
  args: {
    userId: v.string(),
    threadId: v.optional(v.id("chatThreads")),
  },
  handler: async (ctx, args) => {
    if (args.threadId) {
      const msgs = await ctx.db
        .query("chatMessages")
        .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
        .collect();
      return msgs.filter((m) => m.role === "user").length;
    }
    const msgs = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .collect();
    return msgs.filter((m) => m.role === "user").length;
  },
});

/**
 * List recent messages by userId/threadId — callable from scheduled actions.
 */
export const listMessagesForUser = internalQuery({
  args: {
    userId: v.string(),
    threadId: v.optional(v.id("chatThreads")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    if (args.threadId) {
      const messages = await ctx.db
        .query("chatMessages")
        .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
        .order("desc")
        .take(limit);
      return messages.reverse();
    }

    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
    return messages.reverse();
  },
});

/**
 * Compact, prompt-ready business context for chat.
 * Returns only the fields needed by buildDomainSummary and caps row counts.
 */
export const getDomainSummaryInput = internalQuery({
  args: {
    userId: v.string(),
    sampleLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleLimit = Math.max(10, Math.min(args.sampleLimit ?? 60, 200));

    const [incomeStreams, ideas, sessions] = await Promise.all([
      ctx.db
        .query("incomeStreams")
        .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(sampleLimit),
      ctx.db
        .query("ideas")
        .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(sampleLimit),
      ctx.db
        .query("mentorshipSessions")
        .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(sampleLimit),
    ]);

    return {
      incomeStreams: incomeStreams.map((stream) => ({
        name: stream.name,
        category: stream.category,
        status: stream.status,
        monthlyRevenue: stream.monthlyRevenue,
      })),
      ideas: ideas.map((idea) => ({
        title: idea.title,
        stage: idea.stage,
        category: idea.category,
      })),
      sessions: sessions.map((session) => ({
        mentorName: session.mentorName,
        date: session.date,
        rating: session.rating,
      })),
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Save a message to the chat history. Internal only (called from actions).
 */
export const saveMessage = internalMutation({
  args: {
    userId: v.string(),
    threadId: v.optional(v.id("chatThreads")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    intent: v.optional(v.object({
      table: v.string(),
      operation: v.union(v.literal("create"), v.literal("update"), v.literal("query")),
      data: v.optional(v.any()),
    })),
    intentStatus: v.optional(v.union(
      v.literal("proposed"),
      v.literal("confirmed"),
      v.literal("rejected"),
      v.literal("committed")
    )),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chatMessages", {
      userId: args.userId,
      threadId: args.threadId,
      role: args.role,
      content: args.content,
      intent: args.intent,
      intentStatus: args.intentStatus,
      createdAt: Date.now(),
    });

    // Update thread timestamp + set title from first user message
    if (args.threadId && args.role === "user") {
      const thread = await ctx.db.get(args.threadId);
      if (thread) {
        const patch: { lastMessageAt: number; title?: string } = {
          lastMessageAt: Date.now(),
        };
        if (thread.title === "New chat") {
          patch.title = args.content.slice(0, 50);
        }
        await ctx.db.patch(args.threadId, patch);
      }
    }

    return messageId as string;
  },
});

/**
 * Commit a confirmed intent — write to the target domain table.
 * This is called when the user clicks "Confirm" on a proposed intent.
 */
export const commitIntent = mutation({
  args: {
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) throw new Error("Message not found");
    if (message.userId !== userId) throw new Error("Unauthorized");
    if (!message.intent) throw new Error("No intent on this message");
    if (message.intentStatus === "committed") throw new Error("Intent already committed");

    const { table, operation, data } = message.intent as {
      table: string;
      operation: string;
      data?: Record<string, unknown>;
    };

    if (operation !== "create" || !data) {
      throw new Error("Only create operations are supported in v1");
    }

    const now = Date.now();
    let recordId: string;

    if (table === "incomeStreams") {
      recordId = await ctx.db.insert("incomeStreams", {
        userId,
        name: String(data.name ?? ""),
        category: data.category as "consulting" | "employment" | "content" | "product" | "project-based",
        status: data.status as "active" | "developing" | "planned" | "paused",
        monthlyRevenue: Number(data.monthlyRevenue ?? 0),
        timeInvestment: Number(data.timeInvestment ?? 0),
        growthRate: Number(data.growthRate ?? 0),
        notes: data.notes ? String(data.notes) : undefined,
        clientInfo: data.clientInfo ? String(data.clientInfo) : undefined,
        createdAt: now,
        updatedAt: now,
      });
    } else if (table === "ideas") {
      const isoNow = new Date().toISOString();
      recordId = await ctx.db.insert("ideas", {
        userId,
        title: String(data.title ?? ""),
        description: String(data.description ?? ""),
        category: String(data.category ?? ""),
        stage: (data.stage as "raw-thought" | "researching" | "validating" | "developing" | "testing" | "launched") ?? "raw-thought",
        potentialRevenue: (data.potentialRevenue as "low" | "medium" | "high" | "very-high") ?? "medium",
        implementationComplexity: Number(data.implementationComplexity ?? 5),
        timeToMarket: String(data.timeToMarket ?? ""),
        requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills.map(String) : [],
        marketSize: String(data.marketSize ?? ""),
        competitionLevel: (data.competitionLevel as "low" | "medium" | "high") ?? "medium",
        aiRelevance: Boolean(data.aiRelevance ?? false),
        hardwareComponent: Boolean(data.hardwareComponent ?? false),
        relatedIncomeStream: data.relatedIncomeStream ? String(data.relatedIncomeStream) : undefined,
        sourceOfInspiration: String(data.sourceOfInspiration ?? "chat"),
        nextSteps: Array.isArray(data.nextSteps) ? data.nextSteps.map(String) : [],
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        createdDate: isoNow,
        lastUpdated: isoNow,
      });
    } else if (table === "mentorshipSessions") {
      recordId = await ctx.db.insert("mentorshipSessions", {
        userId,
        mentorName: String(data.mentorName ?? ""),
        date: String(data.date ?? new Date().toISOString().split("T")[0]),
        duration: Number(data.duration ?? 60),
        sessionType: (data.sessionType as "giving" | "receiving") ?? "receiving",
        topics: Array.isArray(data.topics) ? data.topics.map(String) : [],
        keyInsights: Array.isArray(data.keyInsights) ? data.keyInsights.map(String) : [],
        actionItems: Array.isArray(data.actionItems)
          ? data.actionItems.map((item: Record<string, unknown>) => ({
              task: String(item.task ?? ""),
              priority: (item.priority as "low" | "medium" | "high") ?? "medium",
              completed: Boolean(item.completed ?? false),
              dueDate: item.dueDate ? String(item.dueDate) : undefined,
            }))
          : [],
        rating: Number(data.rating ?? 7),
        notes: String(data.notes ?? ""),
        createdAt: now,
      });
    } else {
      throw new Error(`Unknown table: ${table}`);
    }

    await ctx.db.patch(args.messageId, { intentStatus: "committed" });

    return { table, recordId };
  },
});

/**
 * Reject a proposed intent.
 */
export const rejectIntent = mutation({
  args: {
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const message = await ctx.db.get(args.messageId);

    if (!message) throw new Error("Message not found");
    if (message.userId !== userId) throw new Error("Unauthorized");
    if (!message.intent) throw new Error("No intent on this message");

    await ctx.db.patch(args.messageId, { intentStatus: "rejected" });
  },
});
