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
