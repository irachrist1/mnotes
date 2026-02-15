# OpenClaw Learnings Reference

Last verified: 2026-02-12
Source: live OpenClaw workspace on `root@24.144.92.122` (`/root/clawd` + `/root/.openclaw`)

This document captures reusable patterns from the OpenClaw/Jarvis setup so other agents can copy what works.
All secrets are intentionally omitted.

## 0) Public Docs Confirmations (Verified 2026-02-16)

The private workspace notes below match what OpenClaw describes publicly:

- **Skills** are loaded from bundled + managed (`~/.openclaw/skills`) + workspace (`<workspace>/skills`) with deterministic precedence (workspace wins). See OpenClaw "Skills" docs: `docs.openclaw.ai/skills`.
- **Tools** are first-class and can be allow/deny listed in `openclaw.json`, with tool profiles like `minimal` and `coding`. See OpenClaw "Tools" docs: `docs.openclaw.ai/tools`.
- **Hooks** exist as a stable extension mechanism (e.g., session-memory, command-logger, boot-md). See OpenClaw "Hooks" docs: `docs.openclaw.ai/automation/hooks`.

These public docs are useful for understanding the excitement: OpenClaw is treating agent runtime controls (tools, skills, hooks) as a product, not just a prompt.

## 1) Architecture Pattern: Memory-First Agent

OpenClaw works because memory is treated as a first-class runtime input, not an afterthought.

Core memory files in `/root/clawd`:
- `SOUL.md`: non-negotiable behavior and tone constraints
- `IDENTITY.md`: assistant identity card (name, vibe, avatar)
- `USER.md`: structured human profile (goals, context, communication style, tools)
- `MEMORY.md`: curated long-term memory (preferences, blockers, operating rules)
- `memory/YYYY-MM-DD.md`: event log and daily continuity
- `memory/semantic/*.md`: durable facts
- `memory/procedural/*.md`: workflows/playbooks
- `memory/episodic/*.md`: specific events and decisions

## 2) Prompting Stack That Actually Persists Context

The effective prompt layering observed:
1. Session boot instruction: "read memory first"
2. Identity and behavior constraints (`SOUL.md`, `IDENTITY.md`)
3. User-specific context (`USER.md`)
4. Long-term operating memory (`MEMORY.md`)
5. Recent continuity (daily notes)

Key learning:
- Persistence quality comes from predictable file contracts + strict boot order.
- The model is told exactly where memory lives and when to refresh it.

## 3) Memory Taxonomy (Why It Works)

OpenClaw separates memory by purpose:
- Semantic memory: facts that should stay true across time
- Procedural memory: how-to patterns and recurring workflows
- Episodic memory: dated events and outcomes
- Curated long-term memory: compact rules + preferences in one place (`MEMORY.md`)

Key learning:
- Mixing everything in one blob degrades retrieval quality.
- Separation by memory type increases precision and lowers prompt noise.

## 4) Operational Loops

OpenClaw uses both heartbeat and cron loops.

Observed patterns:
- Heartbeat loop for periodic context checks and lightweight proactive behavior
- Cron jobs for precise timing (e.g., fixed-time cleanup and scheduled tasks)
- Nightly autonomous improvement loop with explicit log (`memory/nightly-builds.md`)

Key learning:
- Use heartbeat for drift-tolerant checks.
- Use cron for strict schedules and isolated tasks.

## 5) Execution Style Rules

OpenClaw behavior files enforce:
- action-first responses (do the task, then report)
- no filler language
- high resourcefulness before asking clarifying questions
- strict external action boundaries (ask before public/external actions)
- explicit group-chat etiquette and selective participation rules

Key learning:
- Strong behavior constraints reduce low-signal responses and improve trust.

## 6) Runtime Features Worth Reusing

Sanitized runtime learnings from `/root/.openclaw/openclaw.json`:
- Workspace rooted at `/root/clawd`
- Memory search enabled with sources: `memory`, `sessions`
- Compaction mode enabled (`safeguard`) with memory flush support
- Internal hooks enabled: `boot-md`, `command-logger`, `session-memory`
- Multi-channel runtime enabled (Telegram + Discord in this deployment)
- Bounded concurrency (`maxConcurrent`, subagent limits)

Key learning:
- Hook-based boot + session-memory logging is a major reason continuity is reliable.

## 7) Patterns Other Agents Should Copy

Recommended baseline template for any agent system:

1. Boot protocol:
- Always load identity + user + long-term memory + recent daily logs first.

2. Memory write protocol:
- Write significant facts to semantic memory.
- Write workflows/lessons to procedural memory.
- Write dated outcomes to episodic/daily logs.
- Periodically distill into curated long-term memory.

3. Prompt contract:
- Include explicit instruction that memory files are the source of truth.
- Include behavior constraints from soul/identity files.
- Include compact recent-turn snapshot (not full history).

4. Safety contract:
- Separate internal actions (read/organize/analysis) from external actions (send/post/publish).
- Require confirmation for external actions.

5. Performance contract:
- Prefer small, stable memory blocks over full transcript replay.
- Use short-lived prompt/result cache for repeated requests.
- Use retrieval over saved insights/events for relevance.

## 8) Anti-Patterns Seen in Weaker Setups

Avoid these:
- Single-file "memory" with mixed facts/workflows/events
- Prompting without deterministic boot sequence
- Storing preferences only in chat history
- No distinction between public vs internal actions
- No cleanup/compaction strategy for stale memory

## 9) Integration Notes for MNotes and Other Agents

How to apply this in MNotes-like systems:
- Keep `soulFiles` as the durable memory anchor.
- Maintain structured sections analogous to: identity, user profile, operating principles, preferences, active blockers, next actions.
- Retrieve "important past chats" from a saved insights index (lexical + embedding retrieval).
- Build prompts from: soul memory + relevant saved insights + compact live snapshot + recent turns.
- Use scheduled background evolution to keep memory current without blocking UI responses.

## 10) Redaction and Security Handling

During extraction/documentation:
- Never copy raw API keys, tokens, bot secrets, or auth credentials.
- Document architecture, contracts, and behavior rules only.
- Keep channel IDs, auth tokens, and provider secrets out of shared docs.
