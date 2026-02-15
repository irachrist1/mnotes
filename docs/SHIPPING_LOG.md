# Shipping Log

Tracks every major feature shipped toward the Jarvis vision. Updated on each ship.

---

## P0 — Foundation Hardening

### P0.1: Three Zones Merge + Navigation Fix
- **Status:** ✅ Shipped
- **Goal:** 4-item sidebar, 3 consolidated zones, all deep-links correct
- **Shipped:** 2026-02-14
- **Changes:**
  - Fixed 4 broken deep-links in `convex/commandPalette.ts` (ideas, mentorship, income, ai-insights → new zone routes)
  - Fixed 4 actionUrl routes in `convex/ai/dailyNotifications.ts`
  - Fixed saved insight route in `convex/savedInsights.ts`
  - Fixed 2 empty-state links in `src/app/dashboard/analytics/page.tsx`
  - Added redirect stubs on all 5 old route pages (income, ideas, mentorship, ai-insights, analytics) so bookmarks/links don't break

### P0.2: Kill actionableActions
- **Status:** ✅ Shipped
- **Goal:** One task model (tasks table only), zero confusion
- **Shipped:** 2026-02-14
- **Changes:**
  - Removed `actionableActions` table from `convex/schema.ts`
  - Removed `actionableActions` branch from `convex/chat.ts` commitIntent
  - Deleted `convex/actionableActions.ts` (full CRUD file)
  - Deleted `convex/ai/research.ts` (only used by actionableActions)
  - Deleted `src/components/dashboard/ResearchPanel.tsx` (dead import)

### P0.3: Chat Instant Feel
- **Status:** ✅ Shipped
- **Goal:** Placeholder in <100ms, typing animation, in-place upgrade
- **Shipped:** 2026-02-14
- **Changes:**
  - Verified placeholder pattern already correct in `convex/ai/chatSend.ts` (saves "Thinking..." at line 62, schedules async at line 70, returns immediately at line 77)
  - Added pulsing dot typing animation in `src/components/chat/ChatPanel.tsx` for the "Thinking..." placeholder — three staggered dots with `animate-pulse`

