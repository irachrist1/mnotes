# MNotes — Implementation Plan

**Created: February 14, 2026 — Living Document**

This document is designed so **multiple agents can work on separate workstreams simultaneously** without file conflicts. Each workstream lists exact files to CREATE (new) and MODIFY (existing), plus the interface contracts between workstreams.

---

## Takeover Audit (Feb 14, 2026)

This section exists because parts of the plan below are marked "SHIPPED", but the current codebase still has wiring gaps that make core UX feel broken/slow.

### What Is Actually Broken Right Now (Verified In Code)
- **Actions page mismatch**: `src/app/dashboard/actions/page.tsx` is a `tasks` UI, but chat intents + AI Insights create `actionableActions`. Result: AI-created "Actions" do not show up on `/dashboard/actions`.
- **Sidebar missing critical links**: `src/components/layout/Sidebar.tsx` has no nav item for `/dashboard/actions`, and does not render `src/components/layout/NotificationBell.tsx`.
- **Chat feels slow by design**: `convex/ai/chatSend.ts` saves the assistant message only after the full LLM call completes. The UI shows a typing indicator, but there is no immediate assistant placeholder message in the thread.

### Immediate P0 Goal
Make chat feel instant (UI responsiveness) and make "Actions" a real, visible system by wiring `/dashboard/actions` to `actionableActions` end-to-end.

## Architecture Overview (Read This First)

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 + React)                          │
│  src/app/dashboard/     — pages                         │
│  src/components/        — shared UI                     │
│  src/lib/               — client utilities              │
├─────────────────────────────────────────────────────────┤
│  Backend (Convex)                                       │
│  convex/                — mutations, queries, actions    │
│  convex/ai/             — AI pipelines (chatSend,       │
│                           weeklyDigest, soulFileEvolve)  │
│  convex/lib/            — shared server utilities        │
├─────────────────────────────────────────────────────────┤
│  AI Providers                                           │
│  OpenRouter API  ←→  convex/ai/chatSend.ts              │
│  Google AI SDK   ←→  convex/ai/chatSend.ts              │
│  (Future: Perplexity API for research)                  │
└─────────────────────────────────────────────────────────┘
```

### Key Patterns
- **Auth**: `getUserId(ctx)` from `convex/lib/auth.ts` — every mutation/query must call this
- **AI calls**: Always go through Convex actions (`"use node"`) — never from the client
- **Settings**: `userSettings` table stores provider + model + API keys. Use `internal.userSettings.getWithKeys` for unmasked keys in actions
- **Intents**: AI proposes `{ table, operation, data }` via `\`\`\`intent` fences in chat responses. `parseIntentFromResponse()` in `chatPrompt.ts` extracts them. `commitIntent` in `chat.ts` writes to DB
- **Schema**: `convex/schema.ts` is the source of truth. Every new table must be added here
- **Crons**: `convex/crons.ts` — add new scheduled jobs here
- **UI style**: Tailwind + stone color palette + `card` class for containers. Lucide icons in frontend, Phosphor icons only in Sidebar. See `docs/DESIGN_SYSTEM.md`

---

## Workstream Map (Parallelizable)

| # | Workstream | Priority | Status | Dependencies |
|---|-----------|----------|--------|--------------|
| A | Debugging & Logging | P0 | ✅ **SHIPPED** (Feb 14) | None |
| B | Reactive AI Notifications | P1 | ✅ **SHIPPED** (Feb 14) | None |
| C | Actionable Recommended Actions | P1 | ✅ **SHIPPED** (Feb 14) | None |
| D | Research Integration | P2 | ✅ **SHIPPED** (Feb 14) | Uses C's `actionableActions` table |
| E | PostHog Analytics | P3 | ✅ **SHIPPED** (Feb 14) — needs `npm install posthog-js` + `NEXT_PUBLIC_POSTHOG_KEY` env var | None |

### File Ownership (Prevents Merge Conflicts)

**Shared files** — multiple workstreams need to modify these. Coordinate via sections:
- `convex/schema.ts` — each workstream adds its table(s) at the END of the schema, before the closing `});`
- `convex/crons.ts` — each workstream adds its cron at the END of the file
- `src/components/layout/Sidebar.tsx` — only Workstream B adds a notification bell
- `src/components/layout/DashboardShell.tsx` — only Workstream B adds NotificationBell

**Rule: never modify another workstream's NEW files. Only touch shared files in designated sections.**

---

## Workstream A: Debugging & Logging

**Goal:** Verify end-to-end data flow, add observability, fix any remaining silent failures.

### Tasks

