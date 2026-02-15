# Jarvis Roadmap — Central Coordination Document

**Created: February 15, 2026**
**Purpose: Single source of truth for all agents working on this codebase. Every agent reads this first.**

> **If you are a Claude Code agent assigned to work on this project:**
> 1. Read this entire document before writing any code
> 2. Read `CLAUDE.md` for codebase conventions
> 3. Read `docs/SHIPPING_LOG.md` for what's already shipped
> 4. Follow the Multi-Agent Coordination Protocol at the bottom of this document
> 5. Ask the owner what work unit you're assigned before starting

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
- `docs/AGENT_PLATFORM_PRINCIPLES.md` — non-negotiable rules for tools/connectors/output (read before adding tools)

---

## What Remains: The Full Jarvis Vision

Everything below is ordered by priority. Each section is a self-contained work unit.

> **North Star:** Jarvis must DO things — not just generate text. Every feature below should be evaluated
> by: "Does this get us closer to an AI agent that takes real actions on behalf of the user?"

---

### P2: Agentic Core — The Main Feature (**TOP PRIORITY**)

**THIS IS THE FEATURE THAT MAKES EVERYTHING WORTHWHILE.**

**Problem:** The current agent is a single LLM call that generates text. A real Jarvis doesn't just write paragraphs — it creates files, calls tools, searches the web, reads documents, connects to services, and takes real actions. The entire product depends on making this real.

**Current state:**
- `convex/ai/taskAgent.ts` makes ONE LLM call (Google Gemini or OpenRouter), returns JSON, done.
- No tool calling. No file creation. No web search. No multi-step reasoning. No action execution.
- Users can pick individual insight recommendations to run as agent tasks (P1.6), but the agent can only generate text.

**What must change:**

#### P2.1: Switch to Claude as the backbone LLM
- **Why:** Claude Sonnet 4.5 and Opus 4.6 have best-in-class tool use, long context, and agentic capabilities. Gemini is fine for simple generation but Claude is built for agentic work.
- **File:** `convex/ai/taskAgent.ts` (MODIFY)
- Add `callClaude()` function alongside existing `callOpenRouter()` and `callGoogle()`:
  - Use the Anthropic SDK (`@anthropic-ai/sdk`)
  - Support both `claude-sonnet-4-5-20250929` and `claude-opus-4-6`
  - Use the **tool_use** API — not just text generation
- **File:** `convex/schema.ts` (MODIFY `userSettings`)
  - Add `anthropicApiKey: v.optional(v.string())`
  - Add Claude models to the model picker
- **File:** `src/lib/aiModels.ts` (MODIFY)
  - Add Anthropic provider + Claude model options
- **File:** `src/app/dashboard/settings/page.tsx` (MODIFY)
  - Add Anthropic API key field in settings
- **Model routing strategy:**
  - **Sonnet 4.5** — default for most agent tasks (fast, capable, affordable)
  - **Opus 4.6** — for complex multi-step tasks, long documents, nuanced reasoning
  - Let user choose per-task or set a default, but recommend Sonnet 4.5 for speed

#### P2.2: Tool-use framework (function calling)
- **Why:** The agent must be able to call tools, not just generate text. Claude's tool_use API lets the LLM decide which tool to call and with what parameters.
- **File:** `convex/ai/agentTools.ts` (CREATE)
- Define a **tool registry** — each tool has:
  ```typescript
  interface AgentTool {
    name: string;           // "create_file", "web_search", "read_url", "list_tasks", etc.
    description: string;    // What this tool does (for the LLM)
    input_schema: object;   // JSON Schema for parameters
    requiresApproval: boolean;  // true for destructive/external actions
    execute: (ctx, userId, params) => Promise<ToolResult>;
  }
  ```
- Tools are passed to Claude via the `tools` parameter in the API call
- The agent loop: LLM responds → if tool_use → execute tool → feed result back → LLM continues → repeat until done
- **CRITICAL:** This is an **agentic loop**, not a single call. The LLM may call multiple tools in sequence.

#### P2.3: Built-in tools (ship with these)
- **File:** `convex/ai/agentTools.ts` (ADD tools)

