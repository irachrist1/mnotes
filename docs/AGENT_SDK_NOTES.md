# Jarvis — Agent Handover Brief

**Status: Pre-alpha. The UI shell exists. The agent is not functional.**

Read this document first. Then read `CLAUDE.md`. Then scan the codebase starting from `agent-server/src/`. Then start shipping.

---

## What Jarvis Is Supposed to Be

A personal AI agent — not a productivity dashboard, not a task manager. A conversational agent that lives on web and mobile, is connected to your email, calendar, GitHub, Slack, and anything else you authorize, has persistent memory about who you are and what you care about, and runs proactive tasks on a schedule.

The vision: ask it "anything urgent?" and it actually goes through your Gmail, Slack, calendar, and GitHub, reasons about what's important to *you specifically*, and surfaces what matters. It takes 1–2 minutes because it's doing real work, not a keyword search. It remembers that you prefer short answers, that you're building X, that last time you asked about Y you wanted Z. It gets smarter the more you use it.

The agent runs on your machine (or a cheap VPS) using your Claude Code subscription — not paying per-token. For personal use this is essentially free with a $20/month subscription. The front-end is just a web UI backed by Convex for persistence and real-time sync across devices.

---

## Current Reality — What's Actually Built vs What's Broken

### What exists and roughly works
- **Convex backend**: `chatThreads`, `chatMessages`, and `memoryEntries` tables are wired up with queries and mutations. Thread management, message persistence, and the three-tier memory schema are in place.
- **Front-end shell**: `JarvisShell.tsx` (sidebar with Chat/Memory/Settings nav), `JarvisChat.tsx` (chat UI with SSE parsing, thread switcher, tool cards), `MessageStream.tsx` (markdown renderer), `ToolCallCard.tsx` (expandable tool call display), `memory/page.tsx` (memory browser), `settings/page.tsx` (settings form).
- **Agent server structure**: `agent-server/` is an Express process with auth detection, SSE streaming, and placeholder MCP server stubs for Gmail, Calendar, GitHub, Outlook, and Memory.
- **Auth detection logic**: `agent-server/src/auth.ts` correctly detects whether to use `ANTHROPIC_API_KEY`, `~/.claude/credentials.json` (subscription), or `GOOGLE_AI_KEY` in priority order.

### What is broken and makes the whole thing unusable right now

**1. Agent SDK `query()` never receives the API key.**
`agent-server/src/agent.ts` has a `getAgentEnv()` function in `auth.ts` that builds the correct env overrides — but it is never called in `agent.ts`. The auth config is detected but the env vars are never applied before `query()` runs. In subscription mode this is irrelevant (reads `~/.claude/credentials.json` automatically), but for API key mode the key is never set. Fix: call `getAgentEnv(config)` and apply those env vars to `process.env` before calling `query()`.

**2. The Next.js API proxy sends `userId: "default"` to the agent.**
`src/app/api/agent/route.ts` hardcodes `userId: "default"`. This means all memory tool calls will read/write to a single shared "default" user in Convex, not the actual logged-in user. The route has a TODO comment about this. Fix: extract the real Convex user ID from the session before proxying the request.

**3. The API proxy sends no soul file or memories to the agent.**
The `ChatRequest` type expects `soulFile` and `memories[]` — the system prompt is built from these. The Next.js proxy never fetches them from Convex before forwarding to the agent server. So the agent has zero context about the user — no personality, no preferences, no history. Fix: before proxying, fetch the user's soul file and persistent memories from Convex and inject them into the request body.

**4. The memory MCP server TypeScript source is never compiled.**
`agent-server/src/agent.ts` references `mcp/memory-server.js` (the compiled output) but the repo only has `mcp/memory.ts` (the TypeScript source). There is no `memory-server.js`. The agent server must be compiled before running, or configured to run TypeScript directly with `tsx`. Check `agent-server/package.json` — if there's no build step, add one.

**5. All connector MCP servers (Gmail, Calendar, GitHub, Outlook) are likely stubs.**
The files exist (`agent-server/src/mcp/gmail.ts`, etc.) but need to be read and verified. They likely need OAuth tokens fetched from Convex before making API calls. Most are probably incomplete.

