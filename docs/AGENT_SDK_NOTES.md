# Agent SDK — Research Notes & Architecture Learnings

Organized from exploratory notes after ~1 week of building a personal AI agent (Luna L1) using the Anthropic Agent SDK. These notes cover what the SDK is, how it differs from other frameworks, architecture decisions, real-world costs, and deployment strategies.

---

## 1. What Changed — Why the Hype Is Justified

AI agents have existed for a while (earlier builds on this stack used a custom agent for daily planning). The shift happened when Anthropic released their **Agent SDK** — a way for developers to build custom agents on top of the same technology that powers Claude Code. Claude Code is currently one of the strongest agents on the market, so this is a meaningful unlock.

The innovation is not one big thing — it is the combination of many small, well-designed details that together make it feel like you have Claude Code's power applied to your own use case.

---

## 2. What an Agent Actually Is

At the core, an agent is three things:

1. **An LLM** (e.g. Claude Sonnet, Opus)
2. **A set of tools** the LLM can invoke
3. **A loop** where the agent executes tools, reviews results, and keeps going until it decides the task is complete

The execution loop is literally a `while` loop: call the LLM → it picks a tool → execute it → append the result → loop again. Simple in theory, but there is a lot of boilerplate: conversation history management, tool execution, edge case handling.

Libraries like Vercel's AI SDK abstract the loop. The Agent SDK does too, but with a fundamentally different approach that results in a noticeably better experience.

---

## 3. Vercel AI SDK vs Anthropic Agent SDK

They both let you create agents. The path they take is completely different.

| Concern | Vercel AI SDK | Anthropic Agent SDK |
|---|---|---|
| Conversation history | You maintain the `messages` array | Managed automatically via session ID |
| Context compaction | You implement it | Automatic (same system Claude Code uses) |
| Built-in tools | None | Bash, Read, Edit, Grep, Glob, WebSearch, WebFetch |
| Sub-agents | Manual | First-class, built-in support |
| Skills / capability system | None | Progressive disclosure via skills folders |

The Agent SDK's built-in tools are particularly strong. The hypothesis is that because Claude Code only ships a small number of tools, Anthropic focused intensely on making each one excellent. The web search and web scraping tools in particular are noticeably better than ad-hoc alternatives.

---

## 4. Conversation & Context Management

**Sessions**: The SDK provides a session ID and manages all conversation context internally. You do not pass a messages array yourself. When context gets long, the SDK automatically compacts earlier conversation turns (summarizes them) to preserve token budget — same mechanism Claude Code uses internally. This is a significant benefit for long-running workflows that previously required custom compaction logic.

**Caveat — persistence is your responsibility**: The SDK manages context in-memory within a session. Sessions appear to have a ~30-day lifespan. If you want to render conversation history in a UI, or sync across devices, you must persist messages yourself in a database. Convex was used for this project and worked well for real-time cross-device sync.

---

## 5. Tools via MCP

Tools are defined using **Model Context Protocol (MCP)**. Each tool has:

- `name` — the tool identifier
- `description` — **critically important**: this is how the agent decides whether to use the tool. Vague descriptions lead to the agent not knowing when to call it. Write descriptions carefully.
- A Zod schema defining the input shape
- A handler function that executes when the tool is called

Tools are bundled into an MCP server and passed into the query. On top of custom tools, the SDK provides the same built-in tools as Claude Code: `Bash`, `Read`, `Edit`, `Grep`, `Glob`, `WebSearch`, `WebFetch`. These are added to the `allowedTools` array by name.

The SDK handles the execution loop, tool call parsing, and result injection. You only define the tools and their handlers.

---

## 6. Skills — Progressive Disclosure of Capabilities

Skills are a way to give the agent specific, complex capabilities without bloating the system prompt on every request. They are loaded on-demand.

**Key details:**

- Skills are organized as folders in the file system, not code objects
- Each skill folder contains a `skill.md` file with YAML metadata (name, description) and detailed markdown instructions
- Skills are **not** passed into the query explicitly — they are auto-discovered at startup
- The SDK scans the skills folder, reads just the name and description from each `skill.md`, and adds those lightweight descriptions to the system prompt
- When a user request matches a skill's description, the agent loads the full skill instructions into context at that moment

This is called **progressive disclosure**: only relevant skills are loaded, so you can have dozens of skills without degrading context quality. The agent figures out which skills to load based on descriptions — which makes writing good descriptions essential.

**Common setup mistake**: The `Skill` tool must be explicitly included in the `allowedTools` array, and `settingsSources` + `cwd` must be configured so the SDK knows where to look for the skills folder. Project skills (scoped to one project) and user skills (cross-project) are configured separately here.

---

## 7. Memory Architecture

Memory is one of the most interesting architectural problems in personal agents. There is no single right answer, but a three-tier model worked well in practice.

### Three Tiers

| Tier | Purpose | Loaded |
|---|---|---|
| **Session** | Current conversation context — what's happening right now | Every conversation |
| **Persistent** | Important facts, preferences, corrections — "Chris builds productivity apps, has a dog named Luna" | Every conversation |
| **Archival** | Heavy reference material — full documents, past project notes, research — not needed constantly | On demand |

All memories stored in Convex, queryable by the agent via custom tools.

### Making the Agent Proactively Maintain Memory

