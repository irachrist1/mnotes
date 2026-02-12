# MNotes

A personal AI dashboard for entrepreneurs. Track income streams, develop ideas through a pipeline, log mentorship sessions, and generate AI-powered business insights.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Convex (database, real-time queries, server actions)
- **Auth:** Clerk (optional, app works without it)
- **AI:** OpenRouter or Google AI Studio (user-configured)
- **Testing:** Vitest, React Testing Library
- **CI:** GitHub Actions

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- A Convex account (free at [convex.dev](https://www.convex.dev))
- (Optional) A Clerk account for authentication

### Installation

```bash
git clone https://github.com/irachrist1/mnotes.git
cd mnotes
npm install
```

### Environment Variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Your Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | No | Clerk publishable key (enables auth) |
| `CLERK_SECRET_KEY` | No | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Defaults to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Defaults to `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | Defaults to `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | Defaults to `/dashboard` |

AI API keys (OpenRouter, Google AI Studio) are configured per-user via the Settings page and stored in Convex.

### Running Locally

```bash
# Start the Convex dev server (in one terminal)
npx convex dev

# Start the Next.js dev server (in another terminal)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

## Architecture

```
src/
  app/
    dashboard/          # Main app pages
      ai-insights/      # AI-generated business insights
      analytics/        # Charts and KPIs
      ideas/            # Idea pipeline (6-stage workflow)
      income/           # Income stream tracking
      mentorship/       # Session logging and action items
      settings/         # AI provider and API key config
    sign-in/            # Clerk sign-in (optional)
    sign-up/            # Clerk sign-up (optional)
  components/
    layout/             # Sidebar, navigation
    ui/                 # Reusable components (Badge, StatCard, etc.)
  test/                 # Test utilities and setup

convex/
  ai/                   # AI generation and analysis actions
  lib/                  # Shared helpers (auth, validation)
  schema.ts             # Database schema
  incomeStreams.ts       # Income CRUD
  ideas.ts              # Ideas CRUD
  mentorshipSessions.ts # Mentorship CRUD
  aiInsights.ts         # AI insight storage
  userSettings.ts       # Per-user settings
  users.ts              # User profile sync
```

### Auth Model

Authentication uses Clerk integrated with Convex. The app has three modes:

1. **No Convex URL configured:** Shows a setup message.
2. **Convex only (no Clerk keys):** Works with a shared "default" user. Suitable for local development.
3. **Convex + Clerk:** Full multi-tenant auth. Each user sees only their own data.

All Convex functions call `getUserId(ctx)` which returns the Clerk subject or falls back to `"default"`.

### Security

- API keys are masked before being sent to the client. The actual keys are only accessed server-side via internal queries.
- All mutations validate input length and format server-side.
- Security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) are set in `next.config.ts`.
- User data is isolated by `userId` with database indexes.

## License

Proprietary software.
