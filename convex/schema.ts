import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // ─── User Settings ────────────────────────────────────────────────────────
  // Stores API keys and agent server configuration per user.
  userSettings: defineTable({
    userId: v.string(),
    // AI provider for the agent server to use
    aiProvider: v.union(
      v.literal("anthropic"), // API key or Claude subscription (local)
      v.literal("google"),    // Gemini Flash
      v.literal("openrouter") // Multi-model via OpenRouter
    ),
    aiModel: v.string(),
    anthropicApiKey: v.optional(v.string()),
    googleApiKey: v.optional(v.string()),
    openrouterApiKey: v.optional(v.string()),
    // URL of the agent server (local or VPS)
    agentServerUrl: v.optional(v.string()),
    // Shared secret for authenticating Next.js → agent server calls
    agentServerSecret: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ─── Jarvis Soul File ─────────────────────────────────────────────────────
  // Markdown document that is the agent's long-term memory of the user.
  // The agent reads this at the start of every session.
  soulFiles: defineTable({
    userId: v.string(),
    content: v.string(), // markdown
    version: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ─── Chat Threads ─────────────────────────────────────────────────────────
  chatThreads: defineTable({
    userId: v.string(),
    title: v.string(), // auto-generated from first message
    agentSessionId: v.optional(v.string()), // Agent SDK session ID for resume
    model: v.optional(v.string()), // model used in this thread
    createdAt: v.number(),
    lastMessageAt: v.number(),
  }).index("by_user_updated", ["userId", "lastMessageAt"]),

  // ─── Chat Messages ────────────────────────────────────────────────────────
  chatMessages: defineTable({
    userId: v.string(),
    threadId: v.optional(v.id("chatThreads")),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("tool")),
    content: v.string(),
    // Legacy compatibility: older chat messages may include intent metadata.
    intent: v.optional(
      v.object({
        table: v.string(),
        operation: v.string(),
        data: v.optional(v.any()),
      })
    ),
    intentStatus: v.optional(v.string()),
    // For tool messages: which tool was called and what happened
    toolName: v.optional(v.string()),
    toolInput: v.optional(v.string()),
    toolOutput: v.optional(v.string()),
    toolStatus: v.optional(v.union(
      v.literal("running"),
      v.literal("done"),
      v.literal("error")
    )),
    createdAt: v.number(),
  }).index("by_thread_created", ["threadId", "createdAt"])
    .index("by_user", ["userId"]),

  // ─── Memory Entries ───────────────────────────────────────────────────────
  // Three-tier memory system (like the video):
  //   persistent: important facts about the user (always loaded)
  //   archival:   heavy reference material (loaded on demand)
  //   session:    within-conversation context (ephemeral)
  memoryEntries: defineTable({
    userId: v.string(),
    tier: v.union(
      v.literal("persistent"), // always in context
      v.literal("archival"),   // load on demand
      v.literal("session")     // ephemeral, per-conversation
    ),
    category: v.string(), // e.g. "preference", "fact", "project", "correction"
    title: v.string(),
    content: v.string(),
    importance: v.number(), // 1-10, higher = more important
    source: v.union(v.literal("user"), v.literal("agent")),
    archived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_tier_updated", ["userId", "tier", "updatedAt"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["userId", "archived", "tier", "category"],
    }),

  // ─── Connector Tokens ─────────────────────────────────────────────────────
  // OAuth tokens for external service integrations.
  connectorTokens: defineTable({
    userId: v.string(),
    provider: v.union(
      v.literal("github"),
      v.literal("gmail"),
      v.literal("google-calendar"),
      v.literal("outlook"),        // Microsoft Graph
      v.literal("microsoft-teams") // Future
    ),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    expiresAt: v.optional(v.number()),
    lastUsedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_provider", ["userId", "provider"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  // ─── OAuth Handshake Sessions ─────────────────────────────────────────────
  connectorAuthSessions: defineTable({
    userId: v.string(),
    provider: v.union(
      v.literal("github"),
      v.literal("gmail"),
      v.literal("google-calendar"),
      v.literal("outlook"),
      v.literal("microsoft-teams")
    ),
    state: v.string(),
    origin: v.string(),
    scopes: v.array(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_state", ["state"])
    .index("by_user_created", ["userId", "createdAt"]),
});