#### A1: Add structured logging to chat pipeline
- **File: `convex/ai/chatSend.ts`** (MODIFY lines 100-194)
- Add `console.log` at key points:
  ```
  [CHAT] userId=${userId} threadId=${threadId} provider=${settings.aiProvider} model=${model}
  [CHAT] AI response length=${aiResponse.length} cacheHit=${!!cachedResponse}
  [CHAT] Intent parsed: table=${intent?.table} operation=${intent?.operation}
  [CHAT] Assistant message saved: id=${assistantMsgId}
  ```
- Add timing: `const t0 = Date.now()` before AI call, log `durationMs` after

#### A2: Add logging to commitIntent
- **File: `convex/chat.ts`** (MODIFY around line 269)
- Log before insert: `[COMMIT] table=${table} userId=${userId} fields=${Object.keys(data).join(',')}`
- Log after insert: `[COMMIT] success recordId=${recordId}`
- Log on error: `[COMMIT] FAILED table=${table} error=${err.message}`
- Wrap the entire handler body in try/catch that logs before re-throwing

#### A3: Verify API key flow end-to-end
- **File: `convex/ai/chatSend.ts`** (MODIFY line 52-61)
- If `!settings`, log `[CHAT] NO SETTINGS for userId=${userId}` before throwing
- If `!apiKey`, log `[CHAT] NO API KEY provider=${settings.aiProvider} userId=${userId}`
- **File: `convex/userSettings.ts`** (MODIFY `upsert` handler)
- Log `[SETTINGS] upsert userId=${userId} provider=${args.aiProvider} model=${args.aiModel} hasKey=${!!apiKey}`

#### A4: Test model routing edge cases
- **File: `convex/ai/chatSend.ts`** (MODIFY)
- Add validation: if `model` is empty string, fall back to `DEFAULT_MODEL` from a constant
- Log `[CHAT] model=${model} (resolved from ${settings.aiModel || 'default'})`

#### A5: Verify soul file update triggers
- **File: `convex/ai/soulFileEvolve.ts`** (MODIFY)
- Add logging: `[SOUL_EVOLVE] triggered for userId=${userId} threadId=${threadId}`
- Log success/failure after AI call

### Files Touched (Workstream A only)
| File | Action |
|------|--------|
| `convex/ai/chatSend.ts` | MODIFY — add logging |
| `convex/chat.ts` | MODIFY — add logging to commitIntent |
| `convex/userSettings.ts` | MODIFY — add logging to upsert |
| `convex/ai/soulFileEvolve.ts` | MODIFY — add logging |

### Verification
```bash
# After changes, run:
npx next build        # must pass
npx vitest run        # must pass (71 tests)
# Then manually test:
# 1. Sign up new user → complete onboarding → verify soul file created
# 2. Open chat → send "I have a consulting client paying $5k/month" → verify intent proposed
# 3. Confirm intent → check Convex dashboard for incomeStreams record
# 4. Check Convex logs for all [CHAT], [COMMIT], [SETTINGS] entries
```

---

## Workstream B: Reactive AI Notifications

**Goal:** AI proactively reaches out based on detected patterns and user goals. Daily cron analyzes data, generates notifications shown on dashboard.

### Schema Addition
**File: `convex/schema.ts`** — ADD before closing `});`:
```typescript
notifications: defineTable({
  userId: v.string(),
  type: v.union(
    v.literal("goal-check-in"),
    v.literal("stale-idea"),
    v.literal("overdue-action"),
    v.literal("pattern-detected"),
    v.literal("milestone")
  ),
  title: v.string(),
  body: v.string(),
  actionUrl: v.optional(v.string()),  // deep link to relevant page
  read: v.boolean(),
  dismissed: v.boolean(),
  createdAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_user_read", ["userId", "read"])
  .index("by_creation", ["createdAt"]),
```

### New Files to CREATE

#### B1: `convex/notifications.ts`
Mutations and queries for the notifications table:
- `list` query — returns unread + recent read (last 7 days), ordered desc by createdAt
- `unreadCount` query — returns count of `read === false` for userId
- `markRead` mutation — sets `read: true` for a single notification
- `markAllRead` mutation — sets `read: true` for all user notifications
- `dismiss` mutation — sets `dismissed: true`
- `createInternal` internalMutation — used by the AI cron to insert notifications

