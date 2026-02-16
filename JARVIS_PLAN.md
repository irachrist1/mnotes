# Jarvis — Full Rewrite Plan

## What We're Building
A personal AI agent ("Jarvis") powered by the Anthropic Agent SDK, accessible from any device (phone, web) with real-time streaming, memory, and deep integrations (Gmail, Calendar, Outlook, GitHub).

---

## Critical Finding: "Sign In With Claude Subscription"

Anthropic's docs explicitly state third-party apps **cannot** offer claude.ai login. But here's how it actually works (from the video):

- You run `claude` CLI on your machine → log in once → Agent SDK auto-uses that session
- No API key needed when agent server runs locally with Claude Code installed
- On VPS: set `ANTHROPIC_API_KEY` for standard API billing
- The **frontend** auth stays as email/password (Convex). The **server** handles Claude auth transparently.

So: the agent server auto-detects whether to use subscription (local Claude session) or API key. Users see a status in Settings showing which mode is active.

---

## Architecture Overview

```
Phone/Browser  ──HTTP──►  Next.js (Vercel)  ──SSE proxy──►  Agent Server (VPS/local)
                                │                                     │
                                └──── Convex (real-time DB) ◄────────┘
                                      (messages, memory, sessions)
```

### Three layers:
1. **Agent Server** — Express + `@anthropic-ai/claude-agent-sdk`, runs on VPS or local machine
2. **Next.js Frontend** — Chat-first UI, accessible from any device
3. **Convex Backend** — Real-time message store, memory, sessions, auth

---

## Project Structure

```
mnotes/  (renamed conceptually to "Jarvis" in UI)
├── agent-server/                 ← NEW: Agent SDK server
│   ├── src/
│   │   ├── index.ts              ← Express + SSE endpoint
│   │   ├── agent.ts              ← Agent SDK wrapper, auth detection
│   │   ├── memory.ts             ← Memory tool implementations
│   │   └── mcp/
│   │       ├── gmail.ts          ← Gmail MCP server
│   │       ├── calendar.ts       ← Google Calendar MCP
│   │       ├── outlook.ts        ← Outlook/MS Graph MCP
│   │       └── github.ts         ← GitHub MCP
│   ├── skills/                   ← Agent SDK skills (.md files)
│   │   ├── memory/skill.md
│   │   ├── gmail/skill.md
│   │   ├── calendar/skill.md
│   │   ├── outlook/skill.md
│   │   └── github/skill.md
│   ├── package.json
│   └── tsconfig.json
│
├── src/                          ← Next.js frontend (full rewrite)
│   ├── app/
│   │   ├── sign-in/              ← Keep Convex email/password auth
│   │   ├── dashboard/
│   │   │   ├── page.tsx          ← Chat-first Jarvis dashboard
│   │   │   ├── memory/page.tsx   ← Memory viewer
│   │   │   └── settings/page.tsx ← API keys, integrations
│   │   └── api/
│   │       └── agent/route.ts    ← SSE proxy to agent server
│   └── components/
│       ├── chat/                 ← Full rewrite: streaming chat
│       │   ├── JarvisChat.tsx    ← Main chat panel
│       │   ├── MessageStream.tsx ← Real-time message rendering
│       │   └── ToolCallCard.tsx  ← Tool use visualization
│       ├── memory/
│       │   └── MemoryViewer.tsx  ← Browse/search memories
│       └── layout/
│           └── JarvisShell.tsx   ← Simplified shell (no sidebar clutter)
│
└── convex/                       ← Simplified Convex backend
    ├── schema.ts                 ← Rewritten: ~8 tables
    ├── messages.ts               ← Chat message CRUD
    ├── sessions.ts               ← Agent session store
    ├── memory.ts                 ← Memory CRUD (3 tiers)
    ├── settings.ts               ← User settings (API keys, provider)
    ├── connectors/               ← Keep OAuth token management
    └── auth.ts                   ← Unchanged
```

---

## New Convex Schema (~8 tables, down from 19)

### Keep (modified):
- `soulFiles` → renamed concept to "Jarvis Soul" (user profile/memory doc)
- `chatThreads` + `chatMessages` → UI message rendering
- `userSettings` → add `agentServerUrl`, `claudeAuthMode`
- `connectorTokens` + `connectorAuthSessions` → OAuth (Gmail, Calendar, Outlook, GitHub)

### New:
- `agentSessions` → `{ userId, threadId, agentSessionId, model, createdAt, updatedAt }`
- `memoryEntries` → `{ userId, kind: "persistent"|"archival"|"session", category, content, importance, createdAt }`

### Remove:
- incomeStreams, ideas, mentorshipSessions, aiInsights (vector), savedInsights
- aiPromptCache, notifications, feedback, proactiveSuggestions
- tasks, taskEvents, agentFiles (replaced by agent server)

---

## Agent Server API

```
POST /api/chat          ← Start/continue conversation (SSE response)
  Body: { threadId, message, sessionId?, userId }
  Response: SSE stream of agent messages

GET  /api/status        ← Auth mode status (subscription | apikey | gemini)
GET  /api/health        ← Server health check

POST /api/memory        ← Save memory entry
GET  /api/memory        ← List/search memory entries
```

