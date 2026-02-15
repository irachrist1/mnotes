# MNotes (Jarvis) — Developer Onboarding Guide

**Last updated: February 15, 2026**
**Purpose: Complete technical documentation for onboarding new developers/agents to this codebase.**

---

## 1. Project Overview

MNotes is a **chat-first personal AI assistant** that learns about a user's business and life through conversation, automatically organizes data into structured records, and proactively serves insights. The vision is **J.A.R.V.I.S. from Avengers** — an AI that observes, anticipates, and executes on behalf of the user.

**Core philosophy:**
- **Memory-first**: AI maintains a "Soul File" (markdown) — its persistent memory about the user
- **Action-first**: AI *does* things ("I've filed these 3 ideas for you"), not just suggests
- **Proactive**: AI nudges the user ("You haven't logged a session in 3 days")

**Live URL:** https://mnotes-omega.vercel.app

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Backend | Convex (real-time, serverless) |
| Auth | `@convex-dev/auth` with Password provider |
| Styling | Tailwind CSS 3 (dark mode via `media`), Inter font |
| Animation | Framer Motion (lazy-loaded, dashboard only) |
| Charts | Chart.js via react-chartjs-2 (lazy-loaded, analytics only) |
| AI | Google Generative AI / OpenRouter / Anthropic (user-configured API keys) |
| Analytics | PostHog (client + server-side) |
| Hosting | Vercel |
| CI | GitHub Actions (lint → test → build → deploy Convex on main) |

**Path aliases:** `@/*` → `./src/*`, `@convex/*` → `./convex/*`

---

## 3. Architecture & Data Flow

### Provider Stack (root layout)
```
<html>
  <body>
    ConvexAuthNextjsServerProvider
      ConvexClientProvider
        PostHogProvider
          {children}
```

### Route Structure
```
/                     → Landing page (public)
/sign-in              → Auth page (lightweight, no animation libs)
/onboarding           → Soul file creation (conversational)
/dashboard            → Main app shell
  /dashboard          → Home (nudge cards, stats, activity feed, inline chat)
  /dashboard/data     → Income + Ideas + Mentorship (combined zone)
  /dashboard/actions  → Tasks page (agent execution UI)
  /dashboard/intelligence → AI Insights + Analytics (combined zone)
  /dashboard/settings → User settings (AI provider, model, API key)
```

### Key Layout Files
- **Middleware** (`src/middleware.ts`): Protects `/dashboard/*` and `/onboarding/*`
- **Dashboard layout** (`src/app/dashboard/layout.tsx`): Server component, `force-dynamic`
- **Client layout** (`src/app/dashboard/client-layout.tsx`): Wraps in `DashboardShell`, checks `useConvexAvailable()`
- **DashboardShell** (`src/components/layout/DashboardShell.tsx`): Lazy-loads Sidebar, CommandPalette, ChatPanel

---

## 4. Database Schema (Complete)

### Domain Tables (User data)

**incomeStreams** — Revenue sources
| Field | Type | Notes |
|-------|------|-------|
| userId | string | Index: `by_user` |
| name | string | |
| category | "consulting" \| "employment" \| "content" \| "product" \| "project-based" | |
| status | "active" \| "developing" \| "planned" \| "paused" | |
| monthlyRevenue | number | |
| timeInvestment | string | Hours/week |
| growthRate | number | |
| notes | string | |
| clientInfo | string | |
| createdAt, updatedAt | number | |

**ideas** — Business ideas
| Field | Type | Notes |
|-------|------|-------|
| userId | string | |
| title, description | string | |
| category | string | |
| stage | "raw-thought" \| "researching" \| "validating" \| "developing" \| "testing" \| "launched" | |
| potentialRevenue | number | |
| implementationComplexity | string | |
| timeToMarket | string | |
| requiredSkills | string[] | |
| marketSize, competitionLevel, aiRelevance | string | |
| nextSteps, tags | string[] | |
| createdDate, lastUpdated | number | |

**mentorshipSessions** — Mentorship logs
| Field | Type | Notes |
|-------|------|-------|
| userId | string | |
| mentorName | string | |
| date | string | |
| duration | number | Minutes |
| sessionType | "giving" \| "receiving" | |
| topics, keyInsights | string[] | |
| actionItems | array | `{task, priority, completed, dueDate}` |
| rating | number | 1-10 |
| notes | string | |

