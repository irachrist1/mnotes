# MNotes UI Redesign — Three Zones Architecture

**February 14, 2026 — Implementation Plan**

> **IMPORTANT:** This work must be done on a new branch, NOT on `master`.
> Create a branch like `ui/three-zones-redesign` before making any changes.
> The current `master` branch has all bug fixes applied and is stable.

---

## Why This Redesign

The current dashboard has 7 sidebar navigation items (Income, Ideas, Mentorship, Actions, AI Insights, Analytics, Settings). Each is a separate full page. The result:

- **Navigation fatigue** — users click between 5+ pages to manage their business
- **Disconnected journeys** — creating an action from an AI insight takes 3 clicks and a page change with no clear path back
- **Empty pages for new users** — most pages show "No data yet" until the user manually adds entries, which feels broken
- **No focal point** — there's no "home" that gives you a quick pulse of your business

Additionally, the **Actions feature (`/dashboard/actions`) is fundamentally broken** — the page has cascading bugs (items vanish on status change, no navigation feedback from AI Insights, broken user flows). Patching it is not viable. The redesign should **not rely on the existing Actions implementation at all**. Instead, rethink how task/action tracking works from scratch within the new architecture.

The Three Zones Architecture consolidates the dashboard into **3 zones** with a simplified sidebar (4 items instead of 7).

---

## The Three Zones

### Zone 1: Home (Smart Dashboard)

**Route:** `/dashboard` (replaces the current empty-state landing)

A single-screen command center. No scrolling required to get your pulse.

**Layout (top to bottom):**

1. **Nudge Cards Row** — horizontal scrollable row of AI-generated cards:
   - Weekly digest summary (if unread)
   - Goal check-in prompts ("You're at 82% of your $10k goal")
   - Stale idea alerts ("'AI Workshop' has been in Validating for 18 days")
   - Overdue task reminders
   - Each card has a primary action button (dismiss, view, snooze)
   - Source: `aiInsights.getUnreadDigests` + `notifications.list` (unread only)

2. **Goal Progress Section** — compact progress bars for active goals parsed from the soul file:
   - Revenue goal: current MRR vs target with % and trend arrow
   - Other goals: simple progress indicators
   - Source: new `dashboard.goalProgress` query that reads soul file + income totals

3. **Activity Feed** — reverse-chronological feed of recent activity across all tables:
   - "You added income stream: Acme Consulting" (2h ago)
   - "AI proposed 3 actions from weekly digest" (yesterday)
   - "Mentor session with Sarah logged" (2 days ago)
   - Source: new `dashboard.recentActivity` query (union of recent items from `incomeStreams`, `ideas`, `mentorshipSessions`, `actionableActions`, `aiInsights`)

4. **Embedded Chat Input** — a single-line chat input at the bottom of the home page:
   - "Ask anything or tell me what happened today..."
   - On focus/type, expands to the full ChatPanel
   - Pre-filled suggestion chips based on soul file context
   - This replaces the floating chat button as the primary entry point on the home page

**Key decisions:**
- The home page is read-heavy, write-light. It shows you your business pulse without requiring you to click into anything.
- Nudge cards are dismissible and snooze-able (1 day, 1 week).
- Goal progress pulls from the soul file's `## Goals` section — we parse it for revenue targets and other measurable goals.

---

### Zone 2: Your Data (Tabbed Data Hub)

**Route:** `/dashboard/data` (new page, replaces separate Income/Ideas/Mentorship pages)

All structured business data in one tabbed interface. No more navigating between 3+ separate pages.

**Tabs:**
- **Income** — current `income/page.tsx` content (table + add form)
- **Ideas** — current `ideas/page.tsx` content (pipeline/kanban + add form)
- **Mentorship** — current `mentorship/page.tsx` content (session list + add form)
- **Tasks** — **completely new implementation** (see "Reimagining Actions as Tasks" below)

**Implementation approach:**
- Each tab renders the existing page component as a child (not a rewrite), except Tasks which is built fresh
- Tab state persisted in URL search params (`/dashboard/data?tab=ideas`)
- Lazy-load tab content — only the active tab's component is mounted
- The tab bar is sticky at the top of the content area

**Why merge these?**
- Users said they feel like they're "bouncing between pages" to manage their business
- A tabbed interface keeps all data one click away
- The AI can deep-link to specific tabs: `router.push("/dashboard/data?tab=tasks")`

---

### Zone 3: Intelligence (AI Hub)

**Route:** `/dashboard/intelligence` (replaces AI Insights + Analytics pages)

Everything AI-generated lives here. Insights, analytics, and the weekly digest all in one place.

**Sections:**
- **Weekly Digest** — full rendered digest at the top (if available)
- **AI Insights** — the existing AI insights list/detail view
- **Analytics** — charts and stats (income trends, idea pipeline, mentorship frequency)

**Implementation:**
- Render as a single scrollable page with section headers
- Each section can be collapsed/expanded
- The digest section only appears when there's an unread digest

---

## Reimagining Actions as Tasks