#### B2: `convex/ai/dailyNotifications.ts`
AI-powered daily notification generator:
- `runAll` internalAction — triggered by daily cron, fans out per user (same pattern as `weeklyDigest.ts`)
- `generateForUser` internalAction:
  1. Load soul file, domain data, existing notifications (last 7 days to avoid duplicates)
  2. Run rule-based checks (no AI needed for these):
     - **Stale ideas**: ideas where `stage` hasn't changed and `lastUpdated` is >14 days ago
     - **Overdue actions**: mentorship session `actionItems` where `completed === false` and `dueDate` is past
     - **Revenue milestones**: if total monthly revenue crossed a round number ($5k, $10k, etc.) since last check
  3. Run AI-powered checks (needs API key):
     - **Goal check-in**: compare soul file goals against current data, generate progress update
     - **Pattern detected**: analyze data patterns (e.g., "Revenue has grown 3 months straight")
  4. For each notification, check if a similar one was created in the last 7 days (by type + title hash) to avoid spam
  5. Insert via `createInternal`

#### B3: `src/components/layout/NotificationBell.tsx`
UI component for the sidebar:
- Shows bell icon with unread count badge
- Click opens a dropdown/panel with notification list
- Each notification has: icon (by type), title, body preview, timestamp, mark-as-read button
- "Mark all read" button at top
- Click on a notification with `actionUrl` navigates to that page
- Uses `api.notifications.list` and `api.notifications.unreadCount` queries
- Uses `api.notifications.markRead` and `api.notifications.markAllRead` mutations

### Files to MODIFY

#### B4: `convex/crons.ts`
Add daily notification cron:
```typescript
crons.daily(
  "daily-ai-notifications",
  { hourUTC: 7, minuteUTC: 0 },
  internal.ai.dailyNotifications.runAll,
  {}
);
```

#### B5: `src/components/layout/Sidebar.tsx`
- Import `NotificationBell`
- Add it to the desktop sidebar nav (between nav items and user section)
- Add it to the mobile nav

#### B6: `src/components/layout/DashboardShell.tsx`
- No changes needed if NotificationBell is in Sidebar

#### B7: `src/app/dashboard/page.tsx`
- Add a "Recent Notifications" section between digest cards and stat grid (only if notifications exist)
- Show top 3 unread notifications as compact cards with dismiss buttons
- Style: use `border-l-4` color-coded by type (blue for goal, amber for stale, red for overdue, green for milestone)

### Interface Contract
```typescript
// Other workstreams can create notifications by calling:
// await ctx.runMutation(internal.notifications.createInternal, {
//   userId,
//   type: "goal-check-in" | "stale-idea" | "overdue-action" | "pattern-detected" | "milestone",
//   title: "string",
//   body: "string",
//   actionUrl: "/dashboard/ideas",  // optional
// });
```

### Verification
```bash
npx next build && npx vitest run
# Manual test:
# 1. Add an idea, wait >14 days (or manually set lastUpdated in Convex dashboard)
# 2. Trigger dailyNotifications.runAll from Convex dashboard
# 3. Check notification bell shows unread count
# 4. Click bell, verify notification appears
# 5. Click notification, verify navigation to actionUrl
```

---

## Workstream C: Actionable Recommended Actions

**Goal:** Transform AI-generated insights into executable action workflows with status tracking.

### Schema Addition
**File: `convex/schema.ts`** — ADD before closing `});`:
```typescript
actionableActions: defineTable({
  userId: v.string(),
  sourceInsightId: v.optional(v.id("aiInsights")),
  title: v.string(),
  description: v.string(),
  status: v.union(
    v.literal("proposed"),
    v.literal("accepted"),
    v.literal("in-progress"),
    v.literal("completed"),
    v.literal("dismissed")
  ),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  dueDate: v.optional(v.string()),      // ISO date
  calendarEventId: v.optional(v.string()), // external calendar event ID (future)
  aiNotes: v.optional(v.string()),       // AI-generated context/reasoning
  researchResults: v.optional(v.string()), // markdown from research agent (Workstream D)
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"])
  .index("by_user_created", ["userId", "createdAt"]),
```

### New Files to CREATE

#### C1: `convex/actionableActions.ts`
CRUD mutations and queries:
- `list` query — returns all non-dismissed actions for user, ordered by priority then createdAt
- `listByStatus` query — filtered by status
- `create` mutation — validates fields, sets createdAt/updatedAt
- `updateStatus` mutation — transitions status, sets completedAt if completed
- `update` mutation — partial update (title, description, dueDate, priority)
- `dismiss` mutation — sets status to "dismissed"
- `createFromInsight` mutation — takes an `aiInsights` ID, extracts action items, creates actionable actions from them. Each action item becomes its own `actionableAction` record.