**tasks** — To-do items + agent execution state
| Field | Type | Notes |
|-------|------|-------|
| userId | string | |
| title | string | |
| note | string | Markdown body |
| sourceType | "manual" \| "ai-insight" \| "chat" | |
| sourceId | string? | |
| dueDate | string? | |
| priority | string? | |
| done | boolean | |
| executionType | "draft" | Only type currently |
| executionPayload | object? | `{kind, prompt}` |
| lastExecutionStatus/At/Error | varies | |
| agentStatus | "queued" \| "running" \| "done" \| "failed" | |
| agentProgress | number | 0-100 |
| agentPhase | string | Current phase label |
| agentPlan | string[] | Step labels |
| agentSummary | string | |
| agentResult | string | Markdown output |
| agentStartedAt, agentCompletedAt | number? | |
| agentError | string? | |
| agentState | string? | JSON continuation state for pause/resume |

**taskEvents** — Agent progress events (Deep Research-style)
| Field | Type | Notes |
|-------|------|-------|
| userId | string | |
| taskId | Id<"tasks"> | |
| kind | "status" \| "progress" \| "tool" \| "question" \| "approval-request" \| "note" \| "result" \| "error" | |
| title | string | |
| detail | string? | |
| progress | number? | 0-100 |
| toolName/toolInput/toolOutput | string? | For tool visualization |
| options/answered/answer | varies | For mid-run questions |
| approvalAction/approvalParams/approved | varies | For future approvals |
| createdAt | number | |

### AI & Memory Tables

**soulFiles** — AI's persistent memory about user
| Field | Type | Notes |
|-------|------|-------|
| userId | string | One per user |
| content | string | Markdown with fixed sections |
| version | number | Auto-incremented on evolve |
| updatedAt | number | |

**chatThreads** / **chatMessages** — Conversation history
- Threads: `userId, title, createdAt, lastMessageAt`
- Messages: `userId, threadId, role (user/assistant), content, intent, intentStatus (proposed/confirmed/rejected/committed), createdAt`

**aiInsights** — Generated insights (weekly digests, etc.)
- `userId, type, title, body, actionItems[], priority, confidence, model, status (unread/read/dismissed), contentHash, expiresAt, createdAt`

**savedInsights** — Pinned insights with vector embeddings
- Same as aiInsights + `embedding[] (1536-dim), embeddingModel, pinned, archived, searchText, keywords[]`
- Indexes: full-text on `searchText`, vector index on `embedding`

**aiPromptCache** — Response cache
- `userId, scope, cacheKey (SHA256), provider, model, responseText, createdAt, expiresAt`
- TTL: 2 minutes for chat

**notifications** — User notifications
- `userId, type (goal-check-in/stale-idea/overdue-action/pattern-detected/milestone/agent-task), title, body, actionUrl, read, dismissed, createdAt`

**userSettings** — AI configuration
- `userId, aiProvider (openrouter/google/anthropic), aiModel, openrouterApiKey, googleApiKey, anthropicApiKey, updatedAt`

**feedback** — User feedback
- `userId, type (bug/feature/general), message, page, createdAt`

---

## 5. Authentication Flow

### How It Works
1. **Provider**: `@convex-dev/auth` with Password provider only (no social auth)
2. **JWT format**: Subject is `"userId|sessionId"` — `getUserId(ctx)` in `convex/lib/auth.ts` extracts the stable userId
3. **Fallback**: Returns `"default"` when unauthenticated
4. **Data isolation**: Every table has a `userId` field + `by_user` index. All queries/mutations call `getUserId(ctx)` first

### Route Protection
- Middleware redirects unauthenticated users from `/dashboard/*` → `/sign-in`
- Middleware redirects authenticated users away from `/sign-in`
- Dashboard checks `useConvexAvailable()` before rendering Convex hooks
- Onboarding check: dashboard redirects to `/onboarding` if `soulFile.get` returns null

---

## 6. AI System — Complete Prompt Inventory

### 6.1 Chat (`convex/ai/chatSend.ts` + `chatPrompt.ts`)

**Flow:**
1. `send()` → validates settings → saves user message → saves "Thinking..." placeholder → schedules async
2. `generateReplyInternal()` → loads soul file + domain data + recent messages → vector-searches savedInsights (top 4, score ≥0.15) → calls AI → patches message → schedules soul evolve every 5 messages

**System Prompt** (`buildSystemPrompt()`):
- Identity: "You are {name}, {userName}'s personal AI assistant"
- Soul file injected as context
- Schema description of writable tables (incomeStreams, ideas, mentorshipSessions, tasks)
- Current data summary (revenue, ideas by stage, mentorship)
- Recent conversation turns (last 6)
- Core instructions: "Do, don't explain", "Be resourceful", "Have opinions"
- Temperature: 0.7

