import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  incomeStreams: defineTable({
    userId: v.optional(v.string()),
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
  }).index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_created_at", ["createdAt"]),

  ideas: defineTable({
    userId: v.optional(v.string()),
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
    createdDate: v.string(),
    lastUpdated: v.string(),
  }).index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdDate"])
    .index("by_stage", ["stage"])
    .index("by_category", ["category"])
    .index("by_potential_revenue", ["potentialRevenue"]),

  mentorshipSessions: defineTable({
    userId: v.optional(v.string()),
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
  }).index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_date", ["date"])
    .index("by_session_type", ["sessionType"])
    .index("by_created_at", ["createdAt"]),

  userSettings: defineTable({
    userId: v.string(),
    aiProvider: v.union(v.literal("openrouter"), v.literal("google")),
    aiModel: v.string(),
    openrouterApiKey: v.optional(v.string()),
    googleApiKey: v.optional(v.string()),
    agentServerUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  aiInsights: defineTable({
    userId: v.string(),
    type: v.string(), // "revenue" | "idea" | "mentorship" | "general"
    title: v.string(),
    body: v.string(),
    actionItems: v.array(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    confidence: v.number(),
    model: v.string(),
    status: v.union(v.literal("unread"), v.literal("read"), v.literal("dismissed")),
    contentHash: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_hash", ["userId", "contentHash"])
    .index("by_user_expires", ["userId", "expiresAt"])
    .index("by_status", ["status"])
    .index("by_creation", ["createdAt"]),

  aiPromptCache: defineTable({
    userId: v.string(),
    scope: v.union(v.literal("chat"), v.literal("insight")),
    cacheKey: v.string(),
    provider: v.union(v.literal("openrouter"), v.literal("google")),
    model: v.string(),
    responseText: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_user_scope_key", ["userId", "scope", "cacheKey"])
    .index("by_user_expires", ["userId", "expiresAt"]),

  savedInsights: defineTable({
    userId: v.string(),
    sourceInsightId: v.id("aiInsights"),
    contentHash: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    bodySummary: v.string(),
    actionItems: v.array(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    confidence: v.number(),
    model: v.string(),
    keywords: v.array(v.string()),
    searchText: v.string(),
    embedding: v.optional(v.array(v.float64())),
    embeddingModel: v.optional(v.string()),
    embeddingVersion: v.optional(v.string()),
    pinned: v.boolean(),
    archived: v.boolean(),
    generatedAt: v.number(),
    savedAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    usedCount: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_savedAt", ["userId", "savedAt"])
    .index("by_user_hash", ["userId", "contentHash"])
    .index("by_user_archived_savedAt", ["userId", "archived", "savedAt"])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["userId", "archived", "type", "priority", "pinned"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId", "archived"],
    }),

  soulFiles: defineTable({
    userId: v.string(),
    content: v.string(), // markdown — AI-managed, flexible
    version: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  chatThreads: defineTable({
    userId: v.string(),
    title: v.string(),       // auto-set from first user message (truncated 50 chars)
    createdAt: v.number(),
    lastMessageAt: v.number(),
    agentSessionId: v.optional(v.string()),
  }).index("by_user_updated", ["userId", "lastMessageAt"]),

  chatMessages: defineTable({
    userId: v.string(),
    threadId: v.optional(v.id("chatThreads")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    intent: v.optional(v.object({
      table: v.string(),
      operation: v.union(
        v.literal("create"),
        v.literal("update"),
        v.literal("query")
      ),
      data: v.optional(v.any()),
    })),
    intentStatus: v.optional(v.union(
      v.literal("proposed"),
      v.literal("confirmed"),
      v.literal("rejected"),
      v.literal("committed")
    )),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_thread_created", ["threadId", "createdAt"]),
});
