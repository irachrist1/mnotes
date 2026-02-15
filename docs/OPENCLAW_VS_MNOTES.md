# OpenClaw vs MNotes (Jarvis): Honest Assessment

This is a practical comparison to guide product and engineering choices.

Sources:
- Internal: `docs/OPENCLAW_LEARNINGS.md` (last verified 2026-02-12)
- External reading (verified 2026-02-16): OpenClaw docs + GitHub (see links at bottom)

## What OpenClaw Is (Simple)

OpenClaw is an agent runtime/control plane:

- You give it a workspace (files + memory).
- You give it tools/connectors.
- It runs an agent loop with a deterministic boot sequence (read memory first), plus hooks/automation and scheduled loops.
- It has a "skills" ecosystem (skills directories + a managed install path) and explicit tool allow/deny controls.

In practice, it feels like a programmable "always-on" agent operating system.

## Why People Are Excited

- Memory-first execution: the agent starts every run by reading a predictable set of memory files, which improves continuity.
- Hooks and workflows: you can enforce behaviors at boot, log commands, and persist session memory automatically.
- Multi-channel: agents can live in places people already work (chat apps), not only in a web UI.
- Extensibility: connectors/skills can be added without rewriting the core agent loop.
- Operational loops: heartbeat + cron patterns enable proactive behavior.
- Tool governance: explicit allow/deny lists and tool profiles make "agent permissions" feel real.

## Where OpenClaw Is Better Than MNotes Today

- Broader tool surface (connectors/skills ecosystem).
- Stronger "agent runtime" primitives (hooks, heartbeat loops, compaction modes) as first-class features.
- More mature multi-channel deployment patterns (bots, presence).
- Skills distribution story is more mature (managed skill installs + potential marketplace dynamics).

## Where MNotes Is Better (and Why You’d Use Ours)

MNotes is a product, not a runtime. That changes what we optimize for.

1) Built for normal users
- A dashboard that shows work: plan, step progress, tool calls, approvals, and deliverables.
- No file-based memory management required by the user.

2) First-class personal/business data model
- Tasks + taskEvents (agent timeline)
- Soul file (durable user memory)
- Income streams, ideas, mentorship sessions, saved insights (with search)

OpenClaw is general-purpose. MNotes is purpose-built for "run my life/business" workflows.

3) Trust and safety UX is productized
- Approvals are visible, clickable UI cards.
- Web tools (and later connectors) are gated and auditable per task.

4) Deliverables are first-class objects
- The agent can create draft documents as `agentFiles`, view/edit them, and keep them attached to the originating task.

## The Real Tradeoff

- If you want a general agent OS with maximal extensibility and you can tolerate configuration complexity: OpenClaw is attractive.
- If you want an assistant that is immediately useful for your personal/business operating system with a fast, polished UI: MNotes is the right shape.

## What We Should Copy From OpenClaw (Concrete)

From `docs/OPENCLAW_LEARNINGS.md`, the highest-leverage ideas to adopt in MNotes:

- Deterministic boot order for context (memory-first, every run).
- Memory taxonomy (semantic/procedural/episodic) instead of one long blob.
- Hooks for session logging and "always write outcomes somewhere durable".
- Heartbeat + cron pattern for proactive loops.
- Tool allow/deny configuration that maps cleanly to user-visible permissions.

## What We Should Not Copy (Or Should Productize Differently)

- File-tree-centric user experience as the primary UI.
  - We can keep file-based memory internally, but the product should expose it as simple "Memory" and "Deliverables" views.
- Overexposing power-user configuration.
  - MNotes should provide good defaults and progressive disclosure for connectors and safety.

## Security Note

Any "skills/connector marketplace" creates a new attack surface (prompt injection, data exfiltration, malicious connectors).
If we ever ship a marketplace:

- Require explicit per-connector scopes.
- Require approvals for external side-effects.
- Make data access boundaries visible in the UI.
- Audit log every tool call and surface it to the user.

## Links (External)

- OpenClaw docs: https://docs.openclaw.ai/
- Skills docs: https://docs.openclaw.ai/skills
- Tools docs: https://docs.openclaw.ai/tools
- Hooks docs: https://docs.openclaw.ai/automation/hooks
- OpenClaw org: https://github.com/openclaw