#### C2: `src/app/dashboard/actions/page.tsx`
New dashboard page — Kanban-style or list view of actionable actions:
- Filter tabs: All / Proposed / In Progress / Completed
- Each action card shows: title, description, priority badge, due date, status
- Actions: Accept (proposed → accepted), Start (accepted → in-progress), Complete (in-progress → completed), Dismiss
- "AI suggested" badge if `sourceInsightId` is set
- Future: "Push to Calendar" button (greyed out with "Coming soon" tooltip for now)
- Future: "Research" button (Workstream D will enable this)

#### C3: `src/app/dashboard/actions/layout.tsx`
Simple layout wrapper (same pattern as other dashboard pages).

### Files to MODIFY

#### C4: `src/components/layout/Sidebar.tsx`
- Add navigation item: `{ name: 'Actions', href: '/dashboard/actions', Icon: CheckSquare }` (import from `@phosphor-icons/react`)
- Position it after "AI Insights" in the nav array

#### C5: `convex/ai/chatPrompt.ts`
- Add `actionableActions` to `WRITABLE_TABLES` array so the AI can propose creating actions via chat:
```typescript
{
  name: "actionableActions",
  description: "Actionable tasks derived from AI insights or user decisions — tracked through proposal to completion",
  fields: [
    { name: "title", type: "string", required: true },
    { name: "description", type: "string", required: true },
    { name: "priority", type: 'enum: "low" | "medium" | "high"', required: true },
    { name: "dueDate", type: "string (ISO date)", required: false },
    { name: "aiNotes", type: "string", required: false, description: "AI reasoning or context" },
  ],
}
```

#### C6: `convex/chat.ts` — commitIntent handler
- Add an `else if (table === "actionableActions")` branch in commitIntent:
```typescript
} else if (table === "actionableActions") {
  recordId = await ctx.db.insert("actionableActions", {
    userId,
    title: String(data.title ?? "Untitled Action"),
    description: String(data.description ?? ""),
    status: "proposed",
    priority: safeEnum(data.priority, [...PRIORITY_LEVELS], "medium"),
    dueDate: data.dueDate ? String(data.dueDate) : undefined,
    aiNotes: data.aiNotes ? String(data.aiNotes) : undefined,
    createdAt: now,
    updatedAt: now,
  });
}
```

#### C7: `src/app/dashboard/page.tsx`
- In the non-empty dashboard view, add an "Action Items" panel (similar to existing OverviewPanel) that shows top 5 proposed/in-progress actions with accept/start/complete buttons
- Import and use `api.actionableActions.list`

#### C8: `convex/aiInsights.ts` or `src/app/dashboard/ai-insights/page.tsx`
- Add a "Create Actions" button on each insight card that calls `actionableActions.createFromInsight`
- This converts insight action items into trackable actionable actions

### Interface Contract
```typescript
// Workstream D (Research) will call:
// await ctx.db.patch(actionId, { researchResults: markdownString });
// The actions page will render researchResults as expandable markdown.
```

### Verification
```bash
npx next build && npx vitest run
# Manual test:
# 1. Generate an AI insight (or create one manually in Convex dashboard)
# 2. Click "Create Actions" on the insight → verify actions appear in /dashboard/actions
# 3. Chat: "I need to draft a pricing model for my consulting" → verify AI proposes actionableAction intent
# 4. Confirm intent → verify action appears in /dashboard/actions with status "proposed"
# 5. Accept → Start → Complete an action, verify status transitions
```

---

## Workstream D: Research Integration

**Goal:** When a user commits to an action, trigger a research agent that finds relevant examples and best practices.

**⚠️ Dependency: Requires Workstream C's `actionableActions` table to exist.**

### New Files to CREATE

#### D1: `convex/ai/research.ts`
Research agent action:
- `triggerResearch` action:
  1. Takes `actionId` (id of `actionableActions`)
  2. Loads the action's title, description, and the user's soul file for context
  3. Calls Perplexity API (or falls back to OpenRouter with web search tool) with a research prompt:
     ```
     Research the following topic for a business professional:
     Task: {action.title}
     Context: {action.description}
     User background: {soulFile summary}
     
     Find: relevant examples, best practices, templates, pricing benchmarks, case studies.
     Format as markdown with sources.
     ```
  4. Saves results to `actionableActions.researchResults` via patch
  5. Optionally creates a notification (Workstream B) that research is complete

- **API key handling**: Use the user's existing OpenRouter or Google API key. Perplexity requires its own key — store in `userSettings` as `perplexityApiKey` (optional).

#### D2: `src/components/dashboard/ResearchPanel.tsx`
UI component rendered inside action cards:
- Expandable section that shows `researchResults` markdown
- "Research" button that triggers `api.ai.research.triggerResearch`
- Loading state while research is running (poll action status or use optimistic UI)
- "Draft from findings" button — opens chat with pre-filled prompt that includes the research results

