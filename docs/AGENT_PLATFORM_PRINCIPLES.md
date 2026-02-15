# Agent Platform Principles (Read This Before Adding Tools)

This doc is a "first principles" contract for building MNotes Jarvis into an agent platform (OpenClaw-like core, but with a nicer dashboard and simpler UX).

If you are about to add a tool, connector, or output renderer: read this first.

## What We Are Building (Simple)

Jarvis is not "a chat response".

Jarvis is a loop that:

1. Makes a plan.
2. Executes steps.
3. Uses tools as its hands (reads data, creates drafts, asks the user, requests approval).
4. Shows every action in the dashboard (events timeline).
5. Produces a deliverable (document/checklist/table), not just paragraphs.

The product is the loop + the visible work, not the final text.

## Provider Reality: Anthropic Tool-Use vs OpenRouter Function-Calling

### What is "tool use"?

"Tool use" means the model decides when to call a tool and with what JSON input, and then continues after it sees the tool result.

In our codebase:

- Anthropic: real tool loop (native `tool_use` / `tool_result`).
- OpenRouter: tool loop via OpenAI-style function calling (`tools` + `tool_calls`). Reliability depends on the specific model.
- Google: fallback mode today (we run a couple read tools explicitly, then call the model; the model does not autonomously call tools).

### Why would you want real function-calling with OpenRouter?

You want it if any of these are true:

- You want to use only an OpenRouter key (one billing surface) but still get autonomous tool calling.
- You want to run tool-use on cheaper/faster models that are available via OpenRouter.
- You want a single multi-provider agent runtime where tool calls behave similarly regardless of provider.

### Which is better, faster, and more effective?

In practice:

- Anthropic tool_use is the most reliable today for agentic work. Fewer "JSON drift" failures, better tool selection, and better follow-through step to step.
- OpenRouter function-calling can be cheaper and sometimes faster, but reliability depends on the specific model and how strictly it follows the function schema.

Simple rule:

- If your priority is "it actually uses tools correctly": prefer Anthropic.
- If your priority is "cost, breadth of models, one key": OpenRouter function-calling is a good option (but test model-by-model).

This is not a philosophical choice. It's an engineering tradeoff between reliability and provider flexibility.

## Output Rendering: Rich vs Raw

We store agent outputs as markdown so we can render:

- tables
- checklists
- structured docs

But users also need a "no surprises" view:

- raw text (no markdown parsing, no rendering quirks)

Policy:

- Always store the canonical output as a string (`tasks.agentResult`).
- UI must support both "Rich" and "Raw" views for that string.

## File Creation: Shipped (P2.6)

Jarvis can create first-class draft documents:

- `agentFiles` table (`convex/schema.ts`)
- CRUD (`convex/agentFiles.ts`)
- `create_file` tool (`convex/ai/agentTools.ts`)
- Dashboard viewer/editor (`src/components/dashboard/AgentFileViewer.tsx`)

Remaining follow-ups are UX polish, not core capability: better discovery, export flows, and richer output renderers.

## Web Tools: Shipped (P4)

Jarvis can now:

- `web_search` (public web search, gated by approvals per task; can use Tavily or Jina)
- `read_url` (fetch + extract a public URL into readable text, gated by approvals per task)

Product requirement:

- The agent must ask for approval before using web tools.
- The approval decision should be sticky per task (approve once, reuse).

## Tool Registry vs Connector Dashboard

There are two kinds of tools:

1. Built-in tools: always available (read your MNotes data, ask_user, create_file).
2. Connector tools: require user setup (OAuth/API keys), have connect/disconnect status, and often require approvals.

Product requirement:

- The dashboard must expose a clear list of "what Jarvis can do right now" based on connections/settings.
- The agent must never pretend it can do a connector action if it's not connected.

## Approval and Safety: Default Policies

We categorize every tool:

- `read`: safe, auto-approved
- `write_internal`: writes to the user's MNotes data (usually auto-approved, but still logged)
- `write_external`: irreversible or external side-effects (must require explicit approval)

Policy:

- No external side-effects without a first-class approval UI event and an explicit "Approve" click.

## Tool Addition Checklist (Non-Negotiable)

If you add a tool or connector, you must ship all of this (or explicitly mark what's deferred and why):

1. Backend tool definition: name, description, input schema, executor.
2. Logging: emit `taskEvents(kind="tool")` with toolName/input/output summary.
3. Safety classification: read/write_internal/write_external and approval gating where needed.
4. UX visibility: user can see it in Settings as a capability (built-in or connected).
5. Connection management (if external): connect/disconnect UI + token storage + refresh strategy.
6. Failure behavior: tool errors must surface in `taskEvents(kind="error")` and the agent must recover or stop cleanly.
7. Analytics: add PostHog events for lifecycle and errors (see `convex/lib/posthog.ts`).
8. Documentation: update `docs/AGENTIC_CORE.md` and add any new prompts/tool docs.

If we skip these, we get "agent cosplay": impressive text, broken actions, and user distrust.

## "Make MNotes Like OpenClaw, But Better"

OpenClaw is an agent runtime/control plane. Our advantage is we can ship a productized version of that loop:

- first-class personal/work data model (tasks, ideas, income, insights)
- a dashboard that shows real work (events, tools, approvals, files)
- faster interface (optimistic UI, small payload events, incremental updates)
- built for normal users (no YAML, no prompt engineering required)

The core is consistency:

- every action is logged
- every tool is visible
- every external side-effect is approved
- every task produces a tangible deliverable

