# MNotes Rebrand Brief

You are redesigning MNotes — a personal business intelligence dashboard for tech entrepreneurs. It tracks income streams, ideas, mentorship sessions, and uses AI to surface insights across all of them.

The current codebase has a clean foundation: warm stone neutrals + royal blue accent. Your job is to take this further. Not a color swap — a full experiential rebrand that makes a user feel like they're using something built by a team that obsesses over every pixel.

## What exists today

- **Stack:** Next.js 16, React, Tailwind CSS, Framer Motion, Chart.js, Convex backend, Convex Auth
- **Color palette:** Warm stone neutrals (`#FAFAF9`–`#57534E`) + royal blue accent (`#2563EB`). **Keep this palette.** Do not change the colors.
- **Design tokens:** All in `src/app/globals.css` as CSS custom properties
- **Components:** `src/components/ui/` — StatCard, Badge, PageHeader, EmptyState, SlideOver, Skeleton, Charts
- **Layout:** `src/components/layout/` — Sidebar, DashboardShell
- **Landing page:** `src/app/components/` — Hero, Features, Problem, Solution, HowItWorks, WaitYouCanTrack, Roadmap, WaitlistCTA, FAQ, Footer, LandingHeader
- **Dashboard:** 7 routes — overview, income, ideas, mentorship, analytics, ai-insights, settings — plus a floating chat panel and a dedicated conversational onboarding page
- **Design system docs:** `docs/DESIGN_SYSTEM.md` — read this first, follow its rules

## Constraints

- **Keep the color palette exactly as-is.** Stone neutrals + royal blue. Do not introduce new hues.
- **No structural or logic changes.** Don't touch Convex queries, mutations, API routes, auth flow, or data models.
- **No new dependencies** unless absolutely necessary and you explain why.
- **Read `docs/DESIGN_SYSTEM.md` before touching anything.** It documents the interaction rules, forbidden patterns, and motion guidelines.

## What to rethink — everything visual and experiential

### Typography
- Audit the entire type hierarchy. Is the font stack right? Should we use Inter, or something with more character?
- Review font sizes, weights, letter-spacing, and line-heights across every page. Are headings commanding enough? Is body text comfortable to read?
- Check that `tabular-nums` is used consistently on all numeric data.

### Spacing and density
- Audit padding, margins, and gaps globally. Is the dashboard too spacious? Too cramped?
- Check vertical rhythm — do sections breathe evenly?
- Mobile: is touch target sizing correct (minimum 44px)? Are forms comfortable to use on a phone?

### Sidebar
- Rethink the sidebar UX. Is the information hierarchy right? Logo → nav → settings → user — does this order make sense?
- Mobile sidebar: is the slide-in smooth? Is the overlay right? Is the hamburger menu positioned well?
- Active state: currently a plain div with background tint + left accent bar. Is this the best treatment? Could it be simpler or more elegant?
- Collapsed state: should the sidebar collapse on medium screens?

### Tab bar / navigation
- The mobile experience has no bottom tab bar. Should it? Would a bottom nav with 4–5 key routes feel better on mobile than a hamburger menu?
- If you add a bottom nav, make sure it hides on scroll-down and shows on scroll-up.

### Dashboard pages
- **Overview:** Are the stat cards the right size? Is the grid layout optimal? Does the "Quick Stats" section earn its space?
- **Income/Ideas/Mentorship:** These use table-like layouts. Are they scannable? Do they work on mobile? Are the filter tabs intuitive?
- **Analytics:** Charts need to feel integrated, not dropped in. Are chart containers styled well? Do they have proper empty states?
- **AI Insights:** This page has the most complex UI (generate button, filters, detail panel). It will become less central as chat and proactive briefings mature, but it still needs to feel considered — polish every state (loading, empty, populated, error).
- **Settings:** Simple form page. Make it feel considered, not thrown together.

### AI & chat surfaces
- **Chat panel:** There is a floating chat panel that appears across dashboard pages. It should feel like a natural extension of the design system (cards, typography, motion), not a separate UI.
- **Onboarding chat:** First-run experience is a full-screen conversational chat. It should feel calm, focused, and consistent with the rest of the product — not like a different app.

### Landing page
- **Hero:** The dashboard preview mockup — is it convincing? Does it sell the product? Are the gradient orbs too much or just right?
- **Problem/Solution:** These are the persuasion sections. Is the contrast between "without context" and "with MNotes" sharp enough?
- **Features:** Bento grid with 6 cards. Each has a mini-preview. Are these previews useful or just decorative?
- **How It Works:** Three steps. Is three the right number? Is the layout clear?
- **WaitlistCTA:** This is the conversion point. Does it feel important enough? Is the form inviting?
- **Footer:** Does it feel complete or like an afterthought?
- **Header:** Fixed nav with blur on scroll. Is the blur amount right? Does the logo have enough presence?

### Loading states
- Skeleton screens: are they convincing? Do they match the layout they're replacing?
- Shimmer animation: is it too fast, too slow, too visible?
- Loading spinners: are they used consistently?

### Empty states
- Every page has an empty state. Are they helpful? Do they guide the user to take action?
- Do they feel designed or like placeholder text?

### Forms
- Every form in every SlideOver panel. Are labels clear? Are field sizes right? Is the save/cancel pattern consistent?
- Select dropdowns: do they match the input-field styling?
- Error states: are validation messages positioned and styled well?

### Dark mode
- Go through every page in dark mode. Are contrast ratios sufficient? Do borders feel right? Are surfaces distinguishable from the background?

### Micro-details
- Scrollbar styling: the current custom scrollbar — is it too visible? Too thin?
- Text selection color: currently blue-tinted. Is it right?
- Focus states: are they visible enough for keyboard users without being distracting?
- Favicon / tab title: does the browser tab look professional?
- Print styles: not required, but don't break if someone prints.

## How to work

1. Read `docs/DESIGN_SYSTEM.md` first.
2. Read `src/app/globals.css` to understand all tokens and utility classes.
3. Read `src/lib/animations.ts` for the motion system.
4. Start from the atoms (globals.css, tailwind.config.ts) and work outward.
5. Don't add animations for the sake of it. If something doesn't need to move, it shouldn't.
6. Test every change in both light and dark mode.
7. Test every page at mobile (375px), tablet (768px), and desktop (1280px+).
8. When you're done, update `docs/DESIGN_SYSTEM.md` to reflect your changes.
9. Run `npx next build` to verify zero errors before finishing.

## The feeling

When I use this app, I should feel like I'm using something built by people who care about craft. Not flashy. Not trendy. Not AI-generated. It should feel like a tool that respects my time — fast, clear, and quietly beautiful. The kind of product where you notice the details only when you look for them, and everything just feels *right*.