**6. Settings page connector section uses non-functional placeholder UI.**
The connectors section in `src/app/dashboard/settings/page.tsx` shows emoji icons (📧, 📅, 📨, 🐙) and a "Connect" button that does nothing. The old codebase had working Google OAuth and GitHub OAuth flows in `convex/connectors/`. These need to be wired into the new settings page.

**7. No way to start the agent server easily.**
There is no root-level script to run both the Next.js dev server and the agent server together. A developer (or agent) opening this project has no way to know they need to `cd agent-server && npm install && npm run dev` separately in another terminal.

**8. The `connectors` field is never fetched and passed to the agent.**
`JarvisChat.tsx` never fetches which integrations the user has connected. So the agent server always receives `connectors: []` and spawns zero MCP servers. Even if Gmail worked, it would never be called.

**9. There is no soul file system.**
The old codebase had `convex/soulFile.ts` for a user-editable profile blob. The new architecture references it in `ChatRequest.soulFile` but there is no Convex function to create or fetch it, and no UI to edit it. The agent will have no persistent identity context until this is added.

---

## Priority Order for Shipping

Ship these in order. Do not start the next item until the previous one is testable end-to-end.

### P0 — Make the agent actually run (nothing else matters until this works)

**P0.1: Research current Agent SDK API before touching any code**

The Agent SDK is evolving fast. Before changing anything, fetch and read the current documentation:
- Anthropic Agent SDK: `https://docs.anthropic.com/en/docs/claude-code/sdk`
- Check the npm package version in `agent-server/package.json` and compare to latest
- Verify: does `query()` still accept the same `options` shape? Are `allowedTools`, `mcpServers`, `systemPrompt`, `settingSources`, `cwd` still the right field names?
- Verify: how does subscription auth actually work? Does the SDK read `~/.claude/credentials.json` automatically, or does it need something else?
- Verify: what does the message stream from `query()` actually look like? The current code checks `message.type === "system"`, `"assistant"`, `"tool_result"` — are these still the right types and subtypes?

Do not skip this step. The code may be working against a stale API.

**P0.2: Fix API key injection and verify subscription mode**

In `agent-server/src/agent.ts`, before the `query()` call:
1. Import and call `getAgentEnv(config)` from `auth.ts`
2. Apply the returned env vars to `process.env` (e.g. `Object.assign(process.env, agentEnv)`)
3. For subscription mode: verify `~/.claude/credentials.json` exists on the local machine (the dev machine running the agent server). If `claude` CLI is installed and logged in, this file should exist. Test by logging in via `claude` CLI and checking the file path.

**P0.3: Confirm agent server starts and compiles**

Check `agent-server/package.json`. Determine the correct way to start the server:
- If it uses `tsx` or `ts-node`, verify those are in devDependencies and the start script is correct
- If it compiles first, run the build and check that `dist/mcp/memory-server.js` exists
- Fix whichever path is broken
- Add a `dev` script that runs the server with hot-reload

Then add a root-level `npm run agent` or update `package.json` to use `concurrently` to start both servers.

**P0.4: Wire real userId through the API proxy**

In `src/app/api/agent/route.ts`:
1. Import the Convex auth utilities — look at how other Next.js server components in this project access the Convex user ID (check `convex/lib/auth.ts` and any server components using `ConvexAuthNextjsServerProvider`)
2. Extract the authenticated user's Convex ID
3. Pass it as `userId` in the agent server request
4. If unauthenticated, return 401

**P0.5: Send a real message and get a real response**

At this point you should be able to: sign in → type a message → see the agent respond (even without memory, soul file, or connectors). The SSE stream should arrive in the browser and display in the chat UI. Fix anything that prevents this from working.

### P1 — Memory works end to end

**P1.1: Verify and fix memory MCP server**

Read `agent-server/src/mcp/memory.ts` in full. Verify the JSON-RPC over stdin/stdout protocol is correct and complete. The tools should be: `memory_save`, `memory_search`, `memory_list`. Each tool should call Convex using `ConvexHttpClient` with `CONVEX_URL` and `CONVEX_DEPLOY_KEY` from env, scoped to `USER_ID`. Test by running the memory server directly:
```
USER_ID=test CONVEX_URL=... CONVEX_DEPLOY_KEY=... node dist/mcp/memory-server.js
```
Send it a `{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}` request and verify the response.