**Read tools (no approval needed):**
- `read_soul_file` — read user's memory/profile
- `list_tasks` — read user's existing tasks
- `list_income_streams` — read user's income data
- `list_ideas` — read user's idea bank
- `list_mentorship_sessions` — read user's mentorship notes
- `get_task_result` — read output of a previous agent task
- `search_insights` — search through saved AI insights

**Write tools (some need approval):**
- `create_file` — create a document/file (markdown, text, structured). Saves to a new `agentFiles` table. No approval needed — it's a draft the user can review.
- `create_task` — create a new task (and optionally start agent on it). No approval for drafts.
- `update_task` — mark a task done, add notes. No approval.
- `create_insight` — save a finding as an AI insight. No approval.
- `send_notification` — notify the user about something. No approval.

**External tools (require approval — built later in P6):**
- `web_search` — search the internet
- `read_url` — fetch and parse a URL
- `send_email` — compose and send email
- `create_calendar_event` — schedule a meeting
- `create_github_issue` — file an issue

#### P2.4: Multi-step agentic execution loop
- **File:** `convex/ai/taskAgent.ts` (REWRITE `runInternal`)
- Replace single LLM call with an **agentic loop**:
  ```
  1. PLAN: Ask Claude to analyze the task and produce a plan (tool calls: read_soul_file, list_tasks, etc.)
  2. EXECUTE: For each plan step, Claude decides which tools to call
     - Each tool call emits a taskEvent (visible to user in real-time)
     - Results feed back into the conversation context
     - Claude may call multiple tools per step
  3. DRAFT: Claude produces the final output using accumulated context
  4. REVIEW: Optional self-review pass
  ```
- **Maximum iterations:** Cap at ~10 tool calls per task to prevent runaway loops
- **Timeout handling:** Convex actions have 5-min timeout. Use `ctx.scheduler.runAfter(0, ...)` to chain continuation actions if needed. Store conversation state in the task/events.
- **Pacing:** Add `sleep(1500)` between steps for visible progress

#### P2.5: Prompting strategies
- **This is critical.** Bad prompts = useless agent. Good prompts = Jarvis.
- **System prompt structure:**
  ```
  You are Jarvis, an AI executive assistant inside MNotes.
  You have access to the user's memory, data, and tools.

  RULES:
  - Always read the user's soul file first to understand context
  - Be honest about what you can and can't do
  - For file creation: create real, usable documents — not summaries
  - For research: cite sources, show your work
  - Ask clarifying questions (via the question tool) when ambiguous
  - Never fake data. If you don't know, say so.
  - Prefer action over analysis. Create the thing, don't just describe it.

  AVAILABLE TOOLS: [injected dynamically based on user's connected services]

  USER PROFILE:
  [soul file content]
  ```
- **Task-specific prompt augmentation:**
  - For "draft a proposal" → emphasize file creation, formatting, structure
  - For "research competitors" → emphasize web search, source citation
  - For "prepare for meeting" → emphasize calendar reading, context gathering
- **Chain-of-thought:** Claude should explain its reasoning in taskEvents before acting
- **Tool selection prompting:** "Before acting, state which tool you'll use and why"

#### P2.6: File creation system
- **Why:** The most basic agentic capability — "Draft me a proposal" should create an actual document, not just text in a box.
- **File:** `convex/schema.ts` (ADD table)
  ```
  agentFiles: defineTable({
    userId: v.string(),
    taskId: v.optional(v.id("tasks")),  // which task created this
    title: v.string(),
    content: v.string(),       // markdown content
    fileType: v.string(),      // "document" | "checklist" | "table" | "plan"
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]).index("by_task", ["taskId"])
  ```
- **File:** `convex/agentFiles.ts` (CREATE)
  - CRUD mutations: `create`, `update`, `list`, `get`, `delete`
- **File:** `src/components/dashboard/AgentFileViewer.tsx` (CREATE)
  - Renders agent-created files with markdown formatting
  - Edit capability (user can refine what the agent created)
  - Export as markdown / copy to clipboard
- Agent output for file-creation tasks should link to the created file, not inline the content

#### P2.7: Action approval system
- **Why:** Some agent actions (sending email, creating calendar events) are irreversible. The user must approve them.
- **File:** `convex/schema.ts` (MODIFY `taskEvents`)
  - Add kind: `"approval-request"` — agent is asking permission to do something
  - Add fields: `approvalAction: v.optional(v.string())`, `approvalParams: v.optional(v.string())`, `approved: v.optional(v.boolean())`