The key insight: don't just process conversation history after the fact. Instead, explicitly instruct the agent to maintain memory as it works.

The system prompt includes instructions like:
- *Use the memory tools proactively to save critical information without being asked*
- *Save a memory whenever the user gives you a correction*

Combined with a memory skill that defines exactly when to save, this means the agent automatically recognizes and persists important information, corrections, and preferences — without the user explicitly asking it to "remember" things. This is what makes a personal agent feel genuinely personalized vs a generic chatbot.

### Custom Agent Memory Tools

The agent has direct access to tools for reading, writing, searching, and archiving memories in the Convex database. This is more robust than building a separate post-processing pipeline to extract memories from conversation history.

---

## 8. Cost Reality — The Honest Numbers

The Agent SDK (and agentic workflows in general) are expensive. Understanding the real costs before building for others is critical.

**Observed costs per message:**
- Heavy tool-call messages (e.g., "find everything urgent I need to respond to") using Opus 4.6: **$2–3 per query**
- Normal conversational messages: **$0.07–0.30 per query**

**Estimated personal usage:** $200–400/month at active usage levels.

### The Subscription Offset

Anthropic currently allows using your Claude Code subscription to fund Agent SDK token usage. At the time of writing, the $200/month Claude Code plan is estimated to provide the equivalent of ~$2,000 of API tokens — making personal experimentation essentially free. This is only for personal use. If you deploy for other users, you pay API pricing.

### Consumer SaaS Is Not Viable Yet

At $100+ per user per month in API costs, a consumer product would need to charge ~$200/month to operate safely. With ChatGPT and Claude at $20/month (including free tiers), this is not a realistic consumer pricing model right now.

### B2B Use Cases Work

Where the economics make sense:
- Business workflows with clear ROI per agent run
- Example: HIPAA compliance audits — $50–100 to generate a first-pass audit report; saves $5,000–10,000 in engineering time
- Any workflow where the agent run cost is small relative to the value of the output

The pattern: **high-value, low-frequency, clearly scoped business tasks** where a company can calculate concrete savings.

### Cost Will Improve

Non-Anthropic models can be used with the Agent SDK (though it requires some workarounds). Local LLMs are theoretically possible but were not performant enough on current hardware at time of testing. Expect this to improve over the next 1–2 years as models get cheaper and local inference gets faster, which should eventually make consumer use cases viable.

---

## 9. Database — Why Convex

Convex was used for all persistence (conversation history, memory entries, user settings, cron jobs).

Key advantages for agentic apps:
- **Real-time by default** — conversation syncs live across web and mobile without custom WebSocket infrastructure
- **Infrastructure as code** — schema, functions, and queries are all in the codebase, so the AI coding assistant (Claude Code) fully understands the data layer without needing an MCP connection to a separate database service
- **Built-in crons** — scheduled jobs live in the same codebase; used here for morning digest workflows (check for critical overnight messages, etc.)
- **Good log tooling** — debugging Convex functions is significantly easier than spinning up a separate backend service

Crons power the proactive automation layer: every morning the agent summarizes overnight action items and sends them as a push notification.

---

## 10. Deployment Strategy

The Agent SDK runs on a machine — it needs somewhere to live to work when your laptop is off. Two approaches were used in practice:

### VPS (Hetzner)
- Cheap virtual private server running 24/7
- Claude Code running with Anthropic subscription logged in
- Handles requests when the local machine is off
- Limitation: cannot access Mac-only tools (iMessages, local Mac apps)

### Local Machine Toggle
- UI toggle lets you point the frontend at the local machine instead of the VPS
- Local machine has access to iMessages, Mac system tools
- Preferred when available for full capability

Both instances share the same Convex database for conversation history and memory, so state is seamless regardless of which machine is responding.

**Caveat**: Secure, production-grade deployment of Agent SDK apps is still a relatively new problem. Best practices for multi-tenant deployment, auth, isolation, and scaling are still evolving. Worth further research before deploying to others.

---

## 11. What Was Not Covered (Further Areas to Explore)

The following Agent SDK capabilities were not explored in depth but are worth investigating:

- **Sub-agents**: Spawning specialized child agents for parallel or delegated work
- **Computer use**: The agent directly controlling a computer (clicking, typing, navigating UIs)
- **Streaming**: Token-level streaming from the agent loop to a UI in real time
- **Advanced memory API**: The SDK has a built-in beta memory command — limited at time of writing but worth monitoring
- **Model routing**: Strategies for routing simpler queries to cheaper models (Haiku) and complex ones to Opus

---

## 12. Practical Takeaways

1. **Write tool and skill descriptions like you write documentation** — they are the agent's decision inputs, not just labels.
2. **Don't rely on the SDK for persistence** — it manages context, not conversation history. Use a real database.
3. **Build memory proactively** — instruct the agent to maintain memory as a first-class behavior, not as a post-processing step.
4. **Budget before you build for others** — run cost projections at realistic usage levels before committing to a consumer pricing model.
5. **Use Claude Code subscription for personal tools** — dramatically lowers the cost of personal experimentation.
6. **B2B first** — if you want to monetize agent work today, target business workflows with a clear $/run ROI.
7. **VPS + local toggle** is a practical deployment pattern for personal agents that need both 24/7 availability and access to local Mac tools.

---

*Notes captured: 2026-02-17. Agent SDK is evolving rapidly — features and pricing will likely change.*