### Auth Detection (agent.ts)
```typescript
// Priority order:
// 1. ANTHROPIC_API_KEY set → API key mode
// 2. Claude Code session exists (~/.claude/credentials.json) → subscription mode
// 3. GOOGLE_AI_KEY set → Gemini Flash mode
// 4. Error: no auth configured
```

---

## Agent SDK Tools & Skills

### Built-in (from SDK):
- `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep`
- `WebSearch`, `WebFetch`

### Custom MCP Tools:
- `memory_save` — save fact/preference/note
- `memory_search` — semantic search memories
- `memory_list` — list by category
- `gmail_list_recent` — read emails
- `gmail_search` — search inbox
- `gmail_send` — send email (approval-gated)
- `calendar_list_events` — upcoming events
- `calendar_create_event` — create event (approval-gated)
- `outlook_list_emails` — Outlook inbox
- `outlook_send` — send Outlook email (approval-gated)
- `github_list_prs` — open PRs
- `github_list_issues` — issues
- `github_create_issue` — create issue (approval-gated)

### Skills (auto-discovered, loaded on demand):
- `memory` — when/how to save memories proactively
- `gmail` — email management patterns
- `calendar` — scheduling patterns
- `outlook` — Outlook-specific patterns
- `github` — developer workflow patterns

---

## Frontend: Jarvis Chat UI

### Design Principles:
- Full-screen chat on mobile
- Tool calls shown as expandable cards in the stream
- Memory saves appear as subtle "remembered" chips
- Thread history in sidebar (collapsible)
- No income/ideas/mentorship tracking

### Streaming:
- Agent Server → SSE → Next.js API Route → Browser SSE
- Real-time tool call display (show when agent reads email, searches web, etc.)
- Typing indicator for thinking phases

---

## Implementation Phases

### Phase 1: Branch + Setup (start here)
- [ ] Create branch `feature/jarvis-rewrite`
- [ ] Create `agent-server/` with package.json + tsconfig
- [ ] Install `@anthropic-ai/claude-agent-sdk`

### Phase 2: Convex Schema Rewrite
- [ ] Rewrite `convex/schema.ts` (8 tables)
- [ ] Write `convex/sessions.ts` (session CRUD)
- [ ] Write `convex/memory.ts` (memory CRUD)
- [ ] Update `convex/settings.ts`

### Phase 3: Agent Server Core
- [ ] Express server with SSE endpoint
- [ ] Agent SDK wrapper with auth detection
- [ ] Session persistence (save/load session IDs)
- [ ] Convex client integration (store messages)

### Phase 4: Memory System
- [ ] Three-tier memory: persistent, archival, session
- [ ] Memory MCP tools
- [ ] Proactive memory save (agent instructions in system prompt)

### Phase 5: Skills
- [ ] Create `agent-server/skills/` folder structure
- [ ] Write skill.md files (memory, gmail, calendar, outlook, github)

### Phase 6: MCP Integrations
- [ ] Gmail MCP (list, search, send — uses existing OAuth tokens from Convex)
- [ ] Google Calendar MCP (list, create)
- [ ] Outlook MCP (Microsoft Graph API)
- [ ] GitHub MCP (PRs, issues, create)

### Phase 7: Frontend Rewrite
- [ ] New `JarvisShell.tsx` (simplified layout)
- [ ] New `JarvisChat.tsx` (SSE streaming chat)
- [ ] `ToolCallCard.tsx` (tool use visualization)
- [ ] Thread list sidebar
- [ ] Rewrite dashboard/page.tsx

### Phase 8: Settings + Auth Display
- [ ] Settings page: API key input, agent server URL, auth mode display
- [ ] Connector setup: Gmail, Calendar, Outlook, GitHub OAuth

### Phase 9: Polish
- [ ] Mobile optimizations
- [ ] Error handling
- [ ] Loading states
- [ ] Memory viewer page

---

## Environment Variables

### Agent Server (.env):
```
ANTHROPIC_API_KEY=          # Optional: API key mode
GOOGLE_AI_KEY=              # Optional: Gemini fallback
CONVEX_URL=                 # Convex deployment URL
CONVEX_DEPLOY_KEY=          # For server-side Convex mutations
AGENT_SERVER_SECRET=        # Shared secret for Next.js → Agent Server auth
PORT=3001
```

### Next.js (.env.local):
```
NEXT_PUBLIC_CONVEX_URL=
AGENT_SERVER_URL=http://localhost:3001   # Or VPS URL
AGENT_SERVER_SECRET=
```

---

## Notes on Claude Subscription

When running the agent server locally:
1. Run `claude` CLI and log in once
2. Agent SDK auto-detects `~/.claude/credentials.json`
3. No API key needed — uses your subscription quota
4. Status page shows "Subscription mode active"

When on VPS:
1. Set `ANTHROPIC_API_KEY` in agent server env
2. Standard API billing applies
3. Status page shows "API key mode"

Both modes: frontend auth stays email/password via Convex. The Claude subscription/API key is purely server-side.
