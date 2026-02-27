# Jarvis Implementation Plan
**Created: 2026-02-27**
**Branch: `feature/jarvis-rewrite`**

> **If you are an agent assigned to this project:**
> 1. Read this document fully before touching any code.
> 2. Read `CLAUDE.md` for build commands and architecture rules.
> 3. Implement exactly one work unit. Do not exceed your assigned scope.
> 4. Run `npm run build` after every commit — it must exit 0.
> 5. Commit and push after each sub-task, not at the end.

---

## Context: What the Codebase Is Right Now

This is a complete rewrite of the original MNotes app into "Jarvis" — a personal AI assistant. The architecture:

- **Next.js 16 frontend** on Vercel (app router, React 19, Tailwind, Convex client)
- **Express agent-server** (runs locally or on a VPS, port 3001) — wraps the Claude Agent SDK, streams SSE to the browser
- **Convex backend** — database, auth, OAuth callbacks, no AI logic here
- **MCP sub-processes** — `agent-server/src/mcp/` — one process per connector (Gmail, Calendar, GitHub, Memory), spawned by the agent server for each conversation

The chat flow: **Browser → Next.js `/api/agent` route → agent-server `/api/chat` → Claude Agent SDK → MCP subprocesses → Convex**

**Critical: Read these files before starting any work:**
- `agent-server/src/agent.ts` — agent orchestration, MCP server setup
- `agent-server/src/auth.ts` — auth mode detection
- `agent-server/src/mcp/` — all connector MCP servers
- `convex/schema.ts` — all database tables
- `convex/connectors/tokens.ts` — OAuth token storage
- `convex/memory.ts` — memory system
- `src/components/chat/JarvisChat.tsx` — the entire chat UI
- `src/app/api/agent/route.ts` — Next.js proxy route

---

## Phase 1: Fix What's Broken (Do These First)

These are all independent bugs. Agents can work on 1a + 1b in parallel, then 1c + 1d + 1e in parallel.

---

### 1a — Fix Memory MCP Auth [CRITICAL]

**Assigned file scope:** `convex/memory.ts`, `agent-server/src/mcp/memory.ts`

**Problem:**
`agent-server/src/mcp/memory.ts` uses `ConvexHttpClient` with no auth token. When it calls `convex.mutation("memory:save", ...)`, Convex runs `getUserId(ctx)` with no session and gets back `"default"`. Every memory the agent saves goes to the wrong user bucket. Memory search also queries the wrong user. The memory system appears to work (no errors thrown) but silently does nothing useful.

**Root cause:** The `memory.save`, `memory.search`, and `memory.listByTier` Convex functions authenticate via session token. MCP servers have no session token — they have a `USER_ID` env var instead.

**Fix: Step 1 — Add agent-facing memory functions to `convex/memory.ts`**

Add these three new exported functions at the bottom of `convex/memory.ts`. Do NOT modify or remove any existing functions.

```typescript
// ─── Agent-facing variants (accept userId directly, no auth context) ──────────
// These are used by MCP servers which run server-side with a trusted USER_ID.
// Pattern mirrors connectors/tokens.ts getByProvider.

export const saveForAgent = mutation({
  args: {
    userId: v.string(),
    tier: v.union(v.literal("persistent"), v.literal("archival"), v.literal("session")),
    category: v.string(),
    title: v.string(),
    content: v.string(),
    importance: v.optional(v.number()),
  },
  handler: async (ctx, { userId, tier, category, title, content, importance = 5 }) => {
    if (!userId || userId === "default") throw new Error("Invalid userId");
    const now = Date.now();
    return ctx.db.insert("memoryEntries", {
      userId,
      tier,
      category,
      title,
      content,
      importance,
      source: "agent",
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const searchForAgent = query({
  args: {
    userId: v.string(),
    query: v.string(),
    tier: v.optional(v.union(v.literal("persistent"), v.literal("archival"), v.literal("session"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, query: searchQuery, tier, limit = 20 }) => {
    if (!userId || userId === "default") return [];
    return ctx.db
      .query("memoryEntries")
      .withSearchIndex("search_content", (q) => {
        let s = q.search("content", searchQuery).eq("userId", userId).eq("archived", false);
        if (tier) s = s.eq("tier", tier);
        return s;
      })
      .take(limit);
  },
});

export const listByTierForAgent = query({
  args: {
    userId: v.string(),
    tier: v.union(v.literal("persistent"), v.literal("archival"), v.literal("session")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, tier, limit = 30 }) => {
    if (!userId || userId === "default") return [];
    return ctx.db
      .query("memoryEntries")
      .withIndex("by_user_tier_updated", (q) => q.eq("userId", userId).eq("tier", tier))
      .order("desc")
      .filter((q) => q.eq(q.field("archived"), false))
      .take(limit);
  },
});
```

**Fix: Step 2 — Update `agent-server/src/mcp/memory.ts` to use the new functions**

Replace the three tool handlers (`memory_save`, `memory_search`, `memory_list`) to call the new userId-accepting functions. The `USER_ID` env var is already set by `buildMcpServers()` in `agent.ts`.