### P0.4: Onboarding Populates Dashboard
- **Status:** ✅ Shipped
- **Goal:** Two-column onboarding: chat left, live dashboard right. Dashboard never empty after boot.
- **Shipped:** 2026-02-14
- **Changes:**
  - Rewrote `convex/ai/onboardPrompt.ts` — work-first conversation flow, AI extracts tasks via ```tasks blocks, conversation follows Q1=work → Q2=follow-up → Q3=goals
  - Updated `parseSoulFileFromResponse` to extract tasks array alongside soul file
  - Updated `convex/ai/onboardSend.ts` return type to include `tasks: string[]`
  - Added `tasks.createFromOnboarding` mutation in `convex/tasks.ts` (batch-creates up to 10 tasks)
  - Enhanced `src/app/onboarding/page.tsx`:
    - Tracks extracted tasks and goals in state
    - Desktop live preview panel (right column) shows tasks, goals, and memory status building in real-time
    - Tasks are created on soul file confirmation via `createFromOnboarding` mutation
    - AnimatePresence for smooth task additions

### P0.5: Nudge Card Row
- **Status:** ✅ Shipped
- **Goal:** Top of dashboard shows Jarvis-generated interactive cards (overdue tasks, digest, stale ideas)
- **Shipped:** 2026-02-14
- **Changes:**
  - Added `tasks.listOverdue` query in `convex/tasks.ts` (finds undone tasks past due date)
  - Enhanced nudge card row in `src/app/dashboard/page.tsx`:
    - Client-side overdue task nudges with red tone and "Mark done" action buttons
    - Specific icons per notification type (Clock, AlertTriangle, CheckCircle2)
    - `actions` prop on NudgeCard for inline action buttons
    - Proper horizontal scroll with `shrink-0`

---

## P1 — Proactive Loops + Agentic Demo

### P1.1: Agent Task Execution (Draft type)
- **Status:** ✅ Shipped (pre-existing + enhanced)
- **Goal:** "Run Jarvis" button on draft tasks, live progress, inline result
- **Shipped:** 2026-02-14
- **Changes:**
  - Discovered full agent pipeline already implemented:
    - `convex/ai/taskAgent.ts` — start action, runInternal with 5-phase execution, fail helper
    - `src/components/dashboard/TasksContent.tsx` — progress bars, plan steps, event log, result display, re-run button
  - Added "Copy to clipboard" button on agent output in `TasksContent.tsx`

### P1.2: Agent Activity Panel UX Overhaul
- **Status:** ✅ Shipped
- **Goal:** Wider panel, fix alignment, fix close bug, fix re-run pill, add cancel
- **Shipped:** 2026-02-14
- **Changes:**
  - SlideOver panel widened from `max-w-lg` to `max-w-2xl` for agent activity
  - Fixed close button double-click bug (switched to `onMouseDown`, `AnimatePresence mode="wait"`)
  - Fixed backdrop click using `onMouseDown` instead of `onClick`
  - Refactored agent activity header: title no longer truncated, status/re-run on separate row
  - Re-run button disabled while agent is running (shows spinning icon + "Running...")

### P1.3: Task Status Filtering + Visual Differentiation
- **Status:** ✅ Shipped
- **Goal:** Filter tabs (All/Running/Done/Failed), clear visual status at a glance
- **Shipped:** 2026-02-14
- **Changes:**
  - Replaced "Show completed" toggle with pill-style filter tabs (All/Running/Done/Failed) with counts
  - Task rows now show colored status dots: green=done, blue-pulse=running, red=failed, gray=idle
  - Failed tasks have red background tint and red title text
  - Succeeded tasks show "Output ready — click to review" hint
  - Running tasks show phase in blue text
  - Removed redundant agent badge from list (status dot replaces it)

### P1.4: Dashboard Copy — AI Does The Work
- **Status:** ✅ Shipped
- **Goal:** Reframe nudge copy from "tasks to do" to "decision points" / "tasks running"
- **Shipped:** 2026-02-14
- **Changes:**
  - Empty nudge card: "You're up to date" → "All clear"
  - Copy: "You have 3 tasks to do" → "3 agent tasks are running in the background"
  - Zero-task copy: "All caught up. Start a conversation or create a task and I'll get to work."

### P1.5: Landing Page Polish
- **Status:** ✅ Shipped
- **Goal:** Fix nav-to-content gap, upgrade AgentTaskPreview widget to Jarvis-like animation
- **Shipped:** 2026-02-14
- **Changes:**
  - Reduced hero top padding from `py-20 sm:py-28` to `py-10 sm:py-16`
  - Removed redundant `pt-16` on main + `-mt-16 pt-16` on hero section
  - Rewrote AgentTaskPreview widget:
    - 6-frame deep-research style animation (was 4 frames)
    - Shows plan steps with check/spinner/empty icons (not dots)
    - Live action indicator with pulsing dots
    - Source chips that accumulate as agent finds data
    - Draft output that grows progressively
    - Header bar with status pill (blue while running, green when ready)
    - Gradient glow backdrop (blue→purple)

### P1.6: Insight Action Items → Agent Tasks
- **Status:** ✅ Shipped
- **Goal:** Click any recommended action in a weekly digest/insight to spin up an agent in the background
- **Shipped:** 2026-02-15
- **Changes:**
  - Enhanced `InsightDetailModal` in `src/app/dashboard/intelligence/page.tsx`:
    - Each action item now has a "Run" button (Play icon) to create a task + start the agent
    - "Run all" button (Zap icon) at the section header to dispatch all action items at once
    - Visual states: blue spinner while dispatching, green check + "Agent started" after
    - Blue banner appears showing "N agents are now working in the background" with link to tasks page
    - Dispatched items get emerald border/background to visually differentiate
  - Uses existing `tasks.create` (single item) and `tasks.createFromInsight` (batch) mutations
  - Both mutations auto-queue the agent pipeline + create notifications

### P1.7: Connector Progressive Disclosure
- **Status:** ⏳ Pending → Moved to P6.7 in JARVIS_ROADMAP.md
- **Goal:** Connector suggestions appear inline when tasks need external services

### P1.8: Jarvis Status Indicator
- **Status:** ⏳ Pending → Moved to P8 in JARVIS_ROADMAP.md
- **Goal:** Sidebar shows what Jarvis is doing in real time

---

## Vision Notes (Agent UX North Star)

These are the guiding principles for the agent task experience, to be implemented progressively:

1. **Deep Research-style UI**: Show each process step visibly — what the AI is searching, reading, drafting. Think Perplexity/ChatGPT deep research UI. Never let the user suspect mock data.
2. **Mid-work questions**: The agent should be able to pause and ask the user clarifying questions during execution, not just run to completion.
3. **Rich output formats**: Output should not always be text. If a doc is the best format, create a doc. If a checklist, show a checklist. If a comparison table, show a table.
4. **Progressive disclosure**: Show plan → show each step executing → show sources/reasoning → show output. Each phase should feel like real work.
5. **Cancel/abort**: Users must be able to cancel a running agent at any time.
6. **Transparent timing**: Agent work should take visible time (even if fast). Instant = suspicious. Show the work.

---

## Changelog

| Date | Feature | Details |
|------|---------|---------|
| 2026-02-14 | P0.1: Three Zones Navigation | Fixed 10+ broken deep-links across backend + added redirect stubs on old routes |
| 2026-02-14 | P0.2: Kill actionableActions | Removed table, CRUD file, research file, dead panel — single task model |
| 2026-02-14 | P0.3: Chat Instant Feel | Added pulsing dot typing animation on "Thinking..." placeholder |
| 2026-02-14 | P0.4: Onboarding Populates Dashboard | Work-first onboarding with task extraction, live preview panel, auto-creates tasks |
| 2026-02-14 | P0.5: Nudge Card Row | Overdue task nudges with inline "Mark done" actions, icon-per-type |
| 2026-02-14 | P1.1: Agent Task Execution | Verified existing pipeline, added copy-to-clipboard on agent output |
| 2026-02-14 | P1.2: Agent Panel UX Overhaul | Wider panel, close bug fix, re-run disabled while running |
| 2026-02-14 | P1.3: Task Status Filtering | Filter tabs (All/Running/Done/Failed), colored status dots, visual differentiation |
| 2026-02-14 | P1.4: Dashboard AI Copy | Reframed "tasks to do" → "tasks running in background" |
| 2026-02-14 | P1.5: Landing Page Polish | Reduced nav-content gap, deep-research style agent preview widget |
| 2026-02-15 | P1.6: Insight Actions → Agents | Click any recommended action to spin up agent tasks with visual feedback |
| 2026-02-15 | Mobile animation fix | AgentTaskPreview freezes on final frame on mobile to prevent scroll jumps |
| 2026-02-15 | Developer onboarding doc | Comprehensive `docs/DEVELOPER_ONBOARDING.md` — schema, prompts, analytics, working/broken features |

---

## P2 -- Agentic Core (Multi-Step + Tools)

### P2.0: Multi-Step Agent Loop + Data Tools + Pause/Resume Questions
- **Status:** Shipped
- **Goal:** Turn taskAgent into a real multi-step agent with visible progress, tool-driven data access, and mid-run clarifying questions.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added Anthropic as a first-class AI provider:
    - Expanded `userSettings` schema to support `aiProvider: "anthropic"` + `anthropicApiKey`
    - Added Anthropic model options in `src/lib/aiModels.ts` and Settings UI in `src/app/dashboard/settings/page.tsx`
  - Added richer agent event types to support tool visualization + questions:
    - Expanded `taskEvents.kind` to include `tool`, `question`, `approval-request`
    - Added optional fields for tool input/output, question options/answers, and approval metadata
    - Added `taskEvents.answerQuestion` mutation to resume the agent after a user answers
  - Shipped the agent tool framework + built-in read tools:
    - New `convex/ai/agentTools.ts` tool registry + executors
    - Tools: `read_soul_file`, `list_tasks`, `list_income_streams`, `list_ideas`, `list_mentorship_sessions`, `search_insights`, `get_task_result`, `ask_user`
    - Added internal list queries for tools to work inside Convex actions: `listForUserInternal` across tasks/income/ideas/mentorship
  - Rewrote `convex/ai/taskAgent.ts` into a real multi-step loop:
    - PLAN phase produces `agentPlan` then EXECUTE runs steps sequentially
    - Each tool call emits `taskEvents` so the UI shows progress in real time
    - `ask_user` pauses execution (sets `agentPhase: "Waiting for input"`) and resumes via `continueInternal`
    - Incremental output: step outputs append into `agentResult` as the agent progresses
  - Updated tasks UI to render interactive question cards:
    - `src/components/dashboard/TasksContent.tsx` shows `question` events with option buttons and resumes agent on click

### P2.0.1: Output Raw View + Capability Listing + Platform Principles Doc
- **Status:** Shipped
- **Goal:** Make agent output trustworthy (raw text view) and document the non-negotiable rules for tools/connectors so future agents build consistently.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added Rich vs Raw output toggle in `src/components/dashboard/TasksContent.tsx`
  - Added "Agent Capabilities" section in `src/app/dashboard/settings/page.tsx` listing built-in tools and clarifying provider tool-use behavior
  - Added `docs/AGENT_PLATFORM_PRINCIPLES.md` and linked it from `docs/JARVIS_ROADMAP.md` and `docs/AGENTIC_CORE.md`

### P2.6: File Creation System (agentFiles + create_file tool + viewer/editor)
- **Status:** Shipped
- **Goal:** Jarvis can create real draft documents as first-class objects, not just inline text.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added `agentFiles` table to `convex/schema.ts`
  - Added `convex/agentFiles.ts` CRUD (public + internal) for listing, getting, creating, updating, deleting files
  - Added `create_file` tool to `convex/ai/agentTools.ts` so Claude tool-use can persist drafts linked to a task
  - Added `src/components/dashboard/AgentFileViewer.tsx` (inline viewer/editor with Rich/Raw view + copy + save)
  - Added a "Files" section to the agent task activity panel in `src/components/dashboard/TasksContent.tsx`

### P2.7: Approval Requests (approval-request events + approve/deny UI + request_approval tool)
- **Status:** Shipped (infrastructure)
- **Goal:** Support human-in-the-loop for irreversible/external actions.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added `request_approval` tool to `convex/ai/agentTools.ts` (creates `taskEvents(kind="approval-request")` and pauses)
  - Added `taskEvents.respondApproval` mutation to `convex/taskEvents.ts` to approve/deny and resume the agent
  - Updated `convex/ai/taskAgent.ts` resume logic to support both `question` and `approval-request` pause points
  - Updated `src/components/dashboard/TasksContent.tsx` to render approval cards with Approve/Deny buttons

---

## P3 — Deep Research Agent UI

### P3.1: Tool Call Visualization (Cards + Input/Output)
- **Status:** Shipped (partial)
- **Goal:** Make the agent's work legible by rendering tool calls as first-class UI cards.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added `kind="tool"` event card rendering in `src/components/dashboard/TasksContent.tsx` showing tool name, input payload, and output summary

### Tests + Analytics: Agent Parsing Tests + PostHog Agent Lifecycle Events
- **Status:** Shipped
- **Goal:** Raise the engineering bar: unit-test core parsing and instrument agent lifecycle/errors in PostHog.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added pure parsing module `convex/ai/taskAgentParsing.ts` and unit tests `convex/ai/taskAgentParsing.test.ts`
  - Expanded API export validation test to include `convex/agentFiles.ts` exports in `src/test/api-exports.test.ts`
  - Added `captureEvent()` to `convex/lib/posthog.ts` and instrumented:
    - `agent_file_created`, `agent_approval_requested` in `convex/ai/agentTools.ts`
    - `agent_task_succeeded`, `agent_task_failed`, `agent_approval_responded` in `convex/ai/taskAgent.ts`
  - Added step/final phase $ai_generation capture in `convex/ai/taskAgent.ts` (truncated prompt/output for safety)

### P2.2.1: OpenRouter Tool Loop (Function Calling)
- **Status:** Shipped (initial)
- **Goal:** Enable autonomous tool calling without requiring Anthropic provider (useful for one-key OpenRouter setups).
- **Shipped:** 2026-02-15
- **Changes:**
  - Added OpenRouter function-calling tool loop in `convex/ai/taskAgent.ts` (`tools` + `tool_calls` + `role="tool"` results)
  - Updated provider routing so `aiProvider="openrouter"` uses the tool loop (Google remains fallback)
  - Updated docs and Settings UI copy to reflect OpenRouter tool-use support

### Maintenance: Default Gemini Model + Tool Error Analytics + Test Config Tweaks
- **Status:** Shipped
- **Goal:** Keep defaults current (Gemini 3 Flash), improve observability, and reduce friction running tests locally.
- **Shipped:** 2026-02-15
- **Changes:**
  - Updated default model selections to prefer `gemini-3-flash-preview` / `google/gemini-3-flash-preview` across the app (`src/lib/aiModels.ts`, `convex/ai/taskAgent.ts`, `convex/ai/chatSend.ts`, `convex/ai/taskExecute.ts`)
  - Added PostHog `agent_tool_failed` event capture on tool execution exceptions/unknown tools (`convex/ai/agentTools.ts`)
  - Updated `vitest.config.ts` to prefer threads pool and preserve symlinks (helps in some Windows environments where spawning OS commands is restricted)

---

## P4 -- Web Search + Browser Tool

### P4.0: Web Tools Settings + Key-Preserving Upsert + Files Tab
- **Status:** Shipped
- **Goal:** Make web tools usable end-to-end (settings + approvals), prevent accidental API key wipe on save, and surface agent deliverables as first-class files.
- **Shipped:** 2026-02-15
- **Changes:**
  - Fixed `userSettings.upsert` to preserve existing API keys unless a new value is explicitly provided (`convex/userSettings.ts`, `convex/userSettingsPatch.ts` + coretests).
  - Added Settings UI for web tools:
    - Search provider selector (`jina` or `tavily`)
    - Tavily API key field (masked like other keys)
    - Saved to `userSettings.searchProvider` / `userSettings.searchApiKey` (`src/app/dashboard/settings/page.tsx`)
  - Hardened agent pause/resume for planning/finalize:
    - Planning/finalizing can now pause for approval/questions and resume cleanly (`convex/ai/taskAgent.ts`)
  - Added a dedicated Files tab in the Data zone listing all `agentFiles` with open/delete (`src/components/dashboard/AgentFilesContent.tsx`, `src/app/dashboard/data/page.tsx`)

### P4.1: Perplexity Search Provider Option
- **Status:** Shipped
- **Goal:** Add Perplexity Search API as a first-class `web_search` provider (structured results) in addition to Jina/Tavily.
- **Shipped:** 2026-02-15
- **Changes:**
  - Expanded `userSettings.searchProvider` union to include `"perplexity"` (`convex/schema.ts`, `convex/userSettings.ts`).
  - Added Perplexity option to Settings UI (shares the `searchApiKey` field) (`src/app/dashboard/settings/page.tsx`).
  - Implemented Perplexity Search API executor in `web_search` tool (`convex/ai/agentTools.ts`).

### P2.3: Built-In Write Tools (Tasks + Notifications)
- **Status:** Shipped
- **Goal:** Give Jarvis basic write capabilities inside MNotes (create/update tasks, send notifications) as tool calls.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added tools: `create_task`, `update_task`, `send_notification` (`convex/ai/agentTools.ts`).
  - Added internal mutations for agent tools: `tasks.createInternal`, `tasks.patchTaskInternal` (`convex/tasks.ts`).
  - Added capability listing in Settings (`src/app/dashboard/settings/page.tsx`) and docs updates.

### P6.0: Connector Token Store + GitHub (PAT) Connection + GitHub Tools
- **Status:** Shipped (initial)
- **Goal:** Start the connector system with a minimal token store, a connect/disconnect UI, and the first real external tools (GitHub).
- **Shipped:** 2026-02-15
- **Changes:**
  - Added `connectorTokens` table (`convex/schema.ts`) and token CRUD (`convex/connectors/tokens.ts`).
  - Added Settings UI Connections section with GitHub connect/disconnect via PAT (`src/app/dashboard/settings/page.tsx`).
  - Added agent tools:
    - `github_list_my_pull_requests` (read-only)
    - `github_create_issue` (requires approval per task)
    (`convex/ai/agentTools.ts`)

### P6.1: Google OAuth Connectors (Gmail + Calendar)
- **Status:** Shipped (read + write tools + OAuth connect flow)
- **Goal:** Add OAuth-based connectors for Gmail + Google Calendar, store tokens safely, and expose read-only tools to the agent.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added `connectorAuthSessions` table for short-lived OAuth handshakes (`convex/schema.ts`).
  - Added OAuth session helpers (`convex/connectors/authSessions.ts`).
  - Implemented Google OAuth connect flow:
    - `connectors.googleOauth.start` action returns `authUrl` and writes a `connectorAuthSessions` row (`convex/connectors/googleOauth.ts`).
    - `connectors/googleOauth.callback` `httpAction` exchanges code for tokens and `postMessage`s back to the app (`convex/connectors/googleOauth.ts`).
    - HTTP route registered at `GET /connectors/google/callback` (`convex/http.ts`).
  - Updated token upsert to preserve `refreshToken` by default (prevents accidental refresh-token loss) (`convex/connectors/tokens.ts`).
  - Added Settings UI connect/disconnect for Gmail and Calendar using popup OAuth (`src/app/dashboard/settings/page.tsx`).
  - Added agent tools (read-only):
    - `gmail_list_recent`
    - `calendar_list_upcoming`
    (`convex/ai/agentTools.ts`)
  - Added agent tools (write + approval-gated):
    - `gmail_create_draft`
    - `gmail_send_email`
    - `calendar_create_event`
    (`convex/ai/agentTools.ts`)
  - Added “Enable write” reconnect in Settings (progressive disclosure) (`src/app/dashboard/settings/page.tsx`, `convex/connectors/googleOauth.ts`).
  - Added token refresh-on-expiry for Google tools (uses `GOOGLE_OAUTH_CLIENT_ID/SECRET`) (`convex/ai/agentTools.ts`).
  - Added PostHog events: `connector_oauth_started`, `connector_oauth_connected`, `connector_oauth_failed`, `agent_gmail_list_recent`, `agent_calendar_list_upcoming`, `agent_google_token_refreshed`, `agent_gmail_draft_created`, `agent_gmail_email_sent`, `agent_calendar_event_created`.

### P6.2: GitHub OAuth Connector (Replaces PAT)
- **Status:** ✅ Shipped
- **Goal:** Replace GitHub PAT connection with OAuth and keep GitHub tools working (with approvals for write).
- **Shipped:** 2026-02-15
- **Changes:**
  - Extended `connectorAuthSessions.provider` to include `github` (`convex/schema.ts`, `convex/connectors/authSessions.ts`).
  - Added GitHub OAuth flow:
    - `connectors.githubOauth.start` action returns `authUrl` and creates a session row (`convex/connectors/githubOauth.ts`).
    - `connectors.githubOauth.callback` `httpAction` exchanges code for token and posts success/failure back to opener (`convex/connectors/githubOauth.ts`).
    - HTTP route registered at `GET /connectors/github/callback` (`convex/http.ts`).
  - Updated Settings Connections UI:
    - GitHub connect/disconnect uses popup OAuth (no PAT input)
    - “Enable write” reconnect requests `repo` scope (`src/app/dashboard/settings/page.tsx`).
  - Added docs: `docs/CONNECTORS_GITHUB_OAUTH.md`

### P7.0: Rich Output Renderers (Interactive Checklists)
- **Status:** Shipped (initial renderer)
- **Goal:** Render agent output as more than markdown paragraphs when appropriate.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added `parseTaskOutput()` + `serializeChecklist()` helpers (`src/lib/outputFormats.ts`).
  - Added output renderer that detects checklists and renders them as interactive checkboxes (local UI state) with “Copy updated” (`src/components/dashboard/TaskOutputRenderers.tsx`).
  - Swapped task output rich view to use the renderer (raw view remains unchanged) (`src/components/dashboard/TasksContent.tsx`).
  - Added coretest coverage for checklist parse/serialize (`scripts/run-coretests.js`, `tsconfig.coretests.json`).

### P7.1: Rich Output Renderers (Markdown Tables)
- **Status:** ✅ Shipped
- **Goal:** Render markdown tables as real tables with quick export.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added markdown table detection and parsing (`src/lib/outputFormats.ts`).
  - Added table renderer with “Copy markdown” and “Copy CSV” (`src/components/dashboard/TaskOutputRenderers.tsx`).
  - Added coretest coverage for table parsing (`scripts/run-coretests.js`).

### P9.0: Proactive Suggestions (Approve → Agent Task)
- **Status:** ✅ Shipped (minimal initial)
- **Goal:** Jarvis proposes work to run, user approves, and a real agent task is queued.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added `proactiveSuggestions` table (`convex/schema.ts`).
  - Added suggestion CRUD + approve-to-task pipeline (`convex/proactiveSuggestions.ts`).
  - Added proactive generator cron (rule-based: suggests running Jarvis on top undone tasks) (`convex/ai/proactiveAgent.ts`, `convex/crons.ts`).
  - Dashboard Home now renders suggestions as nudge cards with Approve/Dismiss (`src/app/dashboard/page.tsx`).

### P10.3: Memory Changelog (Soul File Revisions + Restore UI)
- **Status:** ✅ Shipped (initial)
- **Goal:** Make soul file edits auditable and reversible.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added `soulFileRevisions` table to store prior versions (`convex/schema.ts`).
  - Soul file evolves now capture the previous version before patching (`convex/soulFile.ts`, `convex/soulFileRevisions.ts`).
  - Settings now includes a “Memory (Soul File)” editor and version restore UI (`src/app/dashboard/settings/page.tsx`).

### P3.1: Activity Feed Improvements (More Events + Tool Durations)
- **Status:** Shipped (incremental)
- **Goal:** Make the agent's work more legible by allowing full activity expansion and surfacing tool durations.
- **Shipped:** 2026-02-15
- **Changes:**
  - Added Show all/Show less toggle for task events (`src/components/dashboard/TasksContent.tsx`).
  - Tool result events now include duration in `detail` (e.g. `(... 123ms)`) (`convex/ai/taskAgent.ts`).

### P2.6.1: Agent Files Tools (List/Read/Update)
- **Status:** Shipped
- **Goal:** Let the agent manage its own created deliverables as first-class objects (not only create).
- **Shipped:** 2026-02-15
- **Changes:**
  - Added tools: `list_agent_files`, `read_agent_file`, `update_agent_file` (`convex/ai/agentTools.ts`).
  - Added internal list API for agent files (`convex/agentFiles.ts`).
