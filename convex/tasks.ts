import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserId } from "./lib/auth";
import { validateShortText } from "./lib/validate";

/** List all tasks for the current user, newest first. */
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        return await ctx.db
            .query("tasks")
            .withIndex("by_user_created", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});

/** Count undone tasks for the current user (used for badges/nudges). */
export const countUndone = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getUserId(ctx);
        const all = await ctx.db
            .query("tasks")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
        return all.filter((t) => !t.done).length;
    },
});

/** Create a new task. */
export const create = mutation({
    args: {
        title: v.string(),
        note: v.optional(v.string()),
        sourceType: v.union(
            v.literal("manual"),
            v.literal("ai-insight"),
            v.literal("chat")
        ),
        sourceId: v.optional(v.string()),
        dueDate: v.optional(v.string()),
        priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        validateShortText(args.title, "Title");
        return await ctx.db.insert("tasks", {
            userId,
            title: args.title,
            note: args.note,
            sourceType: args.sourceType,
            sourceId: args.sourceId,
            dueDate: args.dueDate,
            priority: args.priority,
            done: false,
            createdAt: Date.now(),
        });
    },
});

/** Update a task's editable fields. */
export const update = mutation({
    args: {
        id: v.id("tasks"),
        title: v.optional(v.string()),
        note: v.optional(v.string()),
        dueDate: v.optional(v.string()),
        priority: v.optional(
            v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Task not found");
        if (existing.userId !== userId) throw new Error("Unauthorized");
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

/** Toggle a task's done state. */
export const toggleDone = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Task not found");
        if (existing.userId !== userId) throw new Error("Unauthorized");
        await ctx.db.patch(args.id, { done: !existing.done });
    },
});

/** Delete a task. */
export const remove = mutation({
    args: { id: v.id("tasks") },
    handler: async (ctx, args) => {
        const userId = await getUserId(ctx);
        const existing = await ctx.db.get(args.id);
        if (!existing) throw new Error("Task not found");
        if (existing.userId !== userId) throw new Error("Unauthorized");
        await ctx.db.delete(args.id);
    },
});