```typescript
// memory_save handler — replace the convex.mutation call:
await convex.mutation("memory:saveForAgent" as any, {
  userId: USER_ID,
  tier: args.tier as "persistent" | "archival" | "session",
  category: String(args.category ?? "fact"),
  title: String(args.title),
  content: String(args.content),
  importance: typeof args.importance === "number" ? args.importance : 5,
});

// memory_search handler — replace the convex.query call:
const results = await convex.query("memory:searchForAgent" as any, {
  userId: USER_ID,
  query: String(args.query),
  tier: args.tier as "persistent" | "archival" | "session" | undefined,
  limit: 10,
}) as MemoryRow[];

// memory_list handler — replace the convex.query call:
const tier = (args.tier as "persistent" | "archival" | "session") ?? "persistent";
const results = await convex.query("memory:listByTierForAgent" as any, {
  userId: USER_ID,
  tier,
  limit: 30,
}) as MemoryRow[];
```

**Testing:** After this change, ask Jarvis to remember something, then in a new session ask what it remembers. The memory should persist correctly to your actual user account, not the "default" bucket. Check the Convex dashboard — memoryEntries should have your real userId.

---

### 1b — Fix Google OAuth Token Refresh [CRITICAL]

**Assigned file scope:** `convex/connectors/tokens.ts`, `agent-server/src/mcp/gmail.ts`, `agent-server/src/mcp/calendar.ts`, `agent-server/src/agent.ts`, `agent-server/.env.example`

**Problem:**
Google OAuth access tokens expire after 3600 seconds (1 hour). Both `gmail.ts` and `calendar.ts` have a literal `// TODO: refresh if expired` comment and never refresh. After an hour, all Gmail and Calendar tool calls fail. The agent either surfaces a cryptic API error or (worse) fabricates a response.

**Fix: Step 1 — Add a public token update mutation to `convex/connectors/tokens.ts`**

Add this function at the bottom of `convex/connectors/tokens.ts`. Do NOT modify any existing functions.

```typescript
/**
 * Public mutation: update access token + expiry by userId + provider.
 * Called by MCP servers after refreshing an expired OAuth token.
 * Intentionally accepts userId directly (no auth context) — MCP servers are trusted.
 */
export const updateAccessToken = mutation({
  args: {
    userId: v.string(),
    provider: v.union(
      v.literal("github"),
      v.literal("google-calendar"),
      v.literal("gmail"),
      v.literal("outlook"),
      v.literal("microsoft-teams")
    ),
    accessToken: v.string(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.userId || args.userId === "default") throw new Error("Invalid userId");
    const existing = await ctx.db
      .query("connectorTokens")
      .withIndex("by_user_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();
    if (!existing) return;
    await ctx.db.patch(existing._id, {
      accessToken: args.accessToken,
      ...(args.expiresAt !== undefined ? { expiresAt: args.expiresAt } : {}),
      updatedAt: Date.now(),
    });
  },
});
```

**Fix: Step 2 — Add refresh env vars to `agent-server/.env.example`**

Add these lines to the end of `agent-server/.env.example`:

```
# ── Google OAuth (for token refresh in MCP servers) ───────────────────────────
# Same values as your Convex environment's GOOGLE_OAUTH_CLIENT_ID/SECRET
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
```

**Fix: Step 3 — Pass refresh env vars to Google MCP subprocesses in `agent-server/src/agent.ts`**

In the `buildMcpServers()` function, find the `gmail` and `google-calendar` blocks and add `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` to their `env` objects:

```typescript
// For the gmail block, update env to:
env: {
  CONVEX_URL: process.env.CONVEX_URL ?? "",
  CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
  USER_ID: userId,
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
},

// For the calendar block, update env to:
env: {
  CONVEX_URL: process.env.CONVEX_URL ?? "",
  CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
  USER_ID: userId,
  GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
  GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
},
```

**Fix: Step 4 — Add refresh logic to `agent-server/src/mcp/gmail.ts`**

Add these constants near the top of `gmail.ts`, after the existing `const convex = ...` line:

```typescript
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "";
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "";
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  if (!GOOGLE_OAUTH_CLIENT_ID || !GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID/SECRET not configured. Cannot refresh token.");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}
```

Replace the existing `getAccessToken()` function with:

```typescript
async function getAccessToken(): Promise<string> {
  const tokens = await convex.query("connectors/tokens:getByProvider" as any, {
    userId: USER_ID,
    provider: "gmail",
  }) as { accessToken: string; refreshToken?: string; expiresAt?: number } | null;

  if (!tokens?.accessToken) {
    throw new Error("Gmail not connected. Please connect Gmail in Settings.");
  }

  // Refresh if expired or expiring soon
  if (tokens.expiresAt && tokens.expiresAt < Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
    if (!tokens.refreshToken) {
      throw new Error("Gmail token expired and no refresh token available. Please reconnect Gmail in Settings.");
    }
    const refreshed = await refreshGoogleToken(tokens.refreshToken);
    const newExpiresAt = Date.now() + refreshed.expires_in * 1000;
    // Persist the new token
    await convex.mutation("connectors/tokens:updateAccessToken" as any, {
      userId: USER_ID,
      provider: "gmail",
      accessToken: refreshed.access_token,
      expiresAt: newExpiresAt,
    });
    return refreshed.access_token;
  }

  return tokens.accessToken;
}
```