**P1.2: Soul file — create Convex function + UI**

Add `convex/soulFile.ts` with at minimum:
- `get` query: returns the user's soul file text (or null if not set)
- `upsert` mutation: creates or updates the soul file text

Add a "Your profile" section to `src/app/dashboard/memory/page.tsx` with a textarea that lets the user read and edit their soul file. The soul file is a free-text description of who they are, their projects, preferences, and how they want Jarvis to behave.

**P1.3: Inject soul file + persistent memories into agent requests**

In `src/app/api/agent/route.ts`, after resolving userId:
1. Fetch soul file: `await convex.query(api.soulFile.get, { userId })`
2. Fetch persistent memories: `await convex.query(api.memory.listByTier, { userId, tier: "persistent", limit: 50 })`
3. Add both to the request body before forwarding to the agent server

Verify by starting a conversation and asking "what do you know about me?" — the agent should be able to read and reference the soul file.

### P2 — Connectors work end to end

**P2.1: Fix settings page connector icons**

Replace emoji with proper Lucide icons in `src/app/dashboard/settings/page.tsx`:
- Gmail → `Mail` from lucide-react
- Google Calendar → `CalendarDays` from lucide-react
- Outlook → `Mail` (use a label to differentiate)
- GitHub → `Github` from lucide-react

**P2.2: Wire Google OAuth connect/disconnect**

The OAuth flow exists in `convex/connectors/googleOauth.ts`. Wire it into the new settings page:
1. "Connect" for Gmail/Calendar opens a popup calling `convex.action(api.connectors.googleOauth.start, { scope: "gmail" | "google-calendar" })`
2. The popup redirects through Google OAuth and the callback at `/connectors/google/callback` posts back to the opener
3. On success, the settings page shows "Connected ✓" and a "Disconnect" button
4. Disconnect calls a mutation that deletes the token from `connectorTokens`

Test end-to-end by connecting Gmail, then asking Jarvis "check my last 5 emails."

**P2.3: Wire GitHub OAuth connect/disconnect**

Same pattern as P2.2 but for `convex/connectors/githubOauth.ts`.

**P2.4: Pass connected connectors to the agent**

In `src/app/api/agent/route.ts`, after resolving userId, fetch which connectors the user has active tokens for. Pass the list of connector IDs (e.g. `["gmail", "github"]`) to the agent server. This enables the agent to spawn the right MCP servers.

**P2.5: Verify and fix connector MCP servers**

Read each of `agent-server/src/mcp/gmail.ts`, `calendar.ts`, `github.ts`. For each one:
1. Verify it fetches the OAuth token from Convex using `USER_ID`
2. Makes real API calls (Gmail API, Google Calendar API, GitHub API)
3. Returns results in the MCP JSON-RPC response format
4. Handles token expiry / refresh

Start with GitHub (read-only, PAT or OAuth, simpler to test). Then Gmail. Calendar last.

### P3 — Polish

**P3.1: Welcome state personalization**

The welcome state in `JarvisChat.tsx` shows 4 static prompt suggestions. Make them conditional on which connectors are connected. Fetch connected connector IDs in the chat component and only show "Check my Gmail" if Gmail is connected, etc.

**P3.2: Agent server URL from settings**

Currently `src/app/api/agent/route.ts` reads `AGENT_SERVER_URL` from `process.env`. The settings page lets users configure this URL but saves it to Convex. These need to be connected — either read from Convex per-request on the server side, or make the env var the canonical source and document how to change it.

**P3.3: Mobile testing**

Test on a real phone. Common issues to check:
- Textarea zoom on iOS (need `font-size: 16px` minimum = `text-base`)
- Thread dropdown overflow with `position: absolute` in a flex container
- Scroll behavior when keyboard opens

---

## Architecture Reference

