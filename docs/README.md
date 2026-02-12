# Docs

This folder intentionally contains only docs that are still useful for the current codebase.

## Kept Documents

- `DESIGN_SYSTEM.md`: Practical UI rules and tokens used by the current app.
- `MIGRATION.md`: Legacy ideas-field migration notes for older Convex deployments.
- `OPENCLAW_LEARNINGS.md`: Extracted, sanitized architecture and memory/prompt patterns from the OpenClaw/Jarvis setup for reuse by other agents.

## Why this was cleaned

Older docs in this folder were mostly planning/status artifacts from previous phases and contained stale or conflicting architecture details (especially Supabase-era notes). The project source of truth is now:

- `README.md` for setup and architecture
- `CONTRIBUTING.md` for development conventions
- the code in `src/` and `convex/`