**Fix: Step 5 — Apply the same changes to `agent-server/src/mcp/calendar.ts`**

Add the same constants and `refreshGoogleToken` function (exact copy). Replace `getAccessToken()` with the same logic, changing `provider: "gmail"` to `provider: "google-calendar"` and the error message accordingly. Also update the inline token fetch in `calendar_find_free_slots` — it calls `getAccessToken()` directly so the fix propagates automatically.

**Testing:** Connect Gmail in Settings, wait 1+ hours (or manually set `expiresAt` to a past timestamp in Convex dashboard), then ask Jarvis to check email. It should silently refresh and continue working instead of throwing an auth error.

---

### 1c — Tell the Agent Which Connectors Are Connected [SIGNIFICANT]

**Assigned file scope:** `agent-server/src/prompt.ts`, `agent-server/src/agent.ts`

**Problem:**
The system prompt tells the agent "use gmail, calendar, outlook tools" without telling it which are actually connected. If Gmail is not connected, the MCP server subprocess won't be running, but the agent doesn't know that. It may attempt to use a tool that doesn't exist or confidently claim it checked when it couldn't.

**Fix: Step 1 — Update `buildSystemPrompt` signature in `agent-server/src/prompt.ts`**

Change the function signature to accept a `connectors` parameter:

```typescript
export function buildSystemPrompt(
  soulFile: string | undefined,
  memories: MemoryEntry[],
  connectors: string[] = []
): string {
```

Add a connector section inside the returned prompt string, after the `memoriesSection`:

```typescript
const connectorSection =
  connectors.length > 0
    ? `## Connected Integrations\n\nThe following external services are connected and available via tools:\n${connectors
        .map((c) => {
          const labels: Record<string, string> = {
            gmail: "- **Gmail** — use gmail_list_recent, gmail_search, gmail_get_message, gmail_send, gmail_create_draft",
            "google-calendar": "- **Google Calendar** — use calendar_list_events, calendar_get_agenda, calendar_find_free_slots, calendar_create_event",
            github: "- **GitHub** — use github_list_prs, github_list_issues, github_get_pr, github_create_issue, github_list_my_prs, github_get_repo_activity",
            outlook: "- **Outlook** — use outlook_* tools",
          };
          return labels[c] ?? `- ${c}`;
        })
        .join("\n")}\n\nIf a service is NOT listed above, do not attempt to use its tools — they are not connected.`
    : `## Connected Integrations\n\nNo external integrations are currently connected. You cannot check email, calendar, or GitHub. Suggest the user connect them in Settings.`;
```

Insert `${connectorSection}` into the returned template string between `${memoriesSection}` and `## Memory Guidelines`.

**Fix: Step 2 — Pass connectors to `buildSystemPrompt` in `agent-server/src/agent.ts`**

In `runClaudeAgent()`, find the `buildSystemPrompt` call and pass `connectors`:

```typescript
// Change from:
const systemPrompt = buildSystemPrompt(req.soulFile, req.memories ?? []);

// Change to:
const systemPrompt = buildSystemPrompt(req.soulFile, req.memories ?? [], connectors);
```

Note: `buildSystemPrompt` is called once at the top of `runAgent()` before the Claude/Gemini branch. Move it to inside `runClaudeAgent()` where `connectors` is available, or pass `connectors` to `runAgent()` before the system prompt is built.