- **File:** `src/components/dashboard/TasksContent.tsx` (MODIFY)
  - When a `"approval-request"` event appears: show action details + Approve/Deny buttons
  - On approve: mutation triggers the action and resumes the agent
  - On deny: agent skips that step and continues
- **Default policy:** Read actions = auto-approved. Write actions to user's own data = auto-approved. External actions (email, calendar, GitHub) = require approval.

#### P2.8: Agent conversation context management
- **Problem:** As the agent makes multiple tool calls, the conversation grows. Need to manage context window.
- Truncate old tool results after they've been processed
- Keep the plan, current step, and last 3 tool results in full
- Summarize older context
- For Claude Sonnet 4.5: 200k context window is generous, but still be smart about it

**Schema changes needed:**
- `userSettings`: add `anthropicApiKey`, expand model options
- `agentFiles`: new table for agent-created documents
- `taskEvents`: add `approval-request` kind, approval fields

**Key principles:**
- NEVER mock data. Every tool call must be real.
- The agent loop is the product. Everything else is UI around it.
- Start with built-in tools (soul file, tasks, files). Add external tools incrementally.
- Claude Sonnet 4.5 is the default. Opus 4.6 for power users / complex tasks.

---

### P3: Deep Research Agent UI (Makes It Feel Real)

**Problem:** Even with real tools, the UX must show the work happening. Users need to see each step, each tool call, each source — not just a spinner then a result.

**What to build:**

#### P3.1: Live activity feed with sources
- **File:** `src/components/dashboard/TasksContent.tsx` (MODIFY agent activity panel)
- Show events as a **timeline** (not just a list):
  - Each event has an icon (search, read, draft, check, tool), timestamp, title, and detail
  - Currently-running step has a spinner
  - Completed steps have green checkmarks
  - Show **source chips** when the agent references context (soul file, past data, URLs, etc.)
- Add a collapsible "Thinking" section that shows the agent's reasoning for each step (stored in `taskEvent.detail`)

#### P3.2: Streaming / progressive output
- Instead of showing the full result only at the end, update `agentResult` incrementally as sections are drafted
- The output section should render partial markdown as it arrives
- Use Convex reactive queries — the UI auto-updates as `agentResult` is patched

#### P3.3: Tool call visualization
- Each tool call should appear as a distinct card in the activity feed:
  - Tool name + icon (file, search, database, etc.)
  - Input parameters (truncated)
  - Output summary
  - Duration
- User can expand to see full tool input/output

**Key principle:** NEVER use mock data. Every event must come from actual LLM calls or real tool executions.

---

### P4: Web Search + Browser Tool

**Problem:** The agent can't search the web. This is one of the most basic capabilities for any assistant.

**What to build:**

#### P4.1: Web search tool
- **File:** `convex/ai/agentTools.ts` (ADD tool)
- Integrate a search API (Tavily, Serper, or Perplexity)
- Register as an agent tool: `web_search(query: string): SearchResult[]`
- Store API key in `userSettings` (add `searchApiKey`, `searchProvider` fields)
- Emit `taskEvent` for each search: `"Searching: {query}"` with results

#### P4.2: URL reading tool
- **File:** `convex/ai/agentTools.ts` (ADD tool)
- Register as agent tool: `read_url(url: string): string`
- Use Jina Reader API or basic HTML-to-text extraction
- Emit `taskEvent`: `"Reading: {url}"`
- Truncate to ~4000 chars

#### P4.3: Settings UI
- **File:** `src/app/dashboard/settings/page.tsx` (MODIFY)
- Add search API key field + provider selector

---

### P5: Agent Mid-Work Questions (Human-in-the-Loop)

**Problem:** The agent runs to completion without asking clarifying questions. A real Jarvis would pause and ask "Should I focus on pricing or positioning?" before drafting.

**What to build:**

#### P5.1: Agent question schema
- **File:** `convex/schema.ts` (MODIFY `taskEvents`)
- Add new kind: `v.literal("question")` to the `kind` union
- Add optional fields: `options`, `answered`, `answer`

