# MNotes — Product Vision & Architecture Doc

## The Idea (as I understand it)

MNotes is a **personal AI assistant dashboard**. Not another note-taking app, not another project tracker. It's a system that watches your life and tells you things before you ask.

Think of it as the UI layer for a personal AI copilot.

### Core Concept

**Input:** You log your life data (income, ideas, mentorship, eventually calendar/email/habits).
**Processing:** AI continuously evaluates patterns, correlations, and opportunities.
**Output:** Proactive nudges, scores, forecasts, and action items you didn't ask for.

### Two Product Phases

**Phase 1: Structured Life Dashboard (NOW)**
- Manual data entry with smart forms
- On-demand AI analysis (click to generate insights)
- Clean, minimal UI that makes data entry painless
- Single-user, personal tool

**Phase 2: Autonomous AI Assistant (NEXT)**
- Connect external data sources (calendar, email, bank, social)
- AI runs on a schedule, not just on-demand
- Push notifications: "Your consulting revenue dropped 15% this month. Here's why."
- "You have a mentorship session tomorrow. Based on last session, you wanted to discuss X."
- "Idea #3 in your pipeline has been in 'researching' for 6 weeks. Move or kill it."
- Multi-user: sell as a SaaS product

---

## Current State (Honest Audit)

### What Works
- ✅ Convex backend with 3 tables (incomeStreams, ideas, mentorshipSessions)
- ✅ CRUD for all 3 entities
- ✅ Clean UI with loading states, empty states, skeletons
- ✅ Mobile-responsive sidebar with hamburger menu
- ✅ Landing page (95% done)
- ✅ Dark mode support throughout
- ✅ ConvexGuard for graceful "not connected" state

### What's Broken / Missing

#### AI Service — Critical Issues
1. **Hardcoded model: `google/gemini-2.0-flash-exp:free`** — This is an old, deprecated model. Gemini 3 Flash is out. This will either fail or give poor results.
2. **No model selector** — Users can't pick which LLM to use. The whole point of OpenRouter is model choice.
3. **Google AI SDK also uses `gemini-2.0-flash`** — Old. Should be `gemini-3-flash` at minimum.
4. **API keys exposed client-side** — `NEXT_PUBLIC_` prefix means keys are bundled into the browser JS. Anyone can inspect network requests and steal them. This needs to go through a Convex action (server-side).
5. **"Regular mode" is fake AI** — The non-ultra mode just returns template strings with `Math.random()` confidence scores. Users think they're getting AI insights but it's just string concatenation. This is deceptive.
6. **No error boundaries on AI page** — If AI call fails, `toast.error` fires but the page is left in an ambiguous state.
7. **No streaming** — Long AI responses make the user wait with no feedback.
8. **Prompt quality is poor** — Prompts include emoji and "CHRISTIAN'S AI BRAIN" hardcoded. This should be generic for a sellable product.
9. **JSON parsing is fragile** — `parseAIResponse` uses regex to find `{...}` which can break on nested JSON. Should use proper extraction or structured output.

#### Data & Logic Issues
10. **No auth** — Anyone with the URL can access the dashboard. No user concept at all.
11. **mentorshipSessions.create doesn't set createdAt** — The mutation doesn't add `createdAt: Date.now()`. Check needed.
12. **No data validation on frontend** — Number fields accept negative values (negative revenue, negative hours). Rating accepts 0 or 100+.
13. **Analytics page is read-only hardcoded** — No date range filtering, no time comparison, no real charts (just colored divs).
14. **No settings page** — Nowhere to configure AI provider, API keys, or preferences.

#### Architecture Issues
15. **No user/auth table in Convex schema** — Needed for multi-user or even basic access control.
16. **No Convex actions** — All AI calls happen client-side. Should use Convex actions (server-side functions) to protect API keys.
17. **No real-time subscriptions leveraged** — Convex's killer feature is live queries, but we're not doing anything proactive with them (no scheduled functions, no triggers).
18. **Landing page components in `src/app/components/`** — Should be in `src/components/landing/` for organization.

---

## Product Architecture (What to Build)

### Data Model (Phase 1 — expand Convex schema)

```
users
  ├── name, email, avatar
  ├── preferences (AI model, timezone, notification prefs)
  └── apiKeys (encrypted: openrouter key, google ai key)

incomeStreams (exists — add userId)
ideas (exists — add userId)  
mentorshipSessions (exists — add userId)

aiInsights (NEW)
  ├── userId
  ├── type (revenue | idea | mentorship | life | proactive)
  ├── title, body, actionItems[]
  ├── priority, confidence
  ├── status (unread | read | dismissed | acted)
  ├── sourceData (what data generated this insight)
  ├── model (which LLM generated it)
  └── createdAt

userSettings (NEW)
  ├── userId
  ├── aiProvider ("openrouter" | "google")
  ├── aiModel (string — user picks)
  ├── openrouterKey (encrypted)
  ├── googleAiKey (encrypted)
  └── timezone, notificationPrefs

goals (NEW — Phase 1.5)
  ├── userId
  ├── title, description
  ├── targetDate, category
  ├── metrics[] (measurable KPIs)
  ├── linkedStreams[], linkedIdeas[]
  └── status, progress

journal (NEW — Phase 2)
  ├── userId
  ├── date, content
  ├── mood, energy (1-10)
  ├── tags[]
  └── aiSummary
```

