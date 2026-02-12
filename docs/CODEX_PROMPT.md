# Codex Prompt — MNotes Backend, Auth, Testing, and Infrastructure

You are working on the backend infrastructure for MNotes, a Next.js 16 + Convex personal AI dashboard. This is a long-running task. Take your time, be thorough, and handle edge cases.

## Read First
- `docs/PRODUCT_VISION.md` — full product vision and architecture
- `docs/DESIGN_SYSTEM.md` — design tokens (you'll need color references for any UI you touch)
- `convex/schema.ts` — current database schema

## Your Scope

### 1. Authentication System (Clerk + Convex)

Set up Clerk authentication integrated with Convex. This is the highest priority.

**Steps:**
a. Install Clerk: `npm install @clerk/nextjs @clerk/clerk-react`
b. Create `src/middleware.ts` with Clerk middleware (protect `/dashboard/*` routes)
c. Wrap the app with `ClerkProvider` in `src/app/layout.tsx`
d. Create sign-in page at `src/app/sign-in/[[...sign-in]]/page.tsx`
e. Create sign-up page at `src/app/sign-up/[[...sign-up]]/page.tsx`
f. Update `convex/auth.config.ts` to validate Clerk JWTs
g. Update ALL Convex functions to use `ctx.auth.getUserIdentity()` instead of hardcoded `"default"` userId
h. The `userId` field in all tables should come from Clerk's `subject` (user ID)
i. Add a user profile dropdown in the sidebar (bottom, shows name + avatar + sign out)
j. Handle the unauthenticated state gracefully (redirect to sign-in, not crash)

**Clerk env vars needed (document in .env.example):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Important:** Don't break the existing flow for users without Clerk configured. Add a `ConvexGuard` fallback that works without auth during development.

### 2. Convex Schema Hardening

Review and improve the Convex schema (`convex/schema.ts`):

a. Add proper indexes for all common query patterns
b. Add `v.optional()` correctly on all fields that should be optional
c. Ensure all tables have `createdAt` (number, Date.now()) and `updatedAt` fields
d. Add a `users` table that stores Clerk user data (name, email, avatar, plan tier)
e. Validate that every Convex function's export name matches what the frontend imports via `api.*`
   - This is CRITICAL. The `_generated/api.d.ts` stubs use `anyApi` so TypeScript won't catch mismatches. They only fail at runtime.
   - Check every `useQuery(api.X.Y)` and `useMutation(api.X.Y)` call in all page files and verify the Convex file exports match

### 3. Test Suite

Set up a proper test infrastructure:

a. Install Vitest: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`
b. Create `vitest.config.ts` with proper path aliases matching `tsconfig.json`
c. Write unit tests for ALL Convex functions (use Convex test helpers):
   - `convex/incomeStreams.ts` — test CRUD operations
   - `convex/ideas.ts` — test CRUD + stage transitions
   - `convex/mentorshipSessions.ts` — test CRUD + action item toggling
   - `convex/userSettings.ts` — test get/upsert
   - `convex/aiInsights.ts` — test list/create/updateStatus/remove
d. Write component tests for key UI components:
   - `StatCard` — renders value, label, icon, trend
   - `Badge` — renders all 7 variants correctly
   - `Sidebar` — renders all nav items, highlights active
   - `EmptyState` — renders with icon, title, description
e. Create test utilities (`src/test/utils.tsx`) with Convex mock provider
f. Add test script to `package.json`: `"test": "vitest"`, `"test:coverage": "vitest run --coverage"`

### 4. CI/CD Pipeline

Create GitHub Actions workflows:

a. `.github/workflows/ci.yml`:
   - Trigger on push and PR to `master` and `fix/jarvis-*`
   - Steps: checkout, setup Node 22, npm ci, type check (`npx tsc --noEmit`), lint (if eslint configured), test (`npm test`), build (`npm run build`)
   - Cache node_modules and .next

b. `.github/workflows/deploy.yml` (placeholder):
   - Trigger on push to `master` only
   - Placeholder for Vercel deployment (just document the steps)

### 5. Accessibility Audit

Go through every page component and fix accessibility issues:

a. All interactive elements need proper `aria-label` or visible labels
b. Color contrast ratios must meet WCAG AA (4.5:1 for text, 3:1 for large text)
c. All form inputs need associated labels
d. Keyboard navigation must work for all interactive elements
e. Focus indicators must be visible (the sky-blue focus ring)
f. The sidebar should use proper `<nav>` landmark with `aria-label`
g. The mobile menu needs proper `aria-expanded` and focus trapping
h. Add `role="status"` to loading skeletons
i. Document any issues you find but can't fix in `docs/ACCESSIBILITY_AUDIT.md`

### 6. Security Hardening

a. API keys in `userSettings` are currently stored in plaintext in Convex. Add a warning comment and document the risk. (Full encryption requires Convex environment variables, which needs the user's Convex dashboard.)
b. Ensure no API keys are ever sent to the client (check all `useQuery` calls)
c. Add rate limiting logic to AI generation actions (simple counter per userId per hour)
d. Validate all user inputs server-side in Convex mutations (not just client-side)
e. Add CORS headers if needed for API routes

### 7. Documentation

a. Update `README.md` with:
   - Project description
   - Tech stack
   - Setup instructions (including Clerk + Convex)
   - Environment variables reference
   - Available scripts
   - Architecture overview
b. Create `CONTRIBUTING.md` with coding conventions
c. Update `.env.example` with all required env vars

## Rules

- **Convex export names MUST match frontend `api.*` imports.** Always verify.
- Convex actions with `fetch()` or Node APIs need `"use node"` at top of file.
- Default branch is `master`, working branch is `fix/jarvis-feb11`.
- `npm run build` must pass before committing.
- No em dashes in any text. Use periods or commas.
- Commit messages: imperative mood, specific ("add Clerk auth middleware", not "updated stuff")

## Setup
```bash
git clone https://github.com/irachrist1/mnotes.git
cd mnotes
git checkout fix/jarvis-feb11  # or create your own branch
npm install
npm run dev
```

This is a long-running task. Work through each section systematically. Push commits as you complete each major piece. The auth system is the most important deliverable.