### Files to MODIFY

#### D3: `src/app/dashboard/actions/page.tsx` (from Workstream C)
- Add ResearchPanel inside each action card (only for accepted/in-progress actions)
- Show "Research" button if `researchResults` is empty
- Show expandable results if `researchResults` exists

#### D4: `convex/schema.ts`
- Add `perplexityApiKey: v.optional(v.string())` to `userSettings` table
- **Coordinate with Workstream C** — both modify schema.ts

#### D5: `src/app/dashboard/settings/page.tsx`
- Add optional Perplexity API key field in settings
- Label: "Perplexity API Key (optional — enables research agent)"

### Interface Contract
```typescript
// Research results are stored as markdown in actionableActions.researchResults
// The "Draft from findings" button dispatches:
// window.dispatchEvent(new CustomEvent("mnotes:open-chat", {
//   detail: { prompt: `Based on this research, draft a ${action.title}:\n\n${action.researchResults}` }
// }));
```

### Verification
```bash
npx next build && npx vitest run
# Manual test:
# 1. Create an actionable action (e.g., "Draft pricing model for AI consulting")
# 2. Click "Research" button on the action
# 3. Wait for research to complete (check Convex logs)
# 4. Verify research results appear as expandable markdown
# 5. Click "Draft from findings" → verify chat opens with research context
```

---

## Workstream E: PostHog Analytics

**Goal:** Track user behavior and AI usage for product decisions.

### New Files to CREATE

#### E1: `src/lib/analytics.ts`
PostHog wrapper:
```typescript
import posthog from 'posthog-js';

export function initAnalytics(userId: string) {
  if (typeof window === 'undefined') return;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
  });
  posthog.identify(userId);
}

export function track(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}
```

#### E2: `src/lib/analytics.events.ts`
Type-safe event definitions — ensures consistent event names across the codebase.

### Files to MODIFY

#### E3: `src/components/ConvexClientProvider.tsx`
- Call `initAnalytics(userId)` when auth state resolves

#### E4: Various UI files — add `track()` calls:
- `src/components/chat/ChatPanel.tsx` — `track('chat_message_sent')`, `track('chat_panel_opened')`
- `src/components/chat/ConfirmationCard.tsx` — `track('intent_confirmed')`, `track('intent_rejected')`
- `src/app/dashboard/page.tsx` — `track('quick_action_card_clicked', { type })` on QuickActionCards
- `src/components/ui/FeedbackWidget.tsx` — `track('feedback_submitted', { type })`

#### E5: `package.json`
- Add `posthog-js` dependency

#### E6: `.env.local` / `.env.example`
- Add `NEXT_PUBLIC_POSTHOG_KEY`

### Verification
```bash
npm install posthog-js
npx next build && npx vitest run
# Manual test:
# 1. Open app, check browser network tab for PostHog calls
# 2. Send a chat message, verify 'chat_message_sent' event
# 3. Check PostHog dashboard for events
```

---

## Remaining Bugs & Debugging Checklist

These are **not yet verified** and should be checked as part of Workstream A:

| # | Issue | How to Verify | Status |
|---|-------|--------------|--------|
| 1 | Chat doesn't work after onboarding skip (no API key) | Sign up → skip API key setup → open chat → send message → check error | ❓ Unverified |
| 2 | Dashboard not updating after commitIntent | Confirm an intent in chat → immediately check dashboard page → data should appear | ❓ Unverified — Convex reactivity should handle this automatically, but verify |
| 3 | Google AI Studio API key handling | Set provider to "google" → add Google AI key → send chat → verify response | ❓ Unverified |
| 4 | Model routing: empty model string | Clear model field in settings → send chat → should fall back to default | ❓ Unverified |
| 5 | Soul file evolution timing | Send 5 messages → check Convex logs for `soulFileEvolve` trigger | ❓ Unverified |

---

## How to Pick Up a Workstream

1. Read this entire document first
2. Read `docs/DESIGN_SYSTEM.md` for UI conventions
3. Read `convex/schema.ts` for current schema
4. Check that no one else has started modifying your workstream's files
5. Create all NEW files first, then modify EXISTING files
6. Run `npx next build && npx vitest run` after every significant change
7. Update this document's verification status when done

## Build Commands
```bash
npx next build          # TypeScript compilation + Next.js build
npx vitest run          # Run all 71 tests
npx convex dev          # Start Convex dev server (needed for backend changes)
npx next dev --turbo    # Start Next.js dev server
```

---

*Last updated: February 14, 2026*