```
Browser (Next.js)
  └── /dashboard → JarvisChat.tsx
        ├── Convex hooks: listThreads, listMessages, addUserMessage, addAssistantMessage
        └── POST /api/agent → Next.js API route (server-side proxy)
              ├── Resolves userId from Convex session          ← BROKEN: hardcoded "default"
              ├── Fetches soulFile + persistent memories       ← MISSING
              ├── Fetches connected connectors                 ← MISSING
              └── POST agent-server:3001/api/chat → SSE stream
                    └── agent-server/src/agent.ts
                          ├── query() from @anthropic-ai/claude-agent-sdk
                          │     ├── Auth: ANTHROPIC_API_KEY or ~/.claude/credentials.json
                          │     │         ← BROKEN: env never applied from getAgentEnv()
                          │     ├── Tools: WebSearch, WebFetch, Skill
                          │     └── MCP servers (subprocesses):
                          │           ├── memory-server (always on → Convex)  ← may not compile
                          │           ├── gmail-server (if connected)          ← likely stub
                          │           ├── calendar-server (if connected)       ← likely stub
                          │           ├── github-server (if connected)         ← likely stub
                          │           └── outlook-server (if connected)        ← likely stub
                          └── Streams SSE events back through the chain to browser
```

### Key files to understand first
| File | What it does |
|---|---|
| `agent-server/src/index.ts` | Express server, `/api/chat` and `/api/status` routes |
| `agent-server/src/agent.ts` | `query()` call, MCP server config, SSE event emission |
| `agent-server/src/auth.ts` | Detects subscription vs API key vs Gemini |
| `agent-server/src/mcp/memory.ts` | Memory MCP server (JSON-RPC subprocess) |
| `src/app/api/agent/route.ts` | Next.js proxy — the main thing to fix in P0 |
| `src/components/chat/JarvisChat.tsx` | Main chat UI |
| `convex/messages.ts` | Thread and message CRUD |
| `convex/memory.ts` | Three-tier memory system |
| `convex/connectors/googleOauth.ts` | Google OAuth flow (exists, needs UI wiring) |
| `convex/connectors/githubOauth.ts` | GitHub OAuth flow (exists, needs UI wiring) |
| `convex/connectors/tokens.ts` | OAuth token storage |

### Environment variables
```bash
# .env.local (Next.js)
NEXT_PUBLIC_CONVEX_URL=https://...
AGENT_SERVER_URL=http://localhost:3001
AGENT_SERVER_SECRET=                        # optional shared secret

# agent-server/.env
CONVEX_URL=https://...
CONVEX_DEPLOY_KEY=...
ANTHROPIC_API_KEY=                          # OR log in with `claude` CLI
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929  # optional model override
GOOGLE_AI_KEY=                              # optional Gemini fallback
NEXT_PUBLIC_APP_URL=http://localhost:3000   # for CORS
```

---

## Research Required Before Coding

The Agent SDK evolves frequently. Before touching the agent code, fetch and read:

1. **Current Agent SDK docs**: `https://docs.anthropic.com/en/docs/claude-code/sdk`
   - Verify `query()` options shape: `model`, `systemPrompt`, `allowedTools`, `mcpServers`, `settingSources`, `cwd`, `resume`
   - Verify subscription auth mechanism
   - Verify message stream event types and shapes

2. **Current MCP specification**: `https://modelcontextprotocol.io/specification`
   - Verify the JSON-RPC protocol used by the memory MCP server is correct

3. **Convex auth in Next.js server context**: `https://docs.convex.dev/auth/nextjs`
   - How to get the authenticated user's ID from a Next.js API route using `@convex-dev/auth/nextjs`

Do not assume the existing code is using the current API. Check first.

---

## Definition of Done

The product is ready to use daily when:
1. `npm run dev` (or `npm run dev:all`) starts everything and you can chat in the browser
2. Jarvis uses the Claude Code subscription from `~/.claude/credentials.json` — no API key needed
3. Sending a message gets a real AI response with visible streaming
4. Jarvis remembers things across conversations (soul file + memory tools work)
5. You can connect GitHub in Settings and ask "summarize my open PRs" and get a real answer
6. You can connect Gmail in Settings and ask "anything urgent in my email?" and get a real answer
7. The memory page shows your stored memories and you can search them

Everything else — Outlook, mobile, proactive scheduling, voice, advanced analytics — comes after this baseline is solid.

---

*Last updated: 2026-02-17. Update this doc when a P0/P1/P2 item ships.*