**Intent System**: AI proposes data operations in JSON blocks → user confirms/rejects → system commits

### 6.2 Onboarding (`convex/ai/onboardSend.ts` + `onboardPrompt.ts`)

**Flow:** Conversational soul file generation for first-time users

**Conversation Design:**
1. **Opening** (<3 sentences): "I'm an AI that learns, organizes, acts. What are you working on right now?"
2. **After 1st answer**: Extract 2-4 tasks in ```tasks``` block
3. **After 2nd answer**: Ask for goals/target outcomes
4. **After 3rd answer**: Generate soul file in ```soulfile``` block

**Output Parsing**: `parseSoulFileFromResponse()` extracts soul file, tasks array, and detected assistant name

### 6.3 Soul File Evolution (`convex/ai/soulFileEvolve.ts`)

**Trigger:** Every 5 user messages (scheduled by chatSend)

**System Prompt:**
- Maintenance mindset: update all sections
- Aggressive capture: "if in doubt, write it down"
- Temperature: 0.4 (conservative)
- Max tokens: 2048

**Soul File Sections:** Identity, Operating Principles, Goals, Preferences, Patterns, Notes

### 6.4 Weekly Digest (`convex/ai/weeklyDigest.ts`)

**Trigger:** Cron job every Sunday 8:00 UTC

**System Prompt:**
- Business advisor role
- References actual user data (numbers, names, goals)
- Temperature: 0.5
- Output: JSON `{ title, body, actionItems }`
- Each action item becomes clickable → spawns agent task

**Safety:** Silently skips users without API keys or zero data

### 6.5 Task Agent (`convex/ai/taskAgent.ts`)

**Trigger:** User clicks "Run Jarvis" on a task

**State Machine:**
```
Queued (3%) → Planning (12%) → Plan ready (20%) → Step 1..N (20-90%) → Finalizing (95%) → Ready/Failed (100%)
```

**System Prompt:**
- Jarvis agent rules: use tools, never fabricate, ask clarifying questions if ambiguous
- Output is JSON per phase (plan JSON, step JSON, final JSON)

**Progress tracked via:** taskEvents table + agentProgress/Phase fields

**Tools (P2 core):**
- Implemented in `convex/ai/agentTools.ts`
- Data tools: soul file, tasks, income, ideas, mentorship, saved insights
- `ask_user` tool can pause execution and resume on answer
- `create_file` tool persists draft documents in `agentFiles`
- Write tools:
  - `create_task` / `update_task` (creates/updates tasks)
  - `send_notification` (in-app notification)
- `request_approval` tool pauses for Approve/Deny (used for external/irreversible actions)
- Web tools:
  - `web_search` (uses Jina by default; can use Tavily or Perplexity when `userSettings.searchProvider` + `searchApiKey` is configured; requires approval per task)
  - `read_url` (Jina Reader; requires approval per task)

**Implementation details:** see `docs/AGENTIC_CORE.md` and `docs/AGENT_PLATFORM_PRINCIPLES.md`

### 6.6 Task Execution (`convex/ai/taskExecute.ts`)

**Purpose:** Draft generator for specific task types

**Execution Types:** email, outline, checklist

**Output:** Appends generated draft to `task.note` under `## Draft` section

### 6.7 Prompt Caching

- SHA256 hash of (provider, model, systemPrompt, conversationMessages)
- 2-minute TTL for chat
- Avoids duplicate API calls for identical inputs

---

## 7. What Works (Verified)

### Fully Working
| Feature | Files | Notes |
|---------|-------|-------|
| Chat system | `convex/chat.ts`, `convex/ai/chatSend.ts`, `ChatPanel.tsx` | Async generation, instant placeholder, typing animation |
| Intent system | `chatPrompt.ts`, `ChatPanel.tsx`, `ConfirmationCard.tsx` | AI proposes, user confirms, system commits |
| Soul file | `convex/soulFiles.ts`, `soulFileEvolve.ts` | Auto-evolves every 5 messages |
| Onboarding | `src/app/onboarding/page.tsx`, `onboardSend.ts` | Live preview panel, task extraction |
| Task agent | `taskAgent.ts`, `TasksContent.tsx` | Full pipeline: plan → draft → result |
| Task filtering | `TasksContent.tsx` | All/Running/Done/Failed tabs with counts |
| Nudge cards | `src/app/dashboard/page.tsx` | Overdue tasks, digest alerts, notifications |
| Weekly digest | `weeklyDigest.ts` | Cron-driven, per-user, with action items |
| Insight → Agent | `intelligence/page.tsx` | Click action items to spawn agent tasks |
| Command palette | `convex/commandPalette.ts` | Cross-entity search |
| Notification bell | `NotificationBell.tsx` | Real-time, mark as read |
| Settings page | `settings/page.tsx` | Provider, model, API key management |
| Income CRUD | `income/page.tsx` via data zone | Full create/edit/delete |
| Ideas CRUD | `ideas/page.tsx` via data zone | Full create/edit/delete with stages |
| Mentorship CRUD | `mentorship/page.tsx` via data zone | Full create/edit/delete |
| Landing page | `src/app/page.tsx` | Agent preview widget, waitlist CTA |
| Feedback widget | `FeedbackWidget.tsx` | Bug/feature/general with PostHog tracking |

