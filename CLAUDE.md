# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Principle

**Performance is a feature.** Every change must result in a fast, responsive experience that looks great and feels great to use — especially on mobile. This is non-negotiable.

## Commands

```bash
# Development (run in separate terminals)
npx convex dev          # Convex backend dev server (hot-reloads schema/functions)
npm run dev             # Next.js dev server at localhost:3000

# Build & Lint
npm run build           # Runs convex codegen then next build --webpack
npm run lint            # ESLint via next lint

# Tests (Vitest + jsdom + React Testing Library)
npm test                # Run all tests once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
npx vitest run src/components/ui/Badge.test.tsx   # Run a single test file
```

## Architecture

### Tech Stack
- Next.js 16 (App Router) on Vercel, React 19, TypeScript (strict)
- Convex backend with `@convex-dev/auth` for password-based authentication
- Tailwind CSS 3 (dark mode via `media`), Inter font
- Framer Motion for dashboard animations (lazy-loaded, NOT on sign-in)
- Chart.js via react-chartjs-2 (lazy-loaded, only on analytics pages)
- Google Generative AI / OpenRouter for AI features (user-configured API keys)

### Path Aliases
- `@/*` → `./src/*`
- `@convex/*` → `./convex/*`

### Provider Stack (root layout → `src/app/layout.tsx`)
```
<html>
  <body>
    ConvexAuthNextjsServerProvider (only when NEXT_PUBLIC_CONVEX_URL is set)
      ConvexClientProvider (always — handles missing URL gracefully)
        {children}
```

### Route & Layout Flow
- **Middleware** (`src/middleware.ts`): Protects `/dashboard/*` and `/onboarding/*` (redirects to `/sign-in`). Redirects authenticated users away from sign-in. Falls back to no-op when Convex URL is missing.
- **Dashboard layout** (`src/app/dashboard/layout.tsx`): Server component with `export const dynamic = "force-dynamic"`. Imports `client-layout.tsx` which wraps content in `DashboardShell` and checks `useConvexAvailable()`.
- **DashboardShell** (`src/components/layout/DashboardShell.tsx`): Lazy-loads Sidebar, CommandPalette, and ChatPanel via `next/dynamic`. Preloads ChatPanel on hover/pointer-down.
- **Onboarding** (`src/app/onboarding/`): Soul file setup. Dashboard redirects here if `soulFile.get` returns null.

### Convex Hook Safety
- Pages using Convex hooks (`useQuery`, `useMutation`, etc.) must either:
  1. Be behind a `useConvexAvailable()` guard that renders a fallback when Convex is unavailable
  2. Or be inside a route with `export const dynamic = "force-dynamic"` to prevent prerender
- Dashboard pages are protected by `client-layout.tsx` which checks `useConvexAvailable()`
- Sign-in and onboarding have their own guards

### Convex Backend Patterns
- **Auth**: `@convex-dev/auth` with Password provider (`convex/auth.ts`). JWT subject format is `"userId|sessionId"` — `getUserId(ctx)` in `convex/lib/auth.ts` extracts the stable userId. Falls back to `"default"` when unauthenticated.
- **Data isolation**: Every table has a `userId` field and a `by_user` index. All queries/mutations call `getUserId(ctx)` first.
- **Validation**: Server-side via helpers in `convex/lib/validate.ts`. Always validate in Convex functions, not just on the client.
- **Actions** (e.g., `convex/ai/chatSend.ts`): Use `ctx.runQuery(internal.*)` for server-side data access (e.g., reading unmasked API keys).

### Key Database Tables (`convex/schema.ts`)
`incomeStreams`, `ideas`, `mentorshipSessions`, `userSettings`, `aiInsights`, `savedInsights` (has vector index), `soulFiles`, `chatThreads`, `chatMessages`, `aiPromptCache` — all keyed by `userId`.

## Performance Rules

### Bundle Size
- **Never** import heavy libraries (chart.js, react-markdown, framer-motion) in shared/global code. Use `next/dynamic` with `ssr: false` to lazy-load them only where needed.
- The sign-in page must stay lightweight — no animation libraries. Use CSS transitions instead.
- Check chunk sizes after changes: `ls -lhS .next/static/chunks/*.js`

### Lazy Loading Pattern
- `src/components/ui/LazyCharts.tsx` — use this instead of importing from `Charts.tsx` directly
- `src/components/ui/LazyMarkdownMessage.tsx` — use this instead of importing from `MarkdownMessage.tsx` directly
- `DashboardShell.tsx` lazy-loads Sidebar, CommandPalette, and ChatPanel via `next/dynamic`

### Mobile
- All inputs must use `text-base` (16px) on mobile to prevent iOS Safari auto-zoom. Use `text-base sm:text-sm` pattern.
- The viewport is set to `maximumScale: 1` in the root layout.
- Chat panel is full-screen on mobile (`fixed inset-0`), positioned panel on desktop.
- Avoid `position: fixed` overlays that repaint on scroll.

## V1 Features In Progress

### API Key Onboarding Step
- Onboarding page uses a `phase` state machine: `"chat" | "setup" | "complete"`
- After soul file confirmation → setup phase (provider, model, API key) → dashboard redirect
- Skip option always available (redirects to dashboard without saving settings)
- Model option arrays shared via `src/lib/aiModels.ts` (used by both onboarding and Settings page)
- Calls `userSettings.upsert()` mutation to persist

### Chat-First Landing
- `convex/dashboard.ts` exports `isEmpty` query (three indexed `.first()` lookups, early bail)
- `client-layout.tsx` passes `initialChatOpen` prop to DashboardShell when dashboard is empty
- DashboardShell uses a `chatAutoOpened` ref to prevent re-opening after explicit close
- ChatPanel empty state shows suggested prompt chips that pre-fill the input

### Weekly AI Digest
- `convex/ai/weeklyDigest.ts` — `runAll` internalAction (lists users) + `generateForUser` internalAction (calls AI, saves insight)
- Cron: `weekly-ai-digest` runs Sunday 8:00 UTC via `convex/crons.ts`
- Uses user's own API key; silently skips users without keys or zero data
- Saves as `aiInsight` with type `"weekly-digest"`, priority `"high"`, no expiry
- Dashboard home shows unread digests as prominent cards above stats grid
- Backend helpers: `aiInsights.createDigestInternal`, `aiInsights.getUnreadDigests`, `soulFile.listAllUserIds`

## Environment Variables
- `NEXT_PUBLIC_CONVEX_URL` — required for Convex connection
- `CONVEX_DEPLOYMENT` — required for `npx convex codegen` during build (falls back gracefully)
- AI API keys are configured per-user via Settings page, stored in Convex (masked before reaching client)

## CI (`.github/workflows/ci.yml`)
Lint → Test → Build → Deploy Convex (main branch only, uses `CONVEX_DEPLOY_KEY` secret). TypeScript build errors are ignored in `next.config.ts` because Convex codegen can be stale in CI.
