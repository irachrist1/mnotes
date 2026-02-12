# MNotes — Vision

**February 2026 — Living Document**

---

## Principle Zero: Speed

Never compromise on speed. Not loading speed, not build speed, not shipping speed. Every decision is filtered through: does this make us faster or slower? If slower, it needs an extraordinary reason to exist.

- The app must feel instant. Sub-second interactions. No spinners where avoidable.
- We ship working features, not perfect abstractions. Build, learn, refine.
- If a choice is between "architecturally elegant but slow to ship" and "simple but ships today," we ship today.

---

## The Idea in One Sentence

MNotes is a personal AI that learns everything about your business and life, organizes it automatically, and helps you make better decisions — whether you drop in a file, type a thought, or just talk to it.

---

## 1. What MNotes Is

At its simplest, MNotes is a place to put things. Like Apple Notes. You open it, you write something, you close it. Done.

But underneath, an AI is reading what you wrote. It figures out that your note is about a new client, or an idea you had, or a reflection on a mentor call. It files it. It connects it to things you've said before. It updates your view. It remembers.

Over time, MNotes builds a living profile of you — your soul file. Your goals, your income streams, your ideas, your patterns, your preferences. Every interaction makes it smarter. And that profile powers everything: your personalized view, your briefings, your suggestions, and the context you carry to every other AI tool.

**The spectrum:**

```
Apple Notes ──────────────────────────────────────── Jarvis
simple storage                               autonomous agent
you organize                                   it organizes
you remember                                   it remembers
you decide                                     it advises
```

MNotes lives wherever you want on this spectrum. Start simple. It gets smarter as you use it.

---

## 2. Core Behaviors

### Chat With It

The chat is the product. Not a feature bolted on — the front door.

```
You:     "Just closed a $3k/month deal with Acme for consulting"
MNotes:  Created income stream: Acme Consulting, $3k/mo, active.
         This brings your total to $8.2k/mo — 82% toward your $10k goal.

You:     "I have an idea — what if I turned my consulting frameworks
          into a course?"
MNotes:  Based on your data:
         - Your consulting generates $5.2k/mo across 3 clients
         - You've mentioned "frameworks" in 4 mentor sessions
         - A course aligns with your goal to build passive income
         Want me to add this to your ideas pipeline?

You:     "How's my week looking?"
MNotes:  Revenue: $8.2k/mo (+12% from last month)
         2 overdue action items from Sarah's session
         Idea "AI Workshop" stuck in validating for 18 days
```

Everything you say becomes structured knowledge. The AI proposes, you confirm, it commits.

### Drop Anything In

Drag a file into the chat. Any file.

| You drop in... | MNotes does... |
|----------------|----------------|
| Mentor session notes (PDF/doc) | Extracts mentor name, topics, insights, action items. Proposes a mentorship session entry. |
| Bank statement (CSV/PDF) | Parses transactions. Matches to income streams, flags new sources. |
| Voice memo | Transcribes. Extracts structured data. Routes to correct place. |
| Screenshot of an idea | Reads image. Creates idea entry with description, tags, category. |
| Random note | Reads it, figures out what it is, proposes where it belongs. |

Always confirmation before writes. You stay in control.

### Your Soul File

Inspired by OpenClaw's SOUL.md — a living profile that captures who you are.

```markdown
# soul.md (auto-generated, always updating)

## Identity
Name: Christian
Role: Independent consultant & builder
Focus: AI consulting, product development

## Goals (active)
- Hit $10k/month recurring revenue by June 2026
- Launch first digital product (course) by Q3 2026
- Build mentorship network of 10+ regular contacts

## Income Profile
- 3 active streams, $8.2k/mo total
- Primary: consulting (63%), employment (25%), content (12%)
- Avg growth: +8.3%/mo

## Patterns (learned)
- Logs mentorship sessions on Thursdays
- Most productive ideation happens late evening
- Prefers direct communication style
- Reviews finances on Monday mornings

## Notes
(free-form section the AI updates as it learns more about you)
```

This file isn't something you write. MNotes writes it. The structured base (name, goals) comes from onboarding. The rest — patterns, notes, connections — the AI discovers and records over time. The soul file powers everything: chat context, briefings, suggestions, and the context you export to other tools.

### Proactive Briefings and Nudges

Jarvis reaches out when something matters. You don't have to ask.

- **Morning briefing:** Revenue status, overdue items, stale ideas, goal progress. Delivered as a notification.
- **Smart nudges:** Revenue dropped? Idea stuck for 2 weeks? Action item overdue? Jarvis pings you.
- **Configurable:** Set your briefing time, nudge frequency, quiet hours.

### Context You Can Carry Anywhere

Your organized MNotes data is available as context to any AI tool via API.

- Use ChatGPT? MNotes feeds it your business context.
- Use Cursor? MNotes feeds it your project goals and idea pipeline.
- Use Claude? MNotes feeds it your mentor session history.

MNotes doesn't compete with other AI tools. It makes them all better by giving them structured context about you.

---

## 3. What Exists Today