### Partially Working / Known Issues
| Issue | Details | Priority |
|-------|---------|----------|
| Goals tracking | Goals are parsed from soul file, not a dedicated table. Progress bars on dashboard are static/stale | Medium |
| Nudge card deep-links | Weekly digest nudge navigates to intelligence page but doesn't auto-open the insight modal | Medium |
| Activity feed items | "What I've done recently" items don't open detail views when clicked | Low |
| Agent capabilities | Agent can only generate text (plans, drafts). Cannot search the web, create files, connect to external tools, or browse | High (roadmap P2) |

---

## 8. PostHog Analytics — Complete Event Map

### Setup
- **Client**: `posthog-js` initialized in `PostHogProvider.tsx` (lazy, SSR-safe)
- **Server**: `posthog-node` called from `convex/lib/posthog.ts` (fire-and-forget)
- **Config**: `person_profiles: "identified_only"`, `capture_pageview: false` (manual SPA capture)

### Client-Side Events

| Event | Properties | Trigger Location |
|-------|-----------|-----------------|
| User identified | userId | `client-layout.tsx` on load |
| `$pageview` | `$current_url`, `$pathname` | Every route change |
| `chat_message_sent` | `threadId` | `ChatPanel.tsx` |
| `chat_intent_committed` | `messageId` | `ChatPanel.tsx` |
| `chat_intent_rejected` | `messageId` | `ChatPanel.tsx` |
| `onboarding_soul_confirmed` | `taskCount` | `onboarding/page.tsx` |
| `onboarding_settings_saved` | `provider`, `model` | `onboarding/page.tsx` |
| `onboarding_skipped` | — | `onboarding/page.tsx` |
| `settings_saved` | `provider`, `model` | `settings/page.tsx` |
| `income_stream_created` | — | `income/page.tsx` |
| `income_stream_updated` | `streamId` | `income/page.tsx` |
| `idea_created` | — | `ideas/page.tsx` |
| `idea_updated` | `ideaId` | `ideas/page.tsx` |
| `mentorship_session_created` | — | `mentorship/page.tsx` |
| `mentorship_session_updated` | `sessionId` | `mentorship/page.tsx` |
| `task_created` | — | `TasksContent.tsx` |
| `task_updated` | `taskId` | `TasksContent.tsx` |
| `task_agent_restarted` | `taskId` | `TasksContent.tsx` |
| `feedback_submitted` | `type`, `page` | `FeedbackWidget.tsx` |

### Server-Side AI Events (`$ai_generation`)

| ai_feature | Trigger | File |
|------------|---------|------|
| `"chat"` | Every chat message | `chatSend.ts` |
| `"onboarding"` | Greeting + soul file generation | `onboardSend.ts` |
| `"soul-evolve"` | Every 5 user messages | `soulFileEvolve.ts` |
| `"weekly-digest"` | Sunday 8:00 UTC cron | `weeklyDigest.ts` |
| `"task-agent"` | User runs agent on task | `taskAgent.ts` |
| `"task-execute"` | Draft execution | `taskExecute.ts` |
| `"generate"` | Generic generation | `generate.ts` |
| `"embed"` | Embedding generation | (embedding action) |

**Properties per AI event:** `$ai_model`, `$ai_provider`, `$ai_latency`, `$ai_input`, `$ai_output_choices`, `$ai_input_tokens` (OpenRouter only), `$ai_output_tokens` (OpenRouter only), `$ai_total_cost_usd` (OpenRouter only), `ai_cached`

