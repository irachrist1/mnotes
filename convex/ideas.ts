import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserId } from "./lib/auth";
import { validateShortText, validateMediumText, validateArray, validateNumber } from "./lib/validate";

// Get all ideas for the current user
export const list = query({
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("ideas")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get ideas by stage for the current user
export const byStage = query({
  args: { stage: v.string() },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    return await ctx.db
      .query("ideas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("stage"), args.stage))
      .collect();
  },
});

// Create idea
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    stage: v.union(
      v.literal("raw-thought"),
      v.literal("researching"),
      v.literal("validating"),
      v.literal("developing"),
      v.literal("testing"),
      v.literal("launched")
    ),
    potentialRevenue: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("very-high")
    ),
    implementationComplexity: v.number(),
    timeToMarket: v.string(),
    requiredSkills: v.array(v.string()),
    marketSize: v.string(),
    competitionLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    aiRelevance: v.boolean(),
    hardwareComponent: v.boolean(),
    relatedIncomeStream: v.optional(v.string()),
    sourceOfInspiration: v.string(),
    nextSteps: v.array(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    validateShortText(args.title, "Title");
    validateMediumText(args.description, "Description");
    validateNumber(args.implementationComplexity, "Implementation complexity", 1, 10);
    validateArray(args.requiredSkills, "Required skills");
    validateArray(args.nextSteps, "Next steps");
    validateArray(args.tags, "Tags");
    const now = new Date().toISOString();
    return await ctx.db.insert("ideas", {
      ...args,
      userId,
      createdDate: now,
      lastUpdated: now,
    });
  },
});

// Update idea
export const update = mutation({
  args: {
    id: v.id("ideas"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    stage: v.optional(
      v.union(
        v.literal("raw-thought"),
        v.literal("researching"),
        v.literal("validating"),
        v.literal("developing"),
        v.literal("testing"),
        v.literal("launched")
      )
    ),
    potentialRevenue: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("very-high")
      )
    ),
    implementationComplexity: v.optional(v.number()),
    timeToMarket: v.optional(v.string()),
    requiredSkills: v.optional(v.array(v.string())),
    marketSize: v.optional(v.string()),
    competitionLevel: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high")
      )
    ),
    aiRelevance: v.optional(v.boolean()),
    hardwareComponent: v.optional(v.boolean()),
    relatedIncomeStream: v.optional(v.string()),
    sourceOfInspiration: v.optional(v.string()),
    nextSteps: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const { id, ...updates } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Idea not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(id, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
  },
});

// Delete idea
export const remove = mutation({
  args: { id: v.id("ideas") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Idea not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
