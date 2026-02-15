import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { getUserId } from "./lib/auth";
import { internal } from "./_generated/api";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) return [];

    return await ctx.db
      .query("taskEvents")
      .withIndex("by_user_task_created", (q) =>
        q.eq("userId", userId).eq("taskId", args.taskId)
      )
      .order("asc")
      .collect();
  },
});

export const listByTaskInternal = internalQuery({
  args: { userId: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== args.userId) return [];

    return await ctx.db
      .query("taskEvents")
      .withIndex("by_user_task_created", (q) =>
        q.eq("userId", args.userId).eq("taskId", args.taskId)
      )
      .order("asc")
      .collect();
  },
});

export const getInternal = internalQuery({
  args: { userId: v.string(), eventId: v.id("taskEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) return null;
    return event;
  },
});

export const addInternal = internalMutation({
  args: {
    userId: v.string(),
    taskId: v.id("tasks"),
    kind: v.union(
      v.literal("status"),
      v.literal("progress"),
      v.literal("tool"),
      v.literal("question"),
      v.literal("approval-request"),
      v.literal("note"),
      v.literal("result"),
      v.literal("error")
    ),
    title: v.string(),
    detail: v.optional(v.string()),
    progress: v.optional(v.number()),

    toolName: v.optional(v.string()),
    toolInput: v.optional(v.string()),
    toolOutput: v.optional(v.string()),

    options: v.optional(v.array(v.string())),
    answered: v.optional(v.boolean()),
    answer: v.optional(v.string()),

    approvalAction: v.optional(v.string()),
    approvalParams: v.optional(v.string()),
    approved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== args.userId) throw new Error("Task not found");

    const {
      userId,
      taskId,
      kind,
      title,
      detail,
      progress,
      toolName,
      toolInput,
      toolOutput,
      options,
      answered,
      answer,
      approvalAction,
      approvalParams,
      approved,
    } = args;

    return await ctx.db.insert("taskEvents", {
      userId,
      taskId,
      kind,
      title,
      detail,
      progress,
      toolName,
      toolInput,
      toolOutput,
      options,
      answered,
      answer,
      approvalAction,
      approvalParams,
      approved,
      createdAt: Date.now(),
    });
  },
});

export const answerQuestionInternal = internalMutation({
  args: {
    userId: v.string(),
    eventId: v.id("taskEvents"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) throw new Error("Not found");
    if (event.kind !== "question") throw new Error("Not a question event");

    await ctx.db.patch(args.eventId, {
      answered: true,
      answer: args.answer,
    });
  },
});

export const respondApprovalInternal = internalMutation({
  args: {
    userId: v.string(),
    eventId: v.id("taskEvents"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== args.userId) throw new Error("Not found");
    if (event.kind !== "approval-request") throw new Error("Not an approval-request event");

    await ctx.db.patch(args.eventId, {
      approved: args.approved,
    });
  },
});

export const clearForTaskInternal = internalMutation({
  args: { userId: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== args.userId) throw new Error("Task not found");

    const events = await ctx.db
      .query("taskEvents")
      .withIndex("by_user_task_created", (q) =>
        q.eq("userId", args.userId).eq("taskId", args.taskId)
      )
      .collect();
    for (const e of events) {
      await ctx.db.delete(e._id);
    }
  },
});

export const answerQuestion = mutation({
  args: {
    eventId: v.id("taskEvents"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId) throw new Error("Not found");
    if (event.kind !== "question") throw new Error("Not a question event");

    await ctx.db.patch(args.eventId, {
      answered: true,
      answer: args.answer,
    });

    await ctx.scheduler.runAfter(0, internal.ai.taskAgent.continueInternal, {
      userId,
      taskId: event.taskId,
    });
  },
});

export const respondApproval = mutation({
  args: {
    eventId: v.id("taskEvents"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId) throw new Error("Not found");
    if (event.kind !== "approval-request") throw new Error("Not an approval-request event");

    await ctx.db.patch(args.eventId, {
      approved: args.approved,
    });

    await ctx.scheduler.runAfter(0, internal.ai.taskAgent.continueInternal, {
      userId,
      taskId: event.taskId,
    });
  },
});