### Environment Variables for PostHog
| Variable | Side | Required |
|----------|------|----------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Client | For tracking |
| `NEXT_PUBLIC_POSTHOG_HOST` | Client | Optional (defaults to us.i.posthog.com) |
| `POSTHOG_API_KEY` | Server (Convex) | For AI tracking |
| `POSTHOG_HOST` | Server (Convex) | Optional |

---

## 9. Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |
| `CONVEX_DEPLOYMENT` | Build only | For `convex codegen` (falls back gracefully) |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | Client-side analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | Defaults to us.i.posthog.com |
| `POSTHOG_API_KEY` | No | Server-side AI analytics |
| `POSTHOG_HOST` | No | Server-side PostHog host |

**AI API keys** are per-user, stored in Convex `userSettings` table (masked before reaching client).

---

## 10. Development Commands

```bash
# Run both in separate terminals
npx convex dev          # Convex backend (hot-reloads schema/functions)
npm run dev             # Next.js at localhost:3000

# Build & deploy
npm run build           # convex codegen (skippable) + next build --webpack
npm run lint            # ESLint

# Tests (Vitest + jsdom + React Testing Library)
npm test                # All tests once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Locked-down Windows note:
# In some environments Vitest/Vite can fail with `spawn EPERM` when attempting to run OS commands.
# Typecheck still runs with:
.\node_modules\.bin\tsc.cmd -p tsconfig.json --noEmit

# Deploy
npx vercel --prod       # Deploy to Vercel (ensure no build errors)
```

---

## 11. Performance Rules (Non-Negotiable)

1. **Never import heavy libraries globally** — Chart.js, react-markdown, Framer Motion must use `next/dynamic` with `ssr: false`
2. **Sign-in page stays lightweight** — No animation libraries, CSS transitions only
3. **Mobile inputs use `text-base`** (16px) to prevent iOS Safari auto-zoom
4. **Lazy loading patterns exist** — Use `LazyCharts.tsx` and `LazyMarkdownMessage.tsx` instead of direct imports
5. **Chat must feel instant** — Placeholder "Thinking..." saved synchronously, async generation patches in-place
6. **Viewport locked** — `maximumScale: 1` in root layout

---

## 12. What's Next (Roadmap Summary)

See `docs/JARVIS_ROADMAP.md` for the full prioritized roadmap. Key next items:

### P2: Agentic Core (TOP PRIORITY)
The current agent can only generate text. The next phase is making it actually DO things:
- Multi-step execution (search → analyze → draft → deliver)
- Tool connections (GitHub, email, calendar, browser)
- Mid-execution user questions (agent pauses to ask for clarification)
- Rich output formats (tables, checklists, docs — not just markdown)

### P3-P8: Future Phases
- Connector framework (OAuth-based tool integrations)
- Proactive loops (AI initiates without being asked)
- Mobile polish (native feel)
- Jarvis status indicator (sidebar shows what AI is doing)

Shipped connector docs:

- Google OAuth (Gmail + Calendar): `docs/CONNECTORS_GOOGLE_OAUTH.md`
- GitHub OAuth: `docs/CONNECTORS_GITHUB_OAUTH.md`

---

## 13. Key Files Quick Reference

| Purpose | File(s) |
|---------|---------|
| Schema (all tables) | `convex/schema.ts` |
| Auth helper | `convex/lib/auth.ts` |
| Chat AI logic | `convex/ai/chatSend.ts`, `convex/ai/chatPrompt.ts` |
| Soul file evolve | `convex/ai/soulFileEvolve.ts` |
| Task agent | `convex/ai/taskAgent.ts` |
| Weekly digest | `convex/ai/weeklyDigest.ts` |
| Onboarding AI | `convex/ai/onboardSend.ts`, `convex/ai/onboardPrompt.ts` |
| Dashboard home | `src/app/dashboard/page.tsx` |
| Chat UI | `src/components/chat/ChatPanel.tsx` |
| Task UI | `src/components/dashboard/TasksContent.tsx` |
| Dashboard shell | `src/components/layout/DashboardShell.tsx` |
| Analytics wrapper | `src/lib/analytics.ts` |
| PostHog server | `convex/lib/posthog.ts` |
| Validation | `convex/lib/validate.ts` |
| AI models list | `src/lib/aiModels.ts` |
| Connectors (OAuth) | `convex/connectors/*`, `convex/http.ts`, `docs/CONNECTORS_GOOGLE_OAUTH.md` |
| Shipping log | `docs/SHIPPING_LOG.md` |
| Full roadmap | `docs/JARVIS_ROADMAP.md` |
| This doc | `docs/DEVELOPER_ONBOARDING.md` |
