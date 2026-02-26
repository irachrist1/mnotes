# AGENTS.md

## Cursor Cloud specific instructions

### Services overview

MNotes is a Next.js 16 + Convex full-stack app (single repo, no Docker). See `CLAUDE.md` for commands and architecture details.

| Service | Command | Notes |
|---|---|---|
| Next.js dev server | `npm run dev` | Runs on port 3000. Works standalone — gracefully handles missing Convex URL. |
| Convex dev server | `npx convex dev` | Cloud-hosted backend. Requires `NEXT_PUBLIC_CONVEX_URL` in `.env.local`. |

### Gotchas

- **Lint script is broken**: `npm run lint` runs `next lint`, which was removed in Next.js 16. This is a pre-existing repo issue, not an environment problem.
- **Convex codegen**: `npx convex codegen` requires a live `CONVEX_DEPLOYMENT` env var. The build script handles this gracefully with `(npx convex codegen 2>/dev/null || true)`. TypeScript build errors are also ignored in `next.config.ts` since generated types may be stale.
- **No Convex URL fallback**: Without `NEXT_PUBLIC_CONVEX_URL`, the app still starts but public pages render and the middleware redirects `/dashboard` to `/sign-in`. Auth uses `@convex-dev/auth` with password provider.
- **Test suite**: `npm test` (Vitest) runs all 71 tests — no Convex connection needed. Tests use jsdom and React Testing Library.
- **Node.js 22+** is required (see `README.md`).