### AI Architecture

**Move ALL AI calls server-side (Convex actions):**

```
convex/
  ai/
    generate.ts     — Convex action: takes prompt + model, calls OpenRouter/Google
    insights.ts     — Scheduled function: runs daily, analyzes user data, creates aiInsights
    models.ts       — Available models list + pricing
```

**Model Selection (OpenRouter):**
- Default: `google/gemini-2.5-flash` (fast, cheap)
- Premium: `anthropic/claude-sonnet-4` (best quality)
- User picks from a dropdown in settings
- Show model name + price per request

**Kill "regular mode"** — Either call the LLM or don't. No fake random insights.

### Feature Roadmap

#### Sprint 1: Fix Foundations (1-2 days)
- [ ] Move AI calls to Convex actions (server-side)
- [ ] Update models to current (Gemini 3 Flash, etc.)
- [ ] Add model selector + settings page
- [ ] Remove hardcoded "Christian" from prompts
- [ ] Kill fake "regular mode" insights
- [ ] Add proper input validation (min/max on numbers)
- [ ] Add error boundary component for dashboard

#### Sprint 2: Persistent AI Insights (2-3 days)
- [ ] Create `aiInsights` table in Convex
- [ ] Save generated insights to DB (not just React state)
- [ ] Insights feed: show history of all AI analyses
- [ ] Mark insights as read/dismissed/acted
- [ ] Insight detail view with source data context

#### Sprint 3: Settings & Configuration (1-2 days)
- [ ] Settings page: AI provider, model, API keys
- [ ] Store settings in Convex (encrypted keys via action)
- [ ] Timezone, notification preferences
- [ ] Theme toggle (currently implicit via system preference)

#### Sprint 4: Smart Analytics (2-3 days)
- [ ] Real charts (recharts or chart.js — already installed)
- [ ] Revenue over time chart
- [ ] Ideas pipeline velocity
- [ ] Date range filtering
- [ ] Period comparison (this month vs last)

#### Sprint 5: Proactive AI (3-5 days)
- [ ] Convex scheduled functions (cron)
- [ ] Daily insight generation: analyze data changes
- [ ] "Stale idea" detector: ideas stuck in same stage > 2 weeks
- [ ] Revenue trend alerts: flag declining streams
- [ ] Mentorship follow-up reminders

#### Sprint 6: Auth & Multi-user (2-3 days)
- [ ] Convex auth (Clerk or built-in)
- [ ] User table, link all data to userId
- [ ] Login/signup flow
- [ ] Profile page

#### Sprint 7: External Integrations (Phase 2)
- [ ] Calendar sync (Google Calendar API)
- [ ] Email digest (Gmail API)
- [ ] Goal tracking with AI-powered progress analysis
- [ ] Journal with mood tracking + AI reflection

---

## UI/UX Philosophy

**Design language:** Linear meets Notion meets Apple Health
- Minimal chrome, maximum data density
- Cards for overview, tables for detail
- AI insights feel like a smart friend texting you, not a corporate report
- Every screen has an empty state that explains what goes here and why

**Mobile-first principles:**
- Thumb-reachable actions (bottom of screen on mobile)
- Cards stack vertically
- No horizontal scrolling ever
- Slide-over panels instead of modals (already doing this)

---

## Naming & Positioning (for selling)

**Current name "MNotes" is fine for MVP** but if this becomes a product:
- "Your AI-powered life operating system"
- Not a notes app. Not a dashboard. A copilot for your life decisions.
- Competitors: Notion AI (too general), Wealthfront (too narrow), ChatGPT (no structure)
- Differentiation: structured data + proactive AI + beautiful UI

---

## Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Database | Convex | Real-time, server functions, scheduled tasks built in |
| AI routing | OpenRouter | Model flexibility, single API |
| AI fallback | Google AI Studio | Free tier, good for testing |
| Charts | chart.js (installed) | Already in deps, works fine |
| Auth | Clerk (recommended) | Best Convex integration, free tier |
| Styling | Tailwind | Already using, fast iteration |
| Animations | Framer Motion | Already using for landing page |

---

*This doc should be the source of truth for where mnotes is going. Update it as the vision evolves.*
