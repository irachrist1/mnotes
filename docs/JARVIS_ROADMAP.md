# Jarvis Roadmap — Full Handoff Document

**Created: February 15, 2026**
**Purpose: Complete spec for a new agent to pick up and ship everything that remains.**

---

## What's Already Shipped (Don't Rebuild These)

| ID | Feature | Status |
|----|---------|--------|
| P0.1 | Three Zones UI + navigation deep-link fixes | ✅ Shipped |
| P0.2 | Kill actionableActions (single task model) | ✅ Shipped |
| P0.3 | Chat instant feel (placeholder + typing animation) | ✅ Shipped |
| P0.4 | Onboarding populates dashboard (task extraction, live preview) | ✅ Shipped |
| P0.5 | Nudge card row (overdue tasks, digests, notifications) | ✅ Shipped |
| P1.1 | Agent task execution (full pipeline: plan → draft → result) | ✅ Shipped |
| P1.2 | Agent activity panel UX (wider, close bug fixed, re-run disabled while running) | ✅ Shipped |
| P1.3 | Task status filtering (All/Running/Done/Failed tabs, colored dots) | ✅ Shipped |
| P1.4 | Dashboard copy reframe (AI does work, not user) | ✅ Shipped |
| P1.5 | Landing page polish (gap fix, deep-research preview widget) | ✅ Shipped |

**Key files to understand before starting:**
- `convex/schema.ts` — all tables (tasks, taskEvents, notifications, etc.)
- `convex/ai/taskAgent.ts` — current agent pipeline (single LLM call, returns JSON)
- `src/components/dashboard/TasksContent.tsx` — agent tasks UI
- `src/app/dashboard/page.tsx` — dashboard home with nudge cards
- `docs/SHIPPING_LOG.md` — detailed changelog of everything shipped

---

## What Remains: The Full Jarvis Vision

Everything below is ordered by priority. Each section is a self-contained work unit.

---

### P2: Deep Research Agent UI (Critical — Makes It Feel Real)

**Problem:** The current agent executes in one LLM call and returns instantly. Users suspect it's mock data. The experience should feel like Perplexity Deep Research or ChatGPT's research mode — visible, step-by-step work that builds trust.

**What to build:**

#### P2.1: Multi-step agent execution with real-time events
- **File:** `convex/ai/taskAgent.ts` (REWRITE `runInternal`)
- Instead of one LLM call, break execution into visible phases:
  1. **Planning** (10%): LLM call #1 — produce a plan (3-7 steps). Save plan to task via `patchAgentInternal`. Emit `taskEvent` for each step.
  2. **Research/Search** (10-50%): For each plan step, make a separate LLM call (or web search call). After each step completes, emit a `taskEvent` with what was found/done. Update `agentProgress` incrementally.
  3. **Drafting** (50-80%): LLM call with accumulated context from steps above. Emit progress events as sections are drafted.
  4. **Review/Summary** (80-100%): Final LLM call to review and polish. Emit completion event.
- Each phase should have a **minimum visible duration** (e.g., `await sleep(1500)` between steps) so it doesn't feel instant.
- Use `ctx.scheduler.runAfter(0, ...)` to chain steps if needed for Convex action timeout limits.

#### P2.2: Live activity feed with sources
- **File:** `src/components/dashboard/TasksContent.tsx` (MODIFY agent activity panel)
- Show events as a **timeline** (not just a list):
  - Each event has an icon (search, read, draft, check), timestamp, title, and detail
  - Currently-running step has a spinner
  - Completed steps have green checkmarks
  - Show **source chips** when the agent references context (soul file, past data, etc.)
- Add a collapsible "Thinking" section that shows the agent's reasoning for each step (stored in `taskEvent.detail`)

#### P2.3: Streaming / progressive output
- Instead of showing the full result only at the end, update `agentResult` incrementally as sections are drafted
- The output section should render partial markdown as it arrives
- Use Convex reactive queries — the UI auto-updates as `agentResult` is patched

#### P2.4: Add `sleep` utility for pacing
- **File:** `convex/ai/taskAgent.ts`
- Add: `const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));`
- Use between phases: `await sleep(1500);` — makes each step visually distinct

**Schema changes:** None needed — `taskEvents` and task agent fields already support this.

**Key principle:** NEVER use mock data. Every event must come from actual LLM calls or real data reads. The pacing makes it feel real, but the content must BE real.

---

### P3: Agent Web Search + Browser Tool

**Problem:** The agent currently can only think — it can't search the web, read URLs, or browse. A real Jarvis needs to find information.

**What to build:**

