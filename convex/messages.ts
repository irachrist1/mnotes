import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

// ─── Thread queries ───────────────────────────────────────────────────────────

export const listThreads = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 30 }) => {
    const userId = await getUserId(ctx);
    return ctx.db
      .query("chatThreads")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getThread = query({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, { threadId }) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) return null;
    return thread;
  },
});

// ─── Message queries ──────────────────────────────────────────────────────────

export const listMessages = query({
  args: { threadId: v.id("chatThreads"), limit: v.optional(v.number()) },
  handler: async (ctx, { threadId, limit = 100 }) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) return [];
    return ctx.db
      .query("chatMessages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", threadId))
      .order("asc")
      .take(limit);
  },
});

// ─── Thread mutations ─────────────────────────────────────────────────────────

export const createThread = mutation({
  args: {
    title: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { title, model }) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    return ctx.db.insert("chatThreads", {
      userId,
      title: title.slice(0, 80),
      model,
      createdAt: now,
      lastMessageAt: now,
    });
  },
});

export const updateThreadSession = mutation({
  args: {
    threadId: v.id("chatThreads"),
    agentSessionId: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, { threadId, agentSessionId, model }) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) return;
    await ctx.db.patch(threadId, { agentSessionId, ...(model ? { model } : {}) });
  },
});

export const updateThreadTitle = mutation({
  args: { threadId: v.id("chatThreads"), title: v.string() },
  handler: async (ctx, { threadId, title }) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) return;
    await ctx.db.patch(threadId, { title: title.slice(0, 80) });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.id("chatThreads") },
  handler: async (ctx, { threadId }) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) return;
    // Delete all messages first
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", threadId))
      .collect();
    for (const msg of messages) await ctx.db.delete(msg._id);
    await ctx.db.delete(threadId);
  },
});

// ─── Message mutations ────────────────────────────────────────────────────────

export const addUserMessage = mutation({
  args: {
    threadId: v.id("chatThreads"),
    content: v.string(),
  },
  handler: async (ctx, { threadId, content }) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) throw new Error("Thread not found");
    const now = Date.now();
    const messageId = await ctx.db.insert("chatMessages", {
      userId,
      threadId,
      role: "user",
      content,
      createdAt: now,
    });
    await ctx.db.patch(threadId, { lastMessageAt: now });
    return messageId;
  },
});

export const addAssistantMessage = mutation({
  args: {
    threadId: v.id("chatThreads"),
    content: v.string(),
  },
  handler: async (ctx, { threadId, content }) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) throw new Error("Thread not found");
    const now = Date.now();
    const messageId = await ctx.db.insert("chatMessages", {
      userId,
      threadId,
      role: "assistant",
      content,
      createdAt: now,
    });
    await ctx.db.patch(threadId, { lastMessageAt: now });
    return messageId;
  },
});

export const addToolMessage = mutation({
  args: {
    threadId: v.id("chatThreads"),
    toolName: v.string(),
    toolInput: v.optional(v.string()),
    toolOutput: v.optional(v.string()),
    toolStatus: v.union(v.literal("running"), v.literal("done"), v.literal("error")),
  },
  handler: async (ctx, { threadId, toolName, toolInput, toolOutput, toolStatus }) => {
    const userId = await getUserId(ctx);
    const thread = await ctx.db.get(threadId);
    if (!thread || thread.userId !== userId) throw new Error("Thread not found");
    return ctx.db.insert("chatMessages", {
      userId,
      threadId,
      role: "tool",
      content: toolOutput ?? "",
      toolName,
      toolInput,
      toolOutput,
      toolStatus,
      createdAt: Date.now(),
    });
  },
});

export const patchMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    content: v.optional(v.string()),
    toolOutput: v.optional(v.string()),
    toolStatus: v.optional(v.union(v.literal("running"), v.literal("done"), v.literal("error"))),
  },
  handler: async (ctx, { messageId, ...patch }) => {
    const userId = await getUserId(ctx);
    const msg = await ctx.db.get(messageId);
    if (!msg || msg.userId !== userId) return;
    await ctx.db.patch(messageId, patch);
  },
});