| Layer | What's Built |
|-------|-------------|
| Auth | Email/password via Convex Auth, working sign-in, protected routes |
| Backend | Convex: income streams, ideas, mentorship sessions, AI insights, user settings — full CRUD **plus** `soulFiles` and `chatMessages` tables with indexes |
| AI | OpenRouter + Google AI pipeline with user-configurable models in Settings; platform OpenRouter key for onboarding (default `google/gemini-3-flash-preview`); schema-driven intents (no hardcoded intent types) |
| Frontend | 7 dashboard pages, analytics, charts, responsive layout, Sidebar, floating chat panel on all dashboard pages, full-screen conversational onboarding that generates the initial soul file |
| UI Kit | Badge, Charts, EmptyState, SlideOver, StatCard, Select, Skeleton, PageHeader, ChatPanel, ConfirmationCard, ChatButton |

**What does not exist yet:** File ingestion (drag/drop, OCR, classification), proactive behavior (crons/briefings/nudges), vector search + semantic memory, context API/MCP integration, native mobile app, multi-conversation chat (threads), soul file background evolution + user notifications, persistent assistant avatar/identity across the UI.

---

## 4. Build Plan

Four milestones. Each ships something a user can touch. Each one makes the next more powerful.

### Milestone 1: Soul + Chat (the embryo)

**Status: the core of this milestone is live.**

MNotes is now something you can talk to. The assistant learns who you are via a conversational onboarding chat, generates a soul file, and lives in a floating chat panel across the dashboard.

- Soul file table + conversational onboarding chat that collects name/role/goals and generates an initial soul file markdown via OpenRouter (platform key, default Gemini 3 Flash)
- Persistent chat interface (ChatPanel + ConfirmationCard + ChatButton) — AI proposes structured intents, UI confirms, Convex mutations commit to domain tables (`incomeStreams`, `ideas`, `mentorshipSessions`)
- Intents are **schema-driven**, not hardcoded: a prompt-level description of writable tables/fields guides the AI to emit `{ table, operation, data }` intents instead of relying on fixed enums
- Model selection wired in Settings; main chat uses the user’s chosen model, onboarding uses the platform key/model
- Chat is available from all dashboard pages via a floating button

**Remaining for Milestone 1:**

- Soul file background evolution from regular chat messages (auto-updating patterns/notes) with a subtle “your profile just got smarter” notification
- Multiple chat threads per user (ability to start a “New chat” instead of a single global history)
- Fully deprecate the standalone AI Insights page once briefings/nudges replace it

**You get:** An assistant you can talk to that knows who you are and can write directly into your income/ideas/mentorship data, with a first version of your soul file in place.

### Milestone 2: Files + Proactive (Jarvis starts working for you)

MNotes accepts anything and reaches out when it matters.

- File drop in chat — upload, AI classifies/extracts, confirmation card, commit
- Cron jobs: morning briefing, nudge engine
- Notification center (in-app first, push later)
- User profile: timezone, briefing time, nudge preferences

**You get:** Drop a bank statement and it becomes structured data. Wake up to a briefing you didn't ask for.

### Milestone 3: Memory + Context API (Jarvis becomes portable)

MNotes remembers everything and shares context with your other tools.

- Vector embeddings on all content, semantic search
- Chat falls back to semantic search for "What did Sarah say about pricing?"
- Context API endpoints: soul, summary, search
- API key management in settings
- MCP-native server so Claude/Cursor/ChatGPT can pull your context directly

**You get:** Ask anything about your history. Carry your context into every AI tool you use.

### Milestone 4: Mobile App (Jarvis goes with you)

Chat-first native app. Same Convex backend.

- Expo (React Native) app: Chat tab, Home tab, Notifications tab, Profile tab
- Native push notifications
- Camera for document capture
- Voice input
- Share extension ("Share to MNotes" from any app)

**You get:** Jarvis in your pocket.

---

## 5. What Makes This Different

| Other tools | MNotes |
|------------|--------|
| You organize your data | AI organizes it for you |
| Forms and structured input | Chat, voice, file drop — any format |
| Siloed app | Your context flows to every AI tool you use |
| You visit it when you remember | It reaches out when something matters |
| Same interface for everyone | Personalized around your soul file |
| Tool you use | Assistant that knows you |

**The soul file is the moat.** The more you use MNotes, the more it knows. The more it knows, the more useful it becomes. The more useful it becomes, the more you use it. Flywheel.

---

## 6. What We Explicitly Defer

- Calendar/Gmail/Notion/Plaid sync (v2 — after core assistant is proven)
- Autonomous external actions (no sending emails or creating events for you — yet)
- Voice output / TTS
- Multi-user workspaces
- Fully automated adaptive dashboard reordering (manual controls first)

---

## 7. Success Looks Like

Six months from now, a user describes MNotes to a friend:

> "It's like if Apple Notes, my accountant, and a really good assistant had a baby. I just dump stuff into it — notes, files, voice memos, whatever — and it figures out where everything goes. It knows my goals, tracks my money, reminds me about things I forgot. I talk to it like a person and it just... handles things."

That's the product.

---

*Last updated: February 12, 2026*