#### P3.1: Web search integration
- **File:** `convex/ai/agentTools.ts` (CREATE)
- Integrate a search API. Options (pick one):
  - **Tavily API** — purpose-built for AI agents, returns clean results ($0 free tier)
  - **Serper API** — Google search results as JSON
  - **Perplexity API** — search + synthesis in one call
- Add `searchWeb(query: string): Promise<SearchResult[]>` function
- Store API key in `userSettings` table (add `tavilyApiKey` or `serperApiKey` field to schema)
- Emit `taskEvent` for each search: `"Searching: {query}"` with results summary in detail

#### P3.2: URL reading / web scraping
- **File:** `convex/ai/agentTools.ts` (ADD)
- Add `readUrl(url: string): Promise<string>` — fetches URL, extracts text content
- Use a service like Jina Reader API (`https://r.jina.ai/{url}`) or implement basic HTML-to-text
- Emit `taskEvent`: `"Reading: {url}"`
- Truncate to reasonable token limit (e.g., 4000 chars)

#### P3.3: Wire tools into agent pipeline
- **File:** `convex/ai/taskAgent.ts` (MODIFY)
- During the Research phase (P2.1 step 2), the agent's plan steps can now trigger real searches:
  - If a plan step mentions "search" or "find" or "research" → call `searchWeb()`
  - If a plan step mentions a URL → call `readUrl()`
- Pass search results as context to the Drafting phase
- Show sources in the output: `"Sources: [title](url), [title](url)"`

#### P3.4: Schema addition for tool keys
- **File:** `convex/schema.ts` (MODIFY `userSettings`)
- Add: `searchApiKey: v.optional(v.string())`, `searchProvider: v.optional(v.string())`
- **File:** `src/app/dashboard/settings/page.tsx` (MODIFY)
- Add search API key field in settings

---

### P4: Agent Mid-Work Questions (Human-in-the-Loop)

**Problem:** The agent runs to completion without asking clarifying questions. A real Jarvis would pause and ask "Should I focus on pricing or positioning?" before drafting.

**What to build:**

#### P4.1: Agent question schema
- **File:** `convex/schema.ts` (MODIFY `taskEvents`)
- Add new kind: `v.literal("question")` to the `kind` union
- Add optional field: `options: v.optional(v.array(v.string()))` — multiple choice options
- Add optional field: `answered: v.optional(v.boolean())`
- Add optional field: `answer: v.optional(v.string())`

