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
    aiProvider: v.union(
      v.literal("openrouter"),
      v.literal("google"),
      v.literal("anthropic")
    ),
    aiModel: v.string(),
    openrouterApiKey: v.optional(v.string()),
    googleApiKey: v.optional(v.string()),
    anthropicApiKey: v.optional(v.string()),

    // Web tools (P4): search + browser read
    searchProvider: v.optional(v.union(v.literal("jina"), v.literal("tavily"), v.literal("perplexity"))),
    searchApiKey: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Soul file version history (P10.3).
  soulFileRevisions: defineTable({
    userId: v.string(),
    soulFileId: v.id("soulFiles"),
    version: v.number(),
    content: v.string(),
    source: v.union(v.literal("manual"), v.literal("ai-evolve")),
    createdAt: v.number(),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_soul_version", ["soulFileId", "version"]),

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
    provider: v.union(
      v.literal("openrouter"),
      v.literal("google"),
      v.literal("anthropic")
    ),
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

  feedback: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("bug"),
      v.literal("feature"),
      v.literal("general")
    ),
    message: v.string(),
    page: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_creation", ["createdAt"]),

  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("goal-check-in"),
      v.literal("stale-idea"),
      v.literal("overdue-action"),
      v.literal("pattern-detected"),
      v.literal("milestone"),
      v.literal("agent-task")
    ),
    title: v.string(),
    body: v.string(),
    actionUrl: v.optional(v.string()),
    read: v.boolean(),
    dismissed: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_creation", ["createdAt"]),

  tasks: defineTable({
    userId: v.string(),
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
    done: v.boolean(),
    createdAt: v.number(),
    executionType: v.optional(v.literal("draft")),
    executionPayload: v.optional(v.any()),
    lastExecutionAt: v.optional(v.number()),
    lastExecutionStatus: v.optional(
      v.union(
        v.literal("idle"),
        v.literal("queued"),
        v.literal("succeeded"),
        v.literal("failed")
      )
    ),
    lastExecutionError: v.optional(v.string()),

    // Agent work state (Deep Research-style visibility).
    agentStatus: v.optional(
      v.union(
        v.literal("idle"),
        v.literal("queued"),
        v.literal("running"),
        v.literal("succeeded"),
        v.literal("failed")
      )
    ),
    agentProgress: v.optional(v.number()), // 0-100
    agentPhase: v.optional(v.string()),
    agentPlan: v.optional(v.array(v.string())),
    agentSummary: v.optional(v.string()),
    agentResult: v.optional(v.string()), // markdown output
    agentStartedAt: v.optional(v.number()),
    agentCompletedAt: v.optional(v.number()),
    agentError: v.optional(v.string()),

    // Serialized continuation state for pause/resume (ask_user tool).
    agentState: v.optional(v.string()),
  }).index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  // Draft documents produced by the agent (P2.6).
  agentFiles: defineTable({
    userId: v.string(),
    taskId: v.optional(v.id("tasks")),
    title: v.string(),
    content: v.string(), // markdown
    fileType: v.string(), // "document" | "checklist" | "table" | "plan" | ...
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_task_updated", ["taskId", "updatedAt"]),

  taskEvents: defineTable({
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
    progress: v.optional(v.number()), // 0-100

    // Optional extensions for richer agent UI (safe to ignore in older clients).
    toolName: v.optional(v.string()),
    toolInput: v.optional(v.string()),
    toolOutput: v.optional(v.string()),

    options: v.optional(v.array(v.string())),
    answered: v.optional(v.boolean()),
    answer: v.optional(v.string()),

    approvalAction: v.optional(v.string()),
    approvalParams: v.optional(v.string()),
    approved: v.optional(v.boolean()),

    createdAt: v.number(),
  })
    .index("by_user_task_created", ["userId", "taskId", "createdAt"])
    .index("by_task_created", ["taskId", "createdAt"]),

  // Connector tokens for external services (P6).
  connectorTokens: defineTable({
    userId: v.string(),
    provider: v.union(
      v.literal("github"),
      v.literal("google-calendar"),
      v.literal("gmail")
    ),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_provider", ["userId", "provider"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  // OAuth handshake sessions (short-lived, for connector setup).
  connectorAuthSessions: defineTable({
    userId: v.string(),
    provider: v.union(
      v.literal("github"),
      v.literal("google-calendar"),
      v.literal("gmail")
    ),
    state: v.string(),
    origin: v.string(), // the app origin to postMessage back to after callback
    scopes: v.array(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_state", ["state"])
    .index("by_user_created", ["userId", "createdAt"]),

  // Proactive suggestions (P9): nudges that can be approved to create/queue agent tasks.
  proactiveSuggestions: defineTable({
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    // Suggested task payload (created when approved).
    taskTitle: v.string(),
    taskNote: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),

    // Dedupe against source objects (optional).
    sourceTaskId: v.optional(v.id("tasks")),

    createdAt: v.number(),
    dismissedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    approvedTaskId: v.optional(v.id("tasks")),
  })
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_user_sourceTask", ["userId", "sourceTaskId"]),
});
