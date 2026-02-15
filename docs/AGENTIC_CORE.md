# Agentic Core (P2) - How It Works

This doc explains the current "agentic core" implementation: multi-step execution, tool calls over user data, pause/resume questions, and how the UI shows progress.

## Big Picture (Simple)

When you click "Run Jarvis" on a task, the backend runs an **agent loop**:

1. Make a plan (a short list of steps).
2. Execute each step one-by-one.
3. During execution, the agent can **call tools** (read your data) instead of guessing.
4. If something is unclear, the agent can **ask a question**, pause, and resume after you answer.
5. The agent writes incremental output to the task so you can watch it grow.

Everything the agent does is logged as `taskEvents`, and the dashboard renders that as "Live activity".

If you're adding tools/connectors or changing provider behavior, also read:
- `docs/AGENT_PLATFORM_PRINCIPLES.md`

## Key Files

- Agent loop: `convex/ai/taskAgent.ts`
- Tool registry/executors: `convex/ai/agentTools.ts`
- Provider wrappers: `convex/ai/llm.ts`
- Task state + events schema: `convex/schema.ts`
- Task events storage/mutations: `convex/taskEvents.ts`
- Activity UI + question cards: `src/components/dashboard/TasksContent.tsx`
- Settings UI (Anthropic + OpenRouter + Google): `src/app/dashboard/settings/page.tsx`

## Data Model Changes

### `tasks`

The agent writes to:

- `agentStatus`: `queued | running | succeeded | failed`
- `agentProgress`: 0-100
- `agentPhase`: human-readable label (what the agent is doing right now)
- `agentPlan`: array of plan step strings
- `agentResult`: markdown output (incremental; appends per step)
- `agentSummary`: short summary string
- `agentState`: JSON string used for pause/resume (continuation state)

### `taskEvents`

The agent emits events to show work:

- `kind`: `status | progress | tool | question | approval-request | note | result | error`
- `toolName`, `toolInput`, `toolOutput`: for tool visualization
- `options`, `answered`, `answer`: for question cards
- `approvalAction`, `approvalParams`, `approved`: approval flow (`request_approval` tool + approve/deny UI)

### `agentFiles`

Agent-created draft documents, created via the `create_file` tool:

- `title`, `content` (markdown), `fileType`
- linked to a `taskId` (optional)

## Provider + API Key Routing

### Which API key is used?

It depends on `userSettings.aiProvider`:

- `openrouter`: uses `userSettings.openrouterApiKey`
- `google`: uses `userSettings.googleApiKey`
- `anthropic`: uses `userSettings.anthropicApiKey` (from console.anthropic.com)

The task agent now **respects the selected provider**.

### Tool-use support by provider

- `anthropic`: full tool loop via the Anthropic SDK (real `tool_use` -> tool execution -> `tool_result` -> continue).
- `openrouter`: tool loop via OpenAI-style function calling (`tools` + `tool_calls`). This works best on models that reliably support tool calling; if a model doesn't call tools, the loop just returns text.
- `google`: "fallback mode" (no model-driven tool calls yet). The agent still emits tool events by explicitly running a couple basic tools (read soul file, list tasks) and then calling the LLM once per step with those results injected as text.

Note: OpenRouter tool calling is supported now, but model quality varies by model.

## Analytics (PostHog)

Server-side analytics live in `convex/lib/posthog.ts`:

- `$ai_generation` events via `captureAiGeneration()` (task agent now captures plan/step/final)
- Agent lifecycle/error events via `captureEvent()` (success/failure, approvals, file creation)

## The Agent Loop (Backend)

All of this lives in `convex/ai/taskAgent.ts`.

### Entry points

- `start` (action): clears previous agent state/events and schedules work
- `runInternal` (internalAction): initial run
- `continueInternal` (internalAction): resume after user answers a question

### Phases

1. **Queued**
  - `tasks.agentStatus="queued"`, emits `taskEvents(kind="status", title="Queued")`
2. **Planning**
  - calls the model with a planning prompt that asks for `planSteps`
  - writes `tasks.agentPlan` and emits "Plan ready"
3. **Execute steps**
  - loops `planSteps[]`
  - for each step:
    - updates `agentPhase`, `agentProgress`, and stores `agentState`
    - calls the model for step output
    - appends step markdown to `tasks.agentResult`
4. **Finalize**
  - calls the model to "tidy" the draft into a final `summary` + `resultMarkdown`
  - marks task succeeded and emits `taskEvents(kind="result", title="Output ready")`

### Pause / Resume

If the model calls `ask_user`, the tool executor:

1. Creates a `taskEvents(kind="question")` event.
2. Returns a "pause" response back to the agent loop.
3. The agent sets:
  - `tasks.agentPhase = "Waiting for input"`
  - `tasks.agentState = { stepIndex, planSteps, waitingForEventId }` serialized as JSON
4. The UI renders that question as buttons.
5. When the user clicks an option, `taskEvents.answerQuestion`:
  - patches the event with `answered=true` and `answer`
  - schedules `internal.ai.taskAgent.continueInternal`