#### P4.2: Agent pauses for questions
- **File:** `convex/ai/taskAgent.ts` (MODIFY)
- After the Planning phase, the agent can emit a `"question"` event with options
- Set `agentPhase` to `"Waiting for input"` and `agentStatus` to `"running"` (but don't proceed)
- Store a continuation token (which step to resume from) in the task metadata
- When the user answers, schedule `runInternal` again with the answer as additional context

#### P4.3: Question UI in activity panel
- **File:** `src/components/dashboard/TasksContent.tsx` (MODIFY)
- When the latest event is kind `"question"` and `answered === false`:
  - Render a question card with the options as clickable buttons
  - On click: mutation to set `answer` + `answered: true` on the event, then trigger agent resume
- Show answered questions inline in the timeline (greyed out, with the user's choice)

#### P4.4: Answer mutation + resume trigger
- **File:** `convex/taskEvents.ts` (MODIFY)
- Add `answerQuestion` mutation: takes `eventId`, `answer`, updates the event, then schedules `runInternal` to continue

---

### P5: Rich Output Formats

**Problem:** Agent output is always markdown text. Sometimes the best output is a checklist, a comparison table, a document, or structured data.

**What to build:**

#### P5.1: Output type detection
- **File:** `convex/ai/taskAgent.ts` (MODIFY)
- In the agent system prompt, ask the LLM to include an `outputType` field in its JSON response:
  - `"prose"` — default markdown
  - `"checklist"` — array of items with checked/unchecked state
  - `"table"` — structured comparison table
  - `"document"` — long-form with title, sections, headers
  - `"plan"` — ordered steps with owner/deadline
- Store `outputType` on the task (add field to schema)

#### P5.2: Output renderers
- **File:** `src/components/dashboard/TaskOutputRenderers.tsx` (CREATE)
- **Checklist renderer**: Interactive checkboxes, items you can check off and reorder
- **Table renderer**: Clean comparison table with sortable columns
- **Document renderer**: Full-width document view with table of contents
- **Plan renderer**: Gantt-lite or ordered step list with owners and deadlines

#### P5.3: Export/save output
- Add "Save as document" button → saves to a new `documents` table
- Add "Copy as markdown" (already exists)
- Add "Send to chat" → opens chat with the output as context
- Future: "Export as PDF", "Send as email"

#### P5.4: Schema addition
- **File:** `convex/schema.ts` (MODIFY `tasks`)
- Add: `agentOutputType: v.optional(v.string())`

---

### P6: Connector System (GitHub, Email, Calendar)

**Problem:** Jarvis can't interact with external tools. The user should be able to say "Check my GitHub PRs" or "Schedule a meeting" and Jarvis handles it.

**What to build:**

#### P6.1: Connector framework
- **File:** `convex/connectors/` (CREATE directory)
- **File:** `convex/connectors/types.ts` — Define connector interface:
  ```typescript
  interface Connector {
    id: string;           // "github" | "google-calendar" | "gmail" | "slack"
    name: string;
    icon: string;
    scopes: string[];     // OAuth scopes needed
    isConnected: boolean;
    actions: ConnectorAction[];
  }
  interface ConnectorAction {
    id: string;           // "list-prs" | "create-event" | "send-email"
    name: string;
    description: string;
    requiresApproval: boolean;  // true for send/create, false for read
    parameters: ActionParameter[];
  }
  ```

#### P6.2: OAuth token storage
- **File:** `convex/schema.ts` (ADD table)
  ```
  connectorTokens: defineTable({
    userId: v.string(),
    provider: v.string(),    // "github" | "google" | "slack"
    accessToken: v.string(), // encrypted
    refreshToken: v.optional(v.string()),
    scopes: v.array(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_user_provider", ["userId", "provider"])
  ```
- **File:** `convex/connectors/oauth.ts` — OAuth flow handlers (redirect URL, token exchange, refresh)

#### P6.3: GitHub connector
- **File:** `convex/connectors/github.ts` (CREATE)
- Actions:
  - `listPullRequests()` — fetch open PRs from user's repos
  - `listIssues()` — fetch assigned issues
  - `getRepoActivity()` — recent commits/activity summary
  - `createIssue(repo, title, body)` — requires approval
- Uses GitHub REST API with stored OAuth token
- Agent can call these during task execution

#### P6.4: Google Calendar connector
- **File:** `convex/connectors/google-calendar.ts` (CREATE)
- Actions:
  - `listUpcoming(days: number)` — next N days of events
  - `findFreeSlots(date, duration)` — available time slots
  - `createEvent(title, start, end, attendees)` — requires approval
  - `getAgenda()` — today's schedule summary
- Uses Google Calendar API

#### P6.5: Gmail connector
- **File:** `convex/connectors/gmail.ts` (CREATE)
- Actions:
  - `listRecent(count: number)` — recent emails summary
  - `searchEmails(query)` — search emails
  - `draftEmail(to, subject, body)` — creates draft (requires approval to send)
  - `sendEmail(to, subject, body)` — requires explicit approval
- Uses Gmail API

#### P6.6: Connector settings UI
- **File:** `src/app/dashboard/settings/page.tsx` (MODIFY)
- Add "Connections" section:
  - List of available connectors with connect/disconnect buttons
  - OAuth flow: click Connect → redirect to provider → callback → save token
  - Show connection status and last sync time

#### P6.7: Agent tool-use integration
- **File:** `convex/ai/taskAgent.ts` (MODIFY)
- During execution, if the task involves external data:
  - Check which connectors the user has enabled
  - Use connector actions as tools during the Research phase
  - Emit events: `"Reading your GitHub PRs..."`, `"Checking your calendar..."`
  - For write actions (send email, create event): pause and ask for approval (P4)

#### P6.8: Progressive disclosure in UI
- When a task would benefit from a connector that isn't connected:
  - Show an inline suggestion: "Connect GitHub to let me check your PRs"
  - One-click connect flow
  - After connecting, auto-retry the task step

---

### P7: Jarvis Status Indicator (Ambient Awareness)

**Problem:** The user doesn't know what Jarvis is doing unless they open the tasks page. Jarvis should always show its state.

**What to build:**

#### P7.1: Sidebar status widget
- **File:** `src/components/layout/Sidebar.tsx` (MODIFY)
- At the bottom of the sidebar, show:
  - Green dot + "Idle" when no tasks running
  - Blue pulse + "Working on: {task title}" when an agent is running
  - Red dot + "Needs attention" when a task failed or question is pending
- Click navigates to the running task

#### P7.2: Floating status pill (mobile)
- **File:** `src/components/layout/DashboardShell.tsx` (MODIFY)
- On mobile, show a floating pill at the bottom:
  - Animated blue ring when working
  - Tap to expand and see current task progress
  - Swipe to dismiss

#### P7.3: Backend query for current status
- **File:** `convex/tasks.ts` (ADD)
- Add `currentAgentStatus` query:
  - Returns the most recently active task with `agentStatus === "running"` or `"queued"`
  - Returns null if nothing is running
  - Returns `{ taskId, title, phase, progress }` if something is running

---

### P8: Proactive Agent Loop (Jarvis Initiates)

**Problem:** Currently Jarvis only acts when the user creates a task. A real Jarvis would proactively notice things and suggest actions.

**What to build:**

#### P8.1: Proactive analysis cron
- **File:** `convex/ai/proactiveAgent.ts` (CREATE)
- Daily cron (or triggered after new data arrives):
  - Analyze user's data for actionable patterns
  - Check for: stale ideas, revenue trends, upcoming deadlines, unfinished tasks
  - Generate proactive task suggestions as notifications
  - The user can "Approve" a suggestion → creates a task and agent starts

#### P8.2: Smart nudge generation
- **File:** `convex/ai/nudgeEngine.ts` (CREATE)
- Rules engine + LLM for generating nudge cards:
  - **Time-based**: "You haven't updated your income data in 2 weeks"
  - **Goal-based**: "You're 60% to your revenue goal with 3 weeks left"
  - **Pattern-based**: "Your best clients come from referrals — want me to draft a referral ask?"
  - **Context-based**: (with calendar) "You have a meeting with Acme tomorrow — want me to prepare?"

#### P8.3: Notification → task pipeline
- When a proactive nudge is approved:
  - Auto-create a task with context from the nudge
  - Agent starts immediately
  - Show progress on dashboard home

---

### P9: Memory Evolution (Living Soul File)

**Problem:** The soul file is static after onboarding. It should evolve automatically as the user works.

**What to build:**

#### P9.1: Conversation-driven updates
- **File:** `convex/ai/soulFileEvolve.ts` (EXISTS — verify and enhance)
- After every N chat messages (currently 5), trigger soul file evolution:
  - Extract new facts, preferences, goals from recent messages
  - Merge into existing soul file sections
  - Version the update (already has `version` field)

#### P9.2: Data-driven updates
- When the user's data changes significantly (new income stream, completed goals, etc.):
  - Trigger a soul file review
  - Update the Goals section with new progress
  - Update Patterns section with observed behaviors

#### P9.3: User-visible memory log
- **File:** `src/app/dashboard/settings/page.tsx` or new page
- Show the user what Jarvis remembers:
  - Current soul file (editable)
  - Memory changelog: "Feb 15: Learned you're targeting $10k MRR by Q2"
  - Delete/edit specific memories

---

### P10: Landing Page + Auth Polish

**What to build:**

#### P10.1: Landing page content alignment
- Fix any remaining text/content alignment issues
- Ensure hero section is visually balanced on all screen sizes
- Test on mobile, tablet, desktop

#### P10.2: Auth flow polish
- Sign-in page should be lightweight (no heavy libs)
- Error states for wrong password, account not found
- "Forgot password" flow if not already implemented

---

## Architecture Notes for the Next Agent

### Tech constraints
- **Convex actions** have a 5-minute timeout. For long agent runs, chain actions using `ctx.scheduler.runAfter(0, internal.ai.taskAgent.continueStep, { ... })`
- **API keys** are stored per-user in `userSettings`. Always read via `internal.userSettings.getForUser` (server-side, unmasked)
- **Never import heavy libs globally**. Use `next/dynamic` with `ssr: false` for chart.js, framer-motion, react-markdown
- **All tables have userId**. Always call `getUserId(ctx)` and filter by user
- **Build must pass**: `npm run build` — TS errors in page exports are ignored per `next.config.ts`

### File conventions
- Backend: `convex/` — mutations, queries, actions
- AI pipelines: `convex/ai/` — all LLM calls happen here
- Frontend pages: `src/app/dashboard/` — App Router pages
- Components: `src/components/` — shared UI
- The `card` class is the primary container style (see `globals.css`)

### Testing
```bash
npm run build          # Must pass (exit 0)
npm test               # Vitest + jsdom
npx convex dev         # Backend dev server
npm run dev            # Frontend dev server
```

### Priority order for a new agent
1. **P2 (Deep Research UI)** — highest impact, makes the product feel real
2. **P3 (Web Search)** — gives the agent actual capabilities
3. **P4 (Mid-work Questions)** — human-in-the-loop, builds trust
4. **P7 (Status Indicator)** — ambient awareness, small effort
5. **P5 (Rich Outputs)** — better deliverables
6. **P6 (Connectors)** — biggest effort, biggest payoff
7. **P8 (Proactive Loop)** — Jarvis takes initiative
8. **P9 (Memory Evolution)** — partially exists, enhance
9. **P10 (Polish)** — ongoing

---

*Last updated: February 15, 2026*