> **DO NOT reuse or patch the existing `/dashboard/actions` page or its components.**
> The current implementation (`actions/page.tsx`, `actionableActions.ts`) is deeply buggy — items vanish on status changes, filter state is unreliable, the "Create Actions" flow from AI Insights has no coherent UX, and the overall user journey is broken. Do not attempt to fix it. Build the Tasks experience from scratch.

### What Went Wrong With Actions

The existing Actions feature was designed as a standalone page with its own filter tabs (Proposed → Accepted → In Progress → Completed). Problems:

1. **Status transitions break the view** — changing an item's status removes it from the current filter, making items "vanish"
2. **No connection to source** — actions created from AI Insights have no clear link back to the insight that spawned them
3. **Too many states** — "proposed vs accepted vs in-progress vs completed" is overcomplicated for personal task tracking
4. **Isolated page** — tasks live on their own page, disconnected from the data they reference
5. **Research panel coupling** — the ResearchPanel component is bolted onto action cards, making them heavy and slow

### The New Tasks Model

Rethink from first principles. A task in MNotes is simply: **something the AI suggested or the user noted, that needs doing.**

**Simplified states:** `todo` | `done` (that's it — no proposed/accepted/in-progress ceremony)

**Key design decisions:**
- Tasks appear **inline where they're relevant** — on the Home page nudge cards, in the Intelligence section next to insights, and in a dedicated Tasks tab under Your Data
- A task can be created from anywhere: chat, AI insight, manual entry
- Each task has: `title`, `note` (optional), `sourceType` (manual | ai-insight | chat), `sourceId` (optional link to originating insight/message), `dueDate` (optional), `priority` (low | medium | high), `done` (boolean)
- No filter tabs — just a simple list with a toggle to show/hide completed items
- Completing a task is a single click (checkbox), not a multi-step status progression

**Where tasks surface:**
- **Home (Zone 1):** Overdue/upcoming tasks appear as nudge cards
- **Intelligence (Zone 3):** "Create Tasks" from an insight adds them and shows a confirmation with a direct link
- **Your Data > Tasks tab:** The full task list with add/edit/complete/delete

**Backend approach:**
- You may reuse the `actionableActions` table if the schema fits, or create a new `tasks` table — decide based on what's cleaner. The agent should evaluate the existing schema and choose the approach that results in the least technical debt. Do not feel obligated to preserve the existing `actionableActions` table or its queries/mutations if starting fresh is simpler.
- Keep it minimal: `tasks` table with fields `userId`, `title`, `note`, `sourceType`, `sourceId`, `dueDate`, `priority`, `done`, `createdAt`
- Simple queries: `list` (by user, ordered by creation), `countUndone` (for badge/nudge)

---

## Sidebar Changes

**Current (7 items):**
1. Home
2. Income
3. Ideas
4. Mentorship
5. Actions
6. AI Insights
7. Analytics

**New (4 items):**
1. **Home** — `/dashboard` (Zone 1)
2. **Your Data** — `/dashboard/data` (Zone 2, tabbed)
3. **Intelligence** — `/dashboard/intelligence` (Zone 3)
4. **Settings** — `/dashboard/settings` (unchanged, includes Feedback form)

**Benefits:**
- Simpler mental model — 4 destinations instead of 7
- Sidebar is less cluttered, especially on mobile
- Each zone has a clear purpose: pulse, data, AI

---

## New Convex Queries Needed

### `dashboard.recentActivity`
```typescript
// Returns last 15 items across all tables, sorted by creation time
// Each item: { type: "income" | "idea" | "mentorship" | "task" | "insight",
//              title: string, timestamp: number, id: string }
// Implementation: query each table's by_user index with .order("desc").take(5),
// merge and sort in-memory, return top 15
```

### `dashboard.goalProgress`
```typescript
// Parses soul file for ## Goals section
// Cross-references with actual data:
//   - Revenue goals: compare against sum of active income streams
//   - Idea goals: count ideas in each stage
//   - Mentorship goals: count sessions this month
// Returns: { goals: Array<{ label, current, target, unit, percentage }> }
```

---

## CommandPalette Updates

Update the CommandPalette search results to reflect new routes:
- "Income" → navigates to `/dashboard/data?tab=income`
- "Ideas" → navigates to `/dashboard/data?tab=ideas`
- "Mentorship" → navigates to `/dashboard/data?tab=mentorship`
- "Tasks" / "Actions" → navigates to `/dashboard/data?tab=tasks`
- "AI Insights" → navigates to `/dashboard/intelligence`
- "Analytics" → navigates to `/dashboard/intelligence`

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/app/dashboard/data/page.tsx` | Zone 2: Tabbed data hub |
| `convex/dashboard.ts` (extend) | Add `recentActivity` and `goalProgress` queries |

### Modified Files
| File | Changes |
|------|---------|
| `src/app/dashboard/page.tsx` | Complete rewrite — Zone 1 smart dashboard |
| `src/app/dashboard/intelligence/page.tsx` | New — Zone 3: AI + Analytics hub |
| `src/components/layout/Sidebar.tsx` | Simplify to 4 nav items |
| `src/components/layout/CommandPalette.tsx` | Update routes for new structure |
| `src/components/layout/DashboardShell.tsx` | Adjust for embedded chat input on home |

### Pages to Keep (as tab content)
These pages remain as components but are no longer direct routes:
| File | Becomes |
|------|---------|
| `src/app/dashboard/income/page.tsx` | Tab content in `/dashboard/data` |
| `src/app/dashboard/ideas/page.tsx` | Tab content in `/dashboard/data` |
| `src/app/dashboard/mentorship/page.tsx` | Tab content in `/dashboard/data` |
| `src/app/dashboard/actions/page.tsx` | **Deprecated** — replaced by new Tasks tab (built from scratch) |
| `src/app/dashboard/ai-insights/page.tsx` | Section in `/dashboard/intelligence` |
| `src/app/dashboard/analytics/page.tsx` | Section in `/dashboard/intelligence` |

> **Note:** We keep the original page files as route endpoints for backwards compatibility and deep-linking. The tabbed data page imports their content components. We do NOT delete the original routes — they can redirect to the tabbed view.

---

## Implementation Order

### Phase 1: Backend + Data Layer
1. Extend `convex/dashboard.ts` with `recentActivity` and `goalProgress` queries
2. Test queries work with existing data

### Phase 2: Zone 2 — Your Data (Tabbed)
3. Create `/dashboard/data/page.tsx` with tab bar
4. Extract each existing page's content into an exportable component
5. Wire tabs to URL search params
6. Verify all CRUD operations work within tabs

### Phase 3: Zone 1 — Home
7. Redesign `/dashboard/page.tsx` with nudge cards, goal progress, activity feed
8. Add embedded chat input that opens ChatPanel on interaction
9. Wire nudge card actions (dismiss, snooze, navigate)

### Phase 4: Zone 3 — Intelligence
10. Create `/dashboard/intelligence/page.tsx`
11. Integrate AI insights list + analytics charts as sections
12. Add digest section at top

### Phase 5: Navigation
13. Simplify Sidebar to 4 items
14. Update CommandPalette routes
15. Add redirects from old routes to new ones

### Phase 6: Polish + Verify
16. Mobile responsiveness pass on all zones
17. Animation consistency (Framer Motion variants)
18. Build + test verification
19. Manual QA of all user journeys

---

## User Journeys After Redesign

### "What's going on with my business?"
1. Open app → Home (Zone 1) shows nudge cards, goal progress, activity feed
2. See revenue is at 82% of goal → feel good
3. Notice a stale idea nudge → click "View" → taken to `/dashboard/data?tab=ideas`

### "I just had a mentor session"
1. Open app → type in home chat input: "Just had a call with Sarah about pricing"
2. ChatPanel opens → AI proposes mentorship session entry → confirm
3. Session appears in activity feed immediately

### "Show me my AI insights"
1. Click "Intelligence" in sidebar
2. See weekly digest summary, AI insights list, analytics charts — all on one page
3. Click an insight → detail panel slides in
4. Click "Create Tasks" → toast with "View Tasks" link → `/dashboard/data?tab=tasks`

### "I want to add a new income stream"
1. Click "Your Data" in sidebar → lands on Income tab
2. Fill out form, submit
3. Switch to Ideas tab to check pipeline — one click, no page load

---

## What This Does NOT Change

- **Settings page** — stays at `/dashboard/settings`, unchanged (includes feedback form)
- **Chat panel** — still a floating panel accessible from anywhere via the chat button
- **Onboarding flow** — unchanged (chat → soul file → API key setup)
- **Backend/Convex schema** — no table changes, only new queries
- **Auth/middleware** — unchanged

---

## Known Issues on `master`

The following were patched on `master` but the **Actions feature remains fundamentally broken** and should not be relied upon:

**Partially fixed (bandaid patches on `master`):**
1. **Actions page items vanishing** — patched with auto-filter-switch, but the underlying UX model is flawed
2. **Create Actions no feedback** — patched with toast + slide-over close, but the whole flow is disjointed

**Fixed properly on `master`:**
3. **NotificationBell wrong position** — moved to top-right of page, dropdown positioning
4. **FeedbackWidget placement** — moved from floating button to inline section on Settings page
5. **Analytics empty state** — proper empty state with guidance + fade-in animations
6. **Onboarding skip guidance** — toast + hint text about Settings page for API key setup

**Actions status:** The entire Actions feature (`/dashboard/actions`, `actionableActions.ts`, `ResearchPanel.tsx`) should be considered **not production-ready**. The redesign replaces it entirely with the new Tasks model described above. Do not attempt to fix or extend the existing Actions code — build Tasks fresh.

---

## Branch Strategy

```
master (stable, bug fixes applied)
  └── ui/three-zones-redesign (this work)
```

- Create branch from current `master`
- All Three Zones work goes on this branch
- Do NOT merge to `master` until all phases are complete and tested
- PR back to `master` when ready

---

*Last updated: February 14, 2026*
