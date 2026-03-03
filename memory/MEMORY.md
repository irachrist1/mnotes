# Project Memory: mnotes (Jarvis)

## Project Overview
- App called "Jarvis" — AI assistant built on Next.js + Convex
- Agent server at `agent-server/` runs separately on port 3001
- Frontend proxies chat requests through Next.js `/api/agent` → agent server → Claude Agent SDK

## Key Architecture
- `npm run dev` — Next.js on port 3000
- `npm run agent` — agent server on port 3001 (`tsx watch src/index.ts`)
- `npx convex dev` — Convex backend

## Agent Server Auth
- Auth detection priority: ANTHROPIC_API_KEY → Claude subscription (session-env) → Google Gemini
- Claude subscription auth: OAuth session files in `~/.claude/session-env/` (NOT credentials.json)
- `hasClaudeCredentials()` in `auth.ts` now checks BOTH legacy `credentials.json` AND modern `session-env/`

## Known Fixes Applied (2026-02-27)
1. **auth.ts**: Added `readdirSync` check on `~/.claude/session-env/` so OAuth subscription auth is detected
2. **agent.ts**: Added `IS_DEV` detection based on `import.meta.url` ending in `.ts`; MCP servers now use `tsx` binary in dev mode (not `node memory.js`)
3. **route.ts**: Split try/catch to distinguish Convex errors from agent server errors; `fetchQuery` errors now show "Backend error: ..." instead of "Could not reach agent server"

## User Preferences
- Uses Claude subscription (not API keys)
- No `.env` in agent-server (relies on subscription auth from Claude CLI login)