The cleanest approach: move `buildSystemPrompt` call inside `runClaudeAgent()` and `runGeminiFallback()` separately, passing `connectors` only to Claude (Gemini doesn't use MCP tools anyway).

**Testing:** Connect one service, leave others disconnected. Ask Jarvis to check a disconnected service — it should say the service isn't connected rather than attempting to use unavailable tools.

---

### 1d — Fix WelcomeState Prompt Chips [BUG]

**Assigned file scope:** `src/components/chat/JarvisChat.tsx`

**Problem:**
The welcome screen shows clickable prompt suggestions. Clicking one calls:
```tsx
onSend={(text) => { setInput(text); void sendMessage(); }}
```
`setInput(text)` is async (React batches state updates). `sendMessage()` immediately captures stale `input` state (""), so nothing happens.

**Fix:** Refactor `sendMessage` to accept an optional text override.

In `JarvisChat.tsx`, change the `sendMessage` `useCallback`:

```typescript
// Change signature from:
const sendMessage = useCallback(async () => {
  if (!input.trim() || isStreaming || !activeThreadId) return;
  const userText = input.trim();

// Change to:
const sendMessage = useCallback(async (overrideText?: string) => {
  const userText = (overrideText ?? input).trim();
  if (!userText || isStreaming || !activeThreadId) return;
```

The rest of the function body is unchanged. The `deps` array of `useCallback` stays the same.

Update the `WelcomeState` usage:

```tsx
// Change from:
<WelcomeState onSend={(text) => { setInput(text); void sendMessage(); }} />

// Change to:
<WelcomeState onSend={(text) => void sendMessage(text)} />
```

Update the keyboard handler and button onClick (these already call `sendMessage()` with no args — they're fine as-is).

**Testing:** Open Jarvis with no messages (empty state). Click one of the prompt chips. It should immediately send the message without needing to click Send.

---

### 1e — Fix Gemini Model IDs [BUG]

**Assigned file scope:** `src/components/chat/JarvisChat.tsx`, `agent-server/src/auth.ts`, `src/app/api/agent/route.ts`

**Problem:**
`gemini-3-flash-preview` and `gemini-3-pro-preview` are not real model IDs. Gemini 3 has not been released. The current stable Gemini models are `gemini-2.5-flash-preview-04-17` and `gemini-2.5-pro-preview-05-06`. Using wrong model IDs causes silent API failures — the API returns a 404/invalid model error, and the agent falls back or fails.

**Fix: Step 1 — Update `src/components/chat/JarvisChat.tsx`**

Find the `CHAT_MODELS` constant and replace the Gemini group:

```typescript
{
  group: "Gemini",
  note: "requires Google API key",
  provider: "google" as const,
  models: [
    { value: "gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash", description: "Fast, recommended" },
    { value: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro", description: "Most capable" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Stable" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", description: "Fastest, cheapest" },
  ],
},
```

**Fix: Step 2 — Update defaults in `agent-server/src/auth.ts`**

```typescript
// Change:
const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
// To:
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-preview-04-17";
```

```typescript
// In normalizeGeminiModel, change:
return model.startsWith("gemini-") ? model : DEFAULT_GEMINI_MODEL;
// No change needed here — this already handles real gemini- prefixed IDs.

// But update the GOOGLE_MODEL/GEMINI_MODEL default:
if (!model) return process.env.GOOGLE_MODEL ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
```

**Fix: Step 3 — Update `agent-server/src/agent.ts`**

```typescript
// Change:
const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
// To:
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-preview-04-17";
```

**Fix: Step 4 — Update `src/app/api/agent/route.ts`**

```typescript
// Change:
const DEFAULT_GOOGLE_MODEL = "gemini-3-flash-preview";
// To:
const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash-preview-04-17";
```

**Testing:** Set provider to Google in Settings, send a message. Check the agent-server logs — the model name should be `gemini-2.5-flash-preview-04-17` and the API should respond successfully.

---

## Phase 2: Proactive Jarvis (Make It Autonomous)

These are the features that make it a real Jarvis rather than a chat box. They depend on Phase 1 being complete.

**Dependency order:** 2a → 2b → 2c → 2d (in sequence). 2e is independent.

---

### 2a — Add Agent Notification + Scheduled Task Tables [SCHEMA]

**Assigned file scope:** `convex/schema.ts`

**Problem:**
There is no data model for proactive agent output or user-configured scheduled tasks. Before building proactive features, these tables must exist.

**Fix:** Add two tables to `convex/schema.ts`. Add them after the `connectorAuthSessions` table definition. Do NOT modify any existing table.

```typescript
// ─── Agent Notifications ──────────────────────────────────────────────────────
// Proactive findings from scheduled agent tasks. Shown to user in chat.
agentNotifications: defineTable({
  userId: v.string(),
  title: v.string(),
  body: v.string(),          // markdown content
  type: v.union(
    v.literal("briefing"),   // morning/evening summary
    v.literal("alert"),      // urgent item detected
    v.literal("digest"),     // periodic digest (email, GitHub, etc.)
    v.literal("reminder"),   // user-set reminder
  ),
  source: v.optional(v.string()), // "gmail" | "github" | "google-calendar" | etc.
  read: v.boolean(),
  createdAt: v.number(),
}).index("by_user_created", ["userId", "createdAt"])
  .index("by_user_read", ["userId", "read"]),

// ─── Scheduled Agent Tasks ────────────────────────────────────────────────────
// User-configured recurring tasks Jarvis runs automatically.
scheduledAgentTasks: defineTable({
  userId: v.string(),
  name: v.string(),          // e.g. "Morning Briefing"
  prompt: v.string(),        // what to ask the agent
  schedule: v.string(),      // cron expression e.g. "0 8 * * *" (8am daily)
  enabled: v.boolean(),
  connectors: v.array(v.string()), // which connectors this task needs
  lastRunAt: v.optional(v.number()),
  nextRunAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_next_run", ["nextRunAt"]),
```

After adding the tables, run `npx convex dev` to verify the schema compiles. Then commit.

---

### 2b — Add Non-Streaming Agent Endpoint [AGENT-SERVER]

**Assigned file scope:** `agent-server/src/index.ts`

**Problem:**
The agent-server only has a streaming SSE endpoint (`POST /api/chat`). Convex cron actions need to call the agent server and wait for a JSON result, not consume an SSE stream.

**Fix:** Add a `POST /api/task` route to `agent-server/src/index.ts` that runs the agent and returns a JSON result when complete.

Add this route after the existing `/api/chat` route:

```typescript
/**
 * POST /api/task
 * Non-streaming task execution for scheduled/proactive agent runs.
 * Body: same as ChatRequest minus sessionId (tasks always start fresh)
 * Response: { success: true, response: string, sessionId: string }
 *         | { success: false, error: string }
 */
app.post("/api/task", requireAuth, async (req, res) => {
  const body = req.body as ChatRequest;

  if (!body.userId || !body.message || !body.threadId) {
    res.status(400).json({ error: "Missing required fields: userId, message, threadId" });
    return;
  }

  try {
    const config = detectAuthMode({
      preferredProvider: body.aiProvider,
      preferredModel: body.aiModel,
      anthropicApiKey: body.anthropicApiKey,
      googleApiKey: body.googleApiKey,
    });

    const connectors: string[] = Array.isArray(body.connectors)
      ? (body.connectors as string[]).filter((c) => SUPPORTED_CONNECTORS.has(c))
      : [];

    // Collect events but don't stream — return when done
    const events: SSEEvent[] = [];
    const onEvent = (event: SSEEvent) => events.push(event);

    const result = await runAgent(body, config, connectors, onEvent);

    res.json({
      success: true,
      response: result.response,
      sessionId: result.sessionId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent error";
    res.status(500).json({ success: false, error: message });
  }
});
```

**Testing:** `curl -X POST http://localhost:3001/api/task -H "Content-Type: application/json" -d '{"userId":"test","message":"Say hello","threadId":"test-thread"}'` — should return `{"success":true,"response":"Hello!","sessionId":"..."}`.

---

### 2c — Add Convex Functions for Notifications and Scheduling [BACKEND]

**Assigned file scope:** `convex/notifications.ts` (CREATE), `convex/scheduledTasks.ts` (CREATE)

**Problem:**
The two new tables need CRUD functions before the proactive system can use them.

**Fix: Create `convex/notifications.ts`**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

export const list = query({
  args: { limit: v.optional(v.number()), unreadOnly: v.optional(v.boolean()) },
  handler: async (ctx, { limit = 20, unreadOnly = false }) => {
    const userId = await getUserId(ctx);
    let q = ctx.db
      .query("agentNotifications")
      .withIndex("by_user_created", (idx) => idx.eq("userId", userId))
      .order("desc");
    if (unreadOnly) {
      return q.filter((row) => row.eq(row.field("read"), false)).take(limit);
    }
    return q.take(limit);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const unread = await ctx.db
      .query("agentNotifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("agentNotifications") },
  handler: async (ctx, { notificationId }) => {
    const userId = await getUserId(ctx);
    const n = await ctx.db.get(notificationId);
    if (!n || n.userId !== userId) return;
    await ctx.db.patch(notificationId, { read: true });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    const unread = await ctx.db
      .query("agentNotifications")
      .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("read", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});

// Internal: called by scheduled tasks / agent crons
export const createInternal = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.union(v.literal("briefing"), v.literal("alert"), v.literal("digest"), v.literal("reminder")),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("agentNotifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});
```

**Fix: Create `convex/scheduledTasks.ts`**

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserId } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    return ctx.db
      .query("scheduledAgentTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("scheduledAgentTasks")),
    name: v.string(),
    prompt: v.string(),
    schedule: v.string(),
    enabled: v.boolean(),
    connectors: v.array(v.string()),
  },
  handler: async (ctx, { id, ...args }) => {
    const userId = await getUserId(ctx);
    const now = Date.now();
    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing || existing.userId !== userId) return;
      await ctx.db.patch(id, { ...args, updatedAt: now });
      return id;
    }
    return ctx.db.insert("scheduledAgentTasks", {
      userId,
      ...args,
      lastRunAt: undefined,
      nextRunAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("scheduledAgentTasks") },
  handler: async (ctx, { id }) => {
    const userId = await getUserId(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) return;
    await ctx.db.delete(id);
  },
});

export const toggle = mutation({
  args: { id: v.id("scheduledAgentTasks"), enabled: v.boolean() },
  handler: async (ctx, { id, enabled }) => {
    const userId = await getUserId(ctx);
    const task = await ctx.db.get(id);
    if (!task || task.userId !== userId) return;
    await ctx.db.patch(id, { enabled, updatedAt: Date.now() });
  },
});

// Internal: list all enabled tasks due for execution
export const listDueInternal = query({
  args: { nowMs: v.number() },
  handler: async (ctx, { nowMs }) => {
    return ctx.db
      .query("scheduledAgentTasks")
      .withIndex("by_next_run", (q) => q.lte("nextRunAt", nowMs))
      .filter((q) => q.eq(q.field("enabled"), true))
      .collect();
  },
});

export const updateLastRunInternal = mutation({
  args: {
    id: v.id("scheduledAgentTasks"),
    lastRunAt: v.number(),
    nextRunAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      lastRunAt: args.lastRunAt,
      nextRunAt: args.nextRunAt,
      updatedAt: Date.now(),
    });
  },
});
```

After creating both files, add a Convex codegen run: `npx convex dev` to verify they compile.

---

### 2d — Proactive Cron: Morning Briefing [CRON + ACTION]

**Assigned file scope:** `convex/crons.ts` (CREATE if not exists, ADD to if exists), `convex/proactive.ts` (CREATE)

**Problem:**
No scheduled agent tasks exist. Jarvis can only respond when asked. The first proactive feature is a morning briefing: every morning, Jarvis checks email and calendar and surfaces a summary as a notification.

**What this does:**
- Convex cron runs every hour
- Checks if any `scheduledAgentTasks` with `nextRunAt <= now` exist
- For each due task, calls the agent server's `/api/task` endpoint
- Stores the response as an `agentNotification`
- Updates `lastRunAt` and `nextRunAt` on the task

**Fix: Create `convex/proactive.ts`**

```typescript
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

/**
 * Run all scheduled agent tasks that are due.
 * Called by cron every hour.
 */
export const runDueTasks = internalAction({
  args: {},
  handler: async (ctx) => {
    const nowMs = Date.now();
    const dueTasks = await ctx.runQuery(internal.scheduledTasks.listDueInternal, { nowMs });

    for (const task of dueTasks) {
      try {
        await ctx.runAction(internal.proactive.runTaskForUser, {
          taskId: task._id,
          userId: task.userId,
          prompt: task.prompt,
          connectors: task.connectors,
          taskName: task.name,
        });
      } catch (err) {
        console.error(`Failed to run scheduled task ${task.name} for user ${task.userId}:`, err);
      }
    }
  },
});

export const runTaskForUser = internalAction({
  args: {
    taskId: v.id("scheduledAgentTasks"),
    userId: v.string(),
    prompt: v.string(),
    connectors: v.array(v.string()),
    taskName: v.string(),
  },
  handler: async (ctx, args) => {
    const agentServerUrl = process.env.AGENT_SERVER_URL ?? "http://localhost:3001";
    const agentServerSecret = process.env.AGENT_SERVER_SECRET ?? "";

    // Get user's settings for API keys + preferences
    const settings = await ctx.runQuery(api.settings.getRaw, { userId: args.userId });

    // Get soul file + memories for context
    const soulFile = await ctx.runQuery(api.memory.getSoulFile);
    const memories = await ctx.runQuery(api.memory.listByTier, { tier: "persistent", limit: 30 });

    const body = {
      userId: args.userId,
      threadId: `scheduled-${args.taskId}-${Date.now()}`,
      message: args.prompt,
      connectors: args.connectors,
      soulFile: soulFile?.content ?? "",
      memories: memories.map((m) => ({
        id: m._id,
        tier: m.tier,
        category: m.category,
        title: m.title,
        content: m.content,
        importance: m.importance,
      })),
      aiProvider: settings?.aiProvider ?? "anthropic",
      aiModel: settings?.aiModel ?? "claude-sonnet-4-5-20250929",
      anthropicApiKey: settings?.anthropicApiKey,
      googleApiKey: settings?.googleApiKey,
    };

    const res = await fetch(`${agentServerUrl}/api/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agentServerSecret ? { Authorization: `Bearer ${agentServerSecret}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Agent task failed: ${res.status}`);
    }

    const result = await res.json() as { success: boolean; response: string };
    if (!result.success) {
      throw new Error(`Agent task error: ${(result as any).error}`);
    }

    // Save notification
    await ctx.runMutation(internal.notifications.createInternal, {
      userId: args.userId,
      title: args.taskName,
      body: result.response,
      type: "briefing",
      source: args.connectors[0],
    });

    // Update task timing (schedule next run in 24 hours for daily tasks)
    const now = Date.now();
    await ctx.runMutation(internal.scheduledTasks.updateLastRunInternal, {
      id: args.taskId,
      lastRunAt: now,
      nextRunAt: now + 24 * 60 * 60 * 1000, // simple: 24h from now
    });
  },
});
```

**Fix: Create or update `convex/crons.ts`**

If `crons.ts` doesn't exist, create it:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for due scheduled agent tasks every hour
crons.interval(
  "run-scheduled-agent-tasks",
  { hours: 1 },
  internal.proactive.runDueTasks,
  {}
);

export default crons;
```

If `crons.ts` exists, add the `crons.interval` call to the existing file without removing anything.

**Note on agent server URL in Convex actions:** The `AGENT_SERVER_URL` and `AGENT_SERVER_SECRET` env vars must be set in your Convex project environment (via `npx convex env set AGENT_SERVER_URL http://...`), not just in the Next.js `.env.local`. Convex actions run server-side on Convex's infrastructure, not on Vercel.

---

### 2e — Scheduled Tasks Settings UI + Notification Inbox [FRONTEND]

**Assigned file scope:** `src/app/dashboard/settings/page.tsx`, `src/components/chat/JarvisChat.tsx`

**Problem:**
Users can't configure scheduled tasks and can't see proactive notifications.

**Fix: Part A — Notifications inbox in `JarvisChat.tsx`**

Add a notification badge and notification section to the chat UI. The goal: when Jarvis has run a scheduled task and produced a notification, the user sees it the next time they open the chat.

1. Import the notifications query at the top of the component:
```typescript
const notifications = useQuery(api.notifications.list, { limit: 5, unreadOnly: true });
const markAllRead = useMutation(api.notifications.markAllRead);
```

2. In the messages area, show unread notifications ABOVE the normal message list (only when `allMessages.length === 0 || notifications?.length > 0`):

```tsx
{notifications && notifications.length > 0 && (
  <div className="mb-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
        While you were away
      </span>
      <button
        onClick={() => void markAllRead()}
        className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
      >
        Dismiss all
      </button>
    </div>
    <div className="space-y-2">
      {notifications.map((n) => (
        <div
          key={n._id}
          className="bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/15 dark:border-blue-600/20 rounded-xl p-3"
        >
          <div className="flex items-start gap-2">
            <AgentAvatar />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-600 dark:text-stone-300 mb-1">{n.title}</p>
              <MessageStream content={n.body} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

**Fix: Part B — Scheduled tasks section in `src/app/dashboard/settings/page.tsx`**

Add a "Scheduled Tasks" section at the bottom of the settings page (before the Save button). The section lets users create a "Morning Briefing" task with a toggle to enable/disable.

Import what's needed at the top:
```typescript
import { Clock } from "lucide-react";
const scheduledTasks = useQuery(api.scheduledTasks.list);
const upsertScheduledTask = useMutation(api.scheduledTasks.upsert);
const toggleScheduledTask = useMutation(api.scheduledTasks.toggle);
const removeScheduledTask = useMutation(api.scheduledTasks.remove);
```

Add a preset button that creates the morning briefing task if it doesn't exist:
```tsx
<section>
  <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
    Scheduled Tasks
  </h2>
  <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
    <p className="text-xs text-stone-500">
      Jarvis can proactively check your accounts and surface important information.
      Requires the agent server to be running.
    </p>
    {scheduledTasks?.length === 0 && (
      <button
        onClick={() => void upsertScheduledTask({
          name: "Morning Briefing",
          prompt: "Check my email for anything urgent, look at my calendar for today and tomorrow, and summarize my open GitHub PRs if I have GitHub connected. Give me a concise morning briefing.",
          schedule: "0 8 * * *",
          enabled: true,
          connectors: ["gmail", "google-calendar", "github"],
        })}
        className="text-xs px-3 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 text-blue-600 dark:text-blue-400 transition-colors"
      >
        + Add Morning Briefing
      </button>
    )}
    <div className="space-y-2">
      {scheduledTasks?.map((task) => (
        <div key={task._id} className="flex items-center gap-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{task.name}</p>
            <p className="text-xs text-stone-400 truncate">{task.prompt}</p>
          </div>
          <button
            onClick={() => void toggleScheduledTask({ id: task._id, enabled: !task.enabled })}
            className={`text-xs px-2 py-1 rounded-md transition-colors ${
              task.enabled
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                : "bg-stone-100 dark:bg-stone-700 text-stone-500"
            }`}
          >
            {task.enabled ? "On" : "Off"}
          </button>
          <button
            onClick={() => void removeScheduledTask({ id: task._id })}
            className="text-stone-300 dark:text-stone-600 hover:text-red-400 dark:hover:text-red-400 text-xs"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  </div>
</section>
```

---

## Phase 3: UX Improvements (Do After Phase 1+2 Are Working)

These are independent of each other. Any agent can pick one.

---

### 3a — Default-Expand Agent Activity Bar [UX]

**Assigned file scope:** `src/components/chat/JarvisChat.tsx`

**Problem:** The activity bar (showing what tools the agent is using) is collapsed by default. Users see "Searching the web…" but have to click to see what it found. This is the opposite of what you want — the work should be visible.

**Fix:** Change `activityExpanded` initial state from `false` to `true`. Change the collapse trigger from `case "text":` to keep expanded until the response is done.

```typescript
// Change:
const [activityExpanded, setActivityExpanded] = useState(false);
// To:
const [activityExpanded, setActivityExpanded] = useState(true);

// In the "text" SSE event handler, remove the setActivityExpanded(false) call:
// DELETE this line from case "text":
// setActivityExpanded(false);

// In the "done" SSE event handler, keep collapsed after response is done:
case "done":
  setActivityExpanded(false); // collapse when fully done
```

This means: while the agent is working and streaming text, the activity bar stays expanded. Once done, it collapses. Users see all the steps while they're happening.

---

### 3b — Soul File Viewer in Settings [UX]

**Assigned file scope:** `src/app/dashboard/settings/page.tsx`

**Problem:** Users can't see or edit their soul file (the agent's long-term profile of them) from the UI. The memory page at `/dashboard/memory` shows memories, but the soul file is separate and invisible.

**Fix:** Add a "Profile (Soul File)" section to the settings page that shows the current soul file content and allows editing.

```typescript
// At top of SettingsPage component, add:
const soulFile = useQuery(api.memory.getSoulFile);
const upsertSoulFile = useMutation(api.memory.upsertSoulFile);
const [soulFileContent, setSoulFileContent] = useState("");
const [editingSoulFile, setEditingSoulFile] = useState(false);

// Sync soul file content when loaded:
useEffect(() => {
  if (soulFile?.content) setSoulFileContent(soulFile.content);
}, [soulFile]);
```

Add a section in the JSX:
```tsx
<section>
  <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
    Your Profile (Soul File)
  </h2>
  <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
    <p className="text-xs text-stone-500">
      Jarvis uses this profile to personalize responses. It's built automatically during onboarding and updated as you interact.
    </p>
    {soulFile ? (
      editingSoulFile ? (
        <div className="space-y-2">
          <textarea
            value={soulFileContent}
            onChange={(e) => setSoulFileContent(e.target.value)}
            rows={10}
            className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-700 dark:text-stone-300 font-mono outline-none focus:border-blue-500/50 transition-colors resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await upsertSoulFile({ content: soulFileContent });
                setEditingSoulFile(false);
                toast.success("Profile updated");
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >Save</button>
            <button
              onClick={() => { setSoulFileContent(soulFile.content); setEditingSoulFile(false); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
            >Cancel</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <pre className="text-xs text-stone-600 dark:text-stone-400 font-mono whitespace-pre-wrap bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 max-h-48 overflow-y-auto">
            {soulFile.content || "(empty)"}
          </pre>
          <button
            onClick={() => setEditingSoulFile(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
          >Edit Profile</button>
        </div>
      )
    ) : (
      <p className="text-xs text-stone-400">No profile yet. Complete onboarding to create one.</p>
    )}
  </div>
</section>
```

---

## Multi-Agent Coordination

### Branch Strategy
All agents work on `feature/jarvis-rewrite`. Do NOT create new branches. Commit and push frequently.

### Commit Message Format
```
fix(1a): fix memory MCP auth — save to correct userId
fix(1b): implement Google OAuth token refresh
fix(1c): tell agent which connectors are connected
fix(1d): fix WelcomeState prompt chips race condition
fix(1e): update Gemini model IDs to current versions
feat(2a): add agentNotifications + scheduledAgentTasks tables
feat(2b): add non-streaming /api/task endpoint to agent-server
feat(2c): add Convex notification + scheduled task functions
feat(2d): add proactive cron + morning briefing action
feat(2e): add notification inbox + scheduled tasks settings UI
feat(3a): expand agent activity bar by default during tool use
feat(3b): add soul file viewer/editor to settings
```

### File Ownership (no two agents touch the same file)

| Work Unit | Owns These Files |
|-----------|-----------------|
| 1a | `convex/memory.ts`, `agent-server/src/mcp/memory.ts` |
| 1b | `convex/connectors/tokens.ts`, `agent-server/src/mcp/gmail.ts`, `agent-server/src/mcp/calendar.ts`, `agent-server/src/agent.ts`, `agent-server/.env.example` |
| 1c | `agent-server/src/prompt.ts`, `agent-server/src/agent.ts` ⚠️ coordinate with 1b on agent.ts |
| 1d | `src/components/chat/JarvisChat.tsx` |
| 1e | `src/components/chat/JarvisChat.tsx` ⚠️ coordinate with 1d, `agent-server/src/auth.ts`, `src/app/api/agent/route.ts` |
| 2a | `convex/schema.ts` |
| 2b | `agent-server/src/index.ts` |
| 2c | `convex/notifications.ts` (new), `convex/scheduledTasks.ts` (new) |
| 2d | `convex/proactive.ts` (new), `convex/crons.ts` (new or add to existing) |
| 2e | `src/app/dashboard/settings/page.tsx`, `src/components/chat/JarvisChat.tsx` ⚠️ coordinate with 1d/1e |
| 3a | `src/components/chat/JarvisChat.tsx` ⚠️ coordinate with 1d/1e/2e |
| 3b | `src/app/dashboard/settings/page.tsx` ⚠️ coordinate with 2e |

### ⚠️ Shared File Conflicts
- **`agent-server/src/agent.ts`** — both 1b and 1c need this. 1b adds env vars to MCP server config. 1c moves/updates the `buildSystemPrompt` call. These can be done sequentially (1b first, then 1c).
- **`src/components/chat/JarvisChat.tsx`** — 1d, 1e, 2e, 3a all touch this. Assign them sequentially, not in parallel.
- **`src/app/dashboard/settings/page.tsx`** — 2e and 3b both touch this. Assign sequentially.

### Recommended Parallelism
- **Round 1 (fully parallel):** 1a, 1b, 1e — no shared files
- **Round 2 (after round 1 merges):** 1c, 1d — 1c needs agent.ts updated by 1b
- **Round 3 (after round 2 merges):** 2a, 2b — independent
- **Round 4 (after 2a merges):** 2c, then 2d, then 2e
- **Round 5 (after all phase 2 merges):** 3a, 3b

### Build Verification (REQUIRED after every commit)
```bash
npm run build   # Must exit 0
npm run lint    # Fix any lint errors
```

---

## What NOT to Change

- Do not modify `convex/auth.ts`, `convex/lib/auth.ts`, `src/middleware.ts` — auth is working
- Do not modify `convex/connectors/googleOauth.ts` or `convex/connectors/githubOauth.ts` — OAuth flows are working
- Do not modify `convex/http.ts` — OAuth routing is correct
- Do not modify `agent-server/src/mcp/outlook.ts` — incomplete but not in scope
- Do not touch the landing page files (`src/app/components/`)
- Do not touch `convex/schema.ts` existing tables — only ADD new tables (work unit 2a)

---

*Last updated: 2026-02-27 — Initial plan from full codebase audit*
