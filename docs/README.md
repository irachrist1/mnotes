# Docs

This folder intentionally contains only docs that are still useful for the current codebase.

## Kept Documents

- `DESIGN_SYSTEM.md`: Practical UI rules and tokens used by the current app.
- `MIGRATION.md`: Legacy ideas-field migration notes for older Convex deployments.
- `OPENCLAW_LEARNINGS.md`: Extracted, sanitized architecture and memory/prompt patterns from the OpenClaw/Jarvis setup for reuse by other agents.
- `OPENCLAW_VS_MNOTES.md`: Honest comparison and what to copy vs productize differently.
- `VISION.md`: Product vision, architecture overview, build plan, feature roadmap, and changelog. This is the primary living document.
- `IMPLEMENTATION_PLAN.md`: Agent-ready implementation specs - 5 parallelizable workstreams (Debugging, Notifications, Actions, Research, Analytics) with exact file ownership, schema additions, interface contracts, and verification steps. Designed so multiple agents can work simultaneously without conflicts.
- `REBRAND_PROMPT.md`: Rebrand prompt and design direction notes.

## Why This Was Cleaned

Older docs in this folder were mostly planning/status artifacts from previous phases and contained stale or conflicting architecture details (especially Supabase-era notes). The project source of truth is now:

- `README.md` for setup and architecture
- `CONTRIBUTING.md` for development conventions
- `docs/VISION.md` for product vision, feature roadmap, and changelog
- the code in `src/` and `convex/`

