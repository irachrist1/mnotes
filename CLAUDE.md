# MNotes — Project Guidelines

## Core Principle
**Performance is a feature.** Every change must result in a fast, responsive experience that looks great and feels great to use — especially on mobile. This is non-negotiable.

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

## Architecture

### Provider Stack (root layout)
```
<html>
  <body>
    ConvexAuthNextjsServerProvider (only when NEXT_PUBLIC_CONVEX_URL is set)
      ConvexClientProvider (always — handles missing URL gracefully)
        {children}
```

### Convex Hook Safety
- Pages that use Convex hooks (`useQuery`, `useMutation`, etc.) must either:
  1. Be behind a `useConvexAvailable()` guard that renders a fallback when Convex is unavailable
  2. Or be inside a route with `export const dynamic = "force-dynamic"` to prevent prerender
- Dashboard pages are protected by `client-layout.tsx` which checks `useConvexAvailable()`
- Sign-in and onboarding have their own guards

### Environment Variables (Vercel)
- `NEXT_PUBLIC_CONVEX_URL` — required for Convex connection
- `CONVEX_DEPLOYMENT` — required for `npx convex codegen` during build (falls back gracefully)

## Tech Stack
- Next.js 16 (App Router) on Vercel
- Convex backend with `@convex-dev/auth` for authentication
- Tailwind CSS 3 for styling
- Framer Motion for dashboard animations (lazy-loaded, NOT on sign-in)
- Chart.js via react-chartjs-2 (lazy-loaded, only on analytics pages)
