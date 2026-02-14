# MISSION BRIEFING: PROJECT JARVIS (MNotes)

## 🚨 READ THIS FIRST

You are taking over development of **MNotes (codenamed JARVIS)**.
Your predecessor has established the **frontend vision**: a chat-first, agentic interface where the AI proactively manages the user's business and life.

**HOWEVER:**
- The current implementation is largely cosmetic. The "Actions" system is broken.
- The chat experience is visibly SLOW.
- The backend wiring for many features is either missing or incomplete.

**YOUR GOAL:**
Turn this beautiful shell into a high-performance, fully functional agentic system. The bar is extremely high. "It works" is not enough; it must be instant, proactive, and intelligent.

---

## 1. THE VISION

**Think: J.A.R.V.I.S. for Tony Stark.**
**Think: DoAnything.com (AI that executes, not just chats).**

MNotes is NOT a note-taking app. It is an **operating system for the user's life**.
It creates todos, tracks ideas, monitors income, and logs mentorship sessions — **without being asked**.
It should observe, anticipate, and execute.

### Core Philosophy (See `docs/OPENCLAW_LEARNINGS.md`)
- **Action-First**: The AI does not say "Here is a list of ideas." It says "I've filed these 3 ideas for you."
- **Memory-First**: The AI maintains a "Soul File" (`SOUL.md` concept) and knows everything about the user.
- **Proactive**: The AI nudges the user ("You haven't logged a session in 3 days").

---

## 2. CURRENT STATE & HANDOVER NOTES

### ✅ What We Have Done (The Foundation)
1.  **Home Page Architecture**:
    - The Dashboard is now **Chat-First**.
    - Clicking "Tell me what to do next..." opens a full-page, inline chat experience (no floating modals).
    - This is the primary interface.
2.  **Agentic Copy**:
    - Every piece of text has been rewritten to be first-person active voice ("Revenue I'm tracking", "Tasks I'm handling").
3.  **Visual Language**:
    - Clean, premium, minimalist aesthetic using existing design tokens.

### ⚠️ What is BROKEN or MISSING (Your Job)
1.  **Performance (CRITICAL)**:
    - The chat is too slow. It needs to be instant. Speed is a feature.
    - Optimistic UI updates are missing or laggy.
2.  **Actions System**:
    - The "Actions" page (`/dashboard/actions`) and the underlying task management are not fully wired up.
    - AI-generated tasks often don't persist or sync correctly.
3.  **Data Integration**:
    - The "Soul File" integration is basic. The AI needs to deeper read/write directly to this file to truly "know" the user.
4.  **Mobile Experience**:
    - While responsive, the mobile chat experience needs polish to feel native (keyboard handling, touch targets).

---

## 3. YOUR ORDERS

### Phase 1: Exploration & Verification
1.  **Read `docs/OPENCLAW_LEARNINGS.md`**: This is your bible for agentic behavior.
2.  **Audit the Codebase**: specifically `src/components/chat/ChatPanel.tsx` and `src/app/dashboard/actions/page.tsx`.
3.  **Test the Speed**: identifying why chat interactions feel sluggish.

### Phase 2: Planning
**Before you write a single line of code:**
1.  Create or update `docs/implementation_plan.md`.
2.  Detail exactly how you will:
    - optimize chat performance (latency, rendering).
    - fix the Actions/Task system.
    - implement true agentic "loops" (backend).
3.  **Get User Approval** on this plan.

### Phase 3: Execution (The High Bar)
- **Do not ship broken code.**
- **Do not ship slow code.**
- If a feature (e.g., "Idea Extraction") is half-baked, fix it or cut it.
- **Every interaction should feel magical.** When the user says "I just closed a deal," the system should instantly update revenue, log the activity, and congratulate them — all visible in real-time.

---

## 4. COMMANDS

When you are ready, acknowledge this briefing.
Then, **Draft your plan.**
Then, **Build Jarvis.**