On resume, the agent reads the answered question and injects:

```
## Clarification
Q: ...
A: ...
```

into the next step prompt.

If the model calls `request_approval`, the flow is similar:

1. Creates a `taskEvents(kind="approval-request")` event.
2. Agent sets `tasks.agentPhase = "Waiting for approval"` and pauses.
3. UI renders Approve/Deny buttons.
4. `taskEvents.respondApproval` patches the event and schedules `continueInternal`.

## Tool System

Tool definitions and implementations live in `convex/ai/agentTools.ts`.

Shipped tools:

- `read_soul_file`
- `list_tasks`
- `list_income_streams`
- `list_ideas`
- `list_mentorship_sessions`
- `search_insights`
- `get_task_result`
- `ask_user` (pause point)
- `create_file` (creates a draft in `agentFiles` linked to the current task)
- `request_approval` (pause point for irreversible/external actions)
- `web_search` (public web search, requires approval per task)
- `read_url` (public URL read, requires approval per task)

These tools execute on the backend using internal queries so they can be called from Convex actions without a client auth context.

### Approval Scopes (Per-Task)

Some tools (web tools today; connector tools later) must be approved before use.

- The first time `web_search` or `read_url` runs for a task, the tool executor emits `taskEvents(kind="approval-request")` and pauses the agent.
- When the user approves/denies, `continueInternal` updates `tasks.agentState` with:
  - `approvedTools`: `{ [toolName]: true }`
  - `deniedTools`: `{ [toolName]: true }`
- Subsequent tool calls in the same task reuse that decision without re-prompting.

Web search providers:

- Default: Jina (`https://s.jina.ai/...`) returns an LLM-friendly digest (no API key).
- Optional: Tavily (structured results; requires API key).
- Optional: Perplexity Search API (structured results; requires API key).

## Prompts Used (Task Agent)

These prompts are embedded in `convex/ai/taskAgent.ts`. They are simple string templates.

### System prompt

`buildAgentSystemPrompt()` (high-level rules + output constraints):

- "Always use tools instead of guessing"
- "Never fabricate"
- "If ambiguous, call ask_user with options"
- "Return ONLY valid JSON when asked"
- "Prefer checklists/tables when helpful"

### Plan prompt (PLAN)

`planPrompt` asks for JSON:

```json
{ "planSteps": string[] }
```

and explicitly instructs the model to call `read_soul_file`, `list_tasks`, and `search_insights`.

### Step prompt (EXECUTE)

For each step, the prompt includes:

- Task title + note
- Soul excerpt
- Full plan list
- Current step
- Output so far
- (Optional) last clarification answer block

and requests JSON:

```json
{ "stepSummary": string, "stepOutputMarkdown": string }
```

### Final prompt (FINALIZE)

Includes the task, plan, and draft output and requests JSON:

```json
{ "summary": string, "resultMarkdown": string }
```

## UI: How Progress Is Rendered

`src/components/dashboard/TasksContent.tsx`:

- Queries `api.taskEvents.listByTask` and renders the last ~14 events.
- Special-cases `kind="question"`:
  - shows a "Question" card
  - renders option buttons
  - clicking an option calls `api.taskEvents.answerQuestion`
- Special-cases `kind="approval-request"`:
  - shows an approval card
  - approve/deny calls `api.taskEvents.respondApproval`
- Shows agent-created files (from `agentFiles`) in a "Files" section, with an inline viewer/editor.

### Output rendering (Rich vs Raw)

The output panel supports:

- `Rich`: markdown rendered (tables, checklists, etc.)
- `Raw`: plain text (no markdown rendering)

## What Is NOT Done Yet (On Purpose)

- Enforcing approvals on real connector tools (email/calendar/github) (roadmap P6)
- Connector tools (P6)
- Conversation context summarization/truncation (P2.8)
 - Google provider tool-use loop (Google still runs in fallback mode; no model-driven tool calling yet)

## Where Vercel AI SDK or Anthropic SDK Helps

### Anthropic SDK

We already use the Anthropic SDK for the tool loop (best match for this backend architecture).

Benefits:
- Native `tool_use`/`tool_result` flow
- Fewer adapter layers

### Vercel AI SDK

Vercel AI SDK can help if you want:

- One unified interface across providers (OpenAI, Anthropic, OpenRouter-compatible, etc.)
- Built-in tool calling abstractions and streaming helpers
- A nicer way to represent multi-step flows, tool results, and partial streaming output

Tradeoff here:

- Our agent loop runs in Convex actions (`"use node"`). Vercel AI SDK can run in Node, but it's more commonly used in Next route handlers.
- It would still be useful as a shared "provider layer", but not required for the core loop.

If we adopt it, the cleanest usage is:

- Keep the agent loop in Convex
- Replace `convex/ai/llm.ts` with an AI SDK based provider module
- Optionally add streaming output to `agentResult` (P3.2)