#### P5.2: Agent pauses for questions
- Register a `ask_user` tool in the tool registry
- When Claude calls `ask_user`, the agent loop pauses
- Set `agentPhase` to `"Waiting for input"`
- When user answers, resume the agent loop with the answer as additional context

#### P5.3: Question UI in activity panel
- Render question cards with clickable option buttons
- On click: mutation sets answer, triggers agent resume
- Show answered questions inline in timeline

---

### P6: Connector System (GitHub, Email, Calendar)

**Problem:** Jarvis can't interact with external tools. The user should be able to say "Check my GitHub PRs" or "Schedule a meeting" and Jarvis handles it.

**What to build:**

#### P6.1: Connector framework
- **File:** `convex/connectors/` (CREATE directory)
- Define connector interface with typed actions
- Each connector registers its tools in the agent tool registry (P2.2)

#### P6.2: OAuth token storage
- **File:** `convex/schema.ts` (ADD `connectorTokens` table)
- OAuth flow handlers (redirect URL, token exchange, refresh)

#### P6.3: GitHub connector
- Actions: `listPullRequests`, `listIssues`, `getRepoActivity`, `createIssue`
- Uses GitHub REST API with stored OAuth token
- Write actions require approval (P2.7)

#### P6.4: Google Calendar connector
- Actions: `listUpcoming`, `findFreeSlots`, `createEvent`, `getAgenda`
- Uses Google Calendar API

#### P6.5: Gmail connector
- Actions: `listRecent`, `searchEmails`, `draftEmail`, `sendEmail`
- Uses Gmail API
- Send requires explicit approval (P2.7)

#### P6.6: Connector settings UI
- Add "Connections" section in settings
- OAuth connect/disconnect flow
- Connection status and last sync time

#### P6.7: Progressive disclosure
- When a task would benefit from an unconnected service:
  - Show inline suggestion: "Connect GitHub to let me check your PRs"
  - One-click connect flow

---

### P7: Rich Output Formats

**Problem:** Agent output is always markdown text. Sometimes the best output is a checklist, a comparison table, or structured data.

**What to build:**
- Output type detection in agent system prompt (`"prose"`, `"checklist"`, `"table"`, `"document"`, `"plan"`)
- Custom renderers for each type (interactive checklists, sortable tables, document viewer)
- Export: save as document, copy as markdown, send to chat
- Schema: add `agentOutputType` field to tasks

---

### P8: Jarvis Status Indicator (Ambient Awareness)

**Problem:** The user doesn't know what Jarvis is doing unless they open the tasks page. Jarvis should always show its state.

**What to build:**

#### P8.1: Sidebar status widget
- **File:** `src/components/layout/Sidebar.tsx` (MODIFY)
- At the bottom of the sidebar, show:
  - Green dot + "Idle" when no tasks running
  - Blue pulse + "Working on: {task title}" when an agent is running
  - Red dot + "Needs attention" when a task failed or question is pending
- Click navigates to the running task

#### P8.2: Floating status pill (mobile)
- **File:** `src/components/layout/DashboardShell.tsx` (MODIFY)
- On mobile, show a floating pill at the bottom:
  - Animated blue ring when working
  - Tap to expand and see current task progress
  - Swipe to dismiss

#### P8.3: Backend query for current status
- **File:** `convex/tasks.ts` (ADD)
- Add `currentAgentStatus` query:
  - Returns the most recently active task with `agentStatus === "running"` or `"queued"`
  - Returns null if nothing is running
  - Returns `{ taskId, title, phase, progress }` if something is running

---

### P9: Proactive Agent Loop (Jarvis Initiates)

**Problem:** Currently Jarvis only acts when the user creates a task. A real Jarvis would proactively notice things and suggest actions.

**What to build:**

#### P9.1: Proactive analysis cron
- **File:** `convex/ai/proactiveAgent.ts` (CREATE)
- Daily cron (or triggered after new data arrives):
  - Analyze user's data for actionable patterns
  - Check for: stale ideas, revenue trends, upcoming deadlines, unfinished tasks
  - Generate proactive task suggestions as notifications
  - The user can "Approve" a suggestion → creates a task and agent starts

