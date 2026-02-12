import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  incomeStreams: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("consulting"),
      v.literal("employment"),
      v.literal("content"),
      v.literal("product"),
      v.literal("project-based")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("developing"),
      v.literal("planned"),
      v.literal("paused")
    ),
    monthlyRevenue: v.number(),
    timeInvestment: v.number(), // hours per week
    growthRate: v.number(), // percentage
    notes: v.optional(v.string()),
    clientInfo: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_creation_time", ["createdAt"]),

  ideas: defineTable({
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
    implementationComplexity: v.number(), // 1-5
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
    createdDate: v.string(),
    lastUpdated: v.string(),
  }).index("by_stage", ["stage"])
    .index("by_category", ["category"])
    .index("by_potential_revenue", ["potentialRevenue"]),

  mentorshipSessions: defineTable({
    mentorName: v.string(),
    date: v.string(),
    duration: v.number(), // minutes
    sessionType: v.union(
      v.literal("giving"),
      v.literal("receiving")
    ),
    topics: v.array(v.string()),
    keyInsights: v.array(v.string()),
    actionItems: v.array(
      v.object({
        task: v.string(),
        priority: v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high")
        ),
        completed: v.boolean(),
        dueDate: v.optional(v.string()),
      })
    ),
    rating: v.number(), // 1-10
    notes: v.string(),
    createdAt: v.number(),
  }).index("by_date", ["date"])
    .index("by_session_type", ["sessionType"])
    .index("by_creation_time", ["createdAt"]),
});
