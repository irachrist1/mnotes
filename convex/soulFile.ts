import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getUserId } from "./lib/auth";

const DEFAULT_SOUL_TEMPLATE = `# Soul File

## Identity
Name: 
Role: 
Focus: 

## Goals
- 

## Patterns
(MNotes will learn your patterns over time)

## Notes
(MNotes will add notes here as it learns about you)
`;

/**
 * Get the current user's soul file, or null if not yet created.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

/**
 * Initialize a soul file from onboarding data.
 * Generates the initial markdown content from user-provided info.
 */
export const initialize = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    focus: v.string(),
    goals: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    // Check if already exists
    const existing = await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("Soul file already exists. Use evolve to update.");
    }

    const goalsMarkdown = args.goals
      .filter((g) => g.trim().length > 0)
      .map((g) => `- ${g}`)
      .join("\n");

    const content = `# Soul File

## Identity
Name: ${args.name}
Role: ${args.role}
Focus: ${args.focus}

## Goals
${goalsMarkdown || "- (none set yet)"}

## Patterns
(MNotes will learn your patterns over time)

## Notes
(MNotes will add notes here as it learns about you)
`;

    return await ctx.db.insert("soulFiles", {
      userId,
      content,
      version: 1,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Initialize a soul file from AI-generated markdown (conversational onboarding).
 * The AI generates the full markdown content from the onboarding conversation.
 */
export const initializeFromMarkdown = mutation({
  args: {
    content: v.string(),
    assistantName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);

    const existing = await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      throw new Error("Soul file already exists. Use evolve to update.");
    }

    // If an assistant name was chosen, prepend it to the soul file
    let content = args.content;
    if (args.assistantName && !content.includes("Assistant Name:")) {
      content = content.replace(
        "# Soul File",
        `# Soul File\n\nAssistant Name: ${args.assistantName}`
      );
    }

    return await ctx.db.insert("soulFiles", {
      userId,
      content,
      version: 1,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Evolve the soul file — replace entire content with AI-updated version.
 * The AI reads the old content, merges new info, and writes back.
 */
export const evolve = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existing) {
      // Auto-create if doesn't exist (e.g., from chat before onboarding)
      return await ctx.db.insert("soulFiles", {
        userId,
        content: args.content,
        version: 1,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(existing._id, {
      content: args.content,
      version: existing.version + 1,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

// ---------------------------------------------------------------------------
// Internal helpers — called from scheduled actions (no auth context)
// ---------------------------------------------------------------------------

/**
 * Get a soul file by userId directly (for use in scheduled actions).
 */
export const getByUserId = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

/**
 * Update soul file content from an internal action (no ctx.auth required).
 * Used by scheduled soul file evolution.
 */
export const evolveInternal = internalMutation({
  args: {
    userId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("soulFiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) {
      return await ctx.db.insert("soulFiles", {
        userId: args.userId,
        content: args.content,
        version: 1,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(existing._id, {
      content: args.content,
      version: existing.version + 1,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

/**
 * List all userIds that have a soul file (completed onboarding).
 * Used by the weekly digest cron to find eligible users.
 */
export const listAllUserIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("soulFiles").collect();
    return all.map((sf) => ({ userId: sf.userId }));
  },
});