#### P9.2: Smart nudge generation
- **File:** `convex/ai/nudgeEngine.ts` (CREATE)
- Rules engine + LLM for generating nudge cards:
  - **Time-based**: "You haven't updated your income data in 2 weeks"
  - **Goal-based**: "You're 60% to your revenue goal with 3 weeks left"
  - **Pattern-based**: "Your best clients come from referrals — want me to draft a referral ask?"
  - **Context-based**: (with calendar) "You have a meeting with Acme tomorrow — want me to prepare?"

#### P9.3: Notification → task pipeline
- When a proactive nudge is approved:
  - Auto-create a task with context from the nudge
  - Agent starts immediately
  - Show progress on dashboard home

---

### P10: Memory Evolution (Living Soul File)

**Problem:** The soul file is static after onboarding. It should evolve automatically as the user works.

**What to build:**

#### P10.1: Conversation-driven updates
- **File:** `convex/ai/soulFileEvolve.ts` (EXISTS — verify and enhance)
- After every N chat messages (currently 5), trigger soul file evolution:
  - Extract new facts, preferences, goals from recent messages
  - Merge into existing soul file sections
  - Version the update (already has `version` field)

#### P10.2: Data-driven updates
- When the user's data changes significantly (new income stream, completed goals, etc.):
  - Trigger a soul file review
  - Update the Goals section with new progress
  - Update Patterns section with observed behaviors

#### P10.3: User-visible memory log
- **File:** `src/app/dashboard/settings/page.tsx` or new page
- Show the user what Jarvis remembers:
  - Current soul file (editable)
  - Memory changelog: "Feb 15: Learned you're targeting $10k MRR by Q2"
  - Delete/edit specific memories

---

### P11: Landing Page + Auth Polish

**What to build:**

#### P11.1: Landing page content alignment
- Fix any remaining text/content alignment issues
- Ensure hero section is visually balanced on all screen sizes
- Test on mobile, tablet, desktop

#### P11.2: Auth flow polish
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

> **P2 is THE feature. Everything else is supporting infrastructure or UI polish around it.
> If you only ship one thing, ship P2. It is the entire product.**

1. **P2 (Agentic Core)** — **TOP PRIORITY** — Claude integration, tool-use, file creation, multi-step execution, prompting. This IS the product.
2. **P3 (Deep Research UI)** — make the agentic work visible and trustworthy
3. **P4 (Web Search)** — first external tool, massive capability unlock
4. **P5 (Mid-work Questions)** — human-in-the-loop, builds trust
5. **P6 (Connectors)** — GitHub, Gmail, Calendar — biggest effort, biggest payoff
6. **P7 (Status Indicator)** — ambient awareness, small effort
7. **P8 (Proactive Loop)** — Jarvis takes initiative
8. **P9 (Memory Evolution)** — partially exists, enhance
9. **P10 (Rich Outputs)** — better deliverables, not urgent
10. **P11 (Polish)** — ongoing

---

## Multi-Agent Coordination Protocol

Multiple Claude Code agents will work on this codebase simultaneously. This section defines how they coordinate to avoid conflicts.

### Branch Strategy

**All agents push to a single shared branch: `jarvis-agents`** (branched from `ui/three-zones-redesign`).

- No per-agent branches. One branch keeps the git graph clean and enables bulk testing.
- Agents commit frequently (after each sub-task) with clear, prefixed commit messages.
- The owner reviews and merges `jarvis-agents` → `master` when ready.

### Work Unit Assignment

Each workstream (P2-P11) is a **self-contained work unit**. Agents are assigned one work unit at a time. Work units are designed so that **no two agents touch the same files simultaneously**.

| Work Unit | Primary Files | Can Run In Parallel With |
|-----------|--------------|--------------------------|
| **P2.1-P2.2: Claude + Tool Framework** | `convex/ai/taskAgent.ts`, `convex/ai/agentTools.ts` (new), `convex/schema.ts` (add anthropicApiKey + agentFiles table), `src/lib/aiModels.ts` | P3, P8 |
| **P2.3-P2.5: Built-in Tools + Prompting** | `convex/ai/agentTools.ts`, `convex/ai/taskAgent.ts` (integrate tool loop) | P3, P8 (after P2.1-P2.2 merges) |
| **P2.6: File Creation System** | `convex/agentFiles.ts` (new), `src/components/dashboard/AgentFileViewer.tsx` (new) | P3, P5, P8 |
| **P2.7: Action Approval System** | `convex/schema.ts` (taskEvents kinds), `src/components/dashboard/TasksContent.tsx` | P4, P8 |
| **P3: Deep Research UI** | `src/components/dashboard/TasksContent.tsx` (agent activity panel only) | P2.6, P4, P8 |
| **P4: Web Search** | `convex/ai/agentTools.ts` (add search tool), `src/app/dashboard/settings/page.tsx` (search key field) | P2.6, P3, P8 |
| **P5: Mid-Work Questions** | `convex/schema.ts` (question kind), `convex/taskEvents.ts`, `src/components/dashboard/TasksContent.tsx` (question UI) | P2.6, P4 |
| **P6: Connectors** | `convex/connectors/` (new dir), `src/app/dashboard/settings/page.tsx` (connections section) | P3, P8 |
| **P7: Rich Outputs** | `src/components/dashboard/TaskOutputRenderers.tsx` (new) | Any |
| **P8: Status Indicator** | `src/components/layout/Sidebar.tsx`, `src/components/layout/DashboardShell.tsx` | P2, P3, P4 |
| **P9-P11** | Various — assign after P2-P8 complete | — |

### Agent Protocol (EVERY agent must follow this)

#### Before Starting Work:
1. **Read this document** (`docs/JARVIS_ROADMAP.md`) to understand the full plan
2. **Read `docs/SHIPPING_LOG.md`** to see what's already been shipped
3. **Read `CLAUDE.md`** for codebase conventions and rules
4. **State your assigned work unit** and what you plan to build — wait for owner approval
5. **Ask clarifying questions** about scope, approach, or edge cases before writing code
6. **Pull latest from `jarvis-agents`** before starting: `git pull origin jarvis-agents`

#### While Working:
1. **Commit after each sub-task** (e.g., after P2.1, after P2.2, not one giant commit at the end)
2. **Commit message format**: `feat(P2.1): description` or `fix(P3): description`
3. **Run `npm run build`** after every commit — it must pass (exit 0)
4. **Push to `jarvis-agents`** after each commit: `git push origin jarvis-agents`
5. **Update this document** when you complete a work unit — mark it as shipped in the priority table
6. **Update `docs/SHIPPING_LOG.md`** with what you shipped, when, and what changed
7. **Do NOT touch files outside your work unit** without checking with the owner first
8. **If you encounter a merge conflict**: pull, resolve, build, push. Never force-push.

#### After Completing Work:
1. Mark the work unit as ✅ Shipped in this document
2. Add a changelog entry to `docs/SHIPPING_LOG.md`
3. Push final commit
4. Report what was built, what files were changed, and any issues found

### File Ownership Rules (Conflict Prevention)

These files are **shared** and require extra care:
- `convex/schema.ts` — only ADD fields/tables, never remove or rename existing ones
- `package.json` — only add dependencies, don't change existing scripts
- `src/app/dashboard/settings/page.tsx` — coordinate if multiple agents need settings UI changes

These files are **owned by specific work units** — only the assigned agent should modify them:
- `convex/ai/taskAgent.ts` → P2.1-P2.5 agent
- `convex/ai/agentTools.ts` → P2.2-P2.3 agent (created), P4 agent (adds search tool)
- `src/components/dashboard/TasksContent.tsx` → P3 agent (activity UI), P5 agent (question UI)
- `convex/connectors/*` → P6 agent only

### Dependency Order

Some work units depend on others. Respect this order:

```
P2.1-P2.2 (Claude + Tool Framework)
    ↓
P2.3-P2.5 (Built-in Tools + Prompting)  ←  depends on tool framework existing
    ↓
P2.6 (File Creation)  ←  uses tool framework to register create_file tool
P2.7 (Action Approval)  ←  adds approval checks to tool execution
P4 (Web Search)  ←  registers search as an agent tool
P5 (Mid-Work Questions)  ←  registers ask_user as an agent tool
    ↓
P6 (Connectors)  ←  registers connector actions as agent tools
    ↓
P9 (Proactive Loop)  ←  needs tools + connectors to be useful
```

Work units without arrows (P3, P7, P8, P10, P11) can run in parallel with anything.

---

*Last updated: February 15, 2026*
