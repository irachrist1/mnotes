# Claude Code Prompt — MNotes Landing Page Redesign

You are redesigning the landing page for MNotes, a personal AI assistant dashboard for entrepreneurs. The goal is a **$100M startup feel**. Think Vercel + Linear + Airbnb.

## Read First
- `docs/DESIGN_SYSTEM.md` — the full color palette, patterns, animation specs
- `docs/PRODUCT_VISION.md` — what the product does and who it's for

## Your Scope
You own everything in `src/app/components/` (landing page components):
- `Hero.tsx` — hero section with headline, subheadline, CTA
- `Features.tsx` — feature grid
- `HowItWorks.tsx` — step-by-step explanation
- `Problem.tsx` — pain points section
- `Solution.tsx` — how MNotes solves it
- `WhatYouCanTrack.tsx` — module showcase
- `WaitlistCTA.tsx` — email capture / CTA
- `FAQ.tsx` — accordion FAQ
- `Roadmap.tsx` — product roadmap timeline
- `Footer.tsx` — footer
- `LandingHeader.tsx` — top nav

Also update `src/app/page.tsx` if needed (landing page root).

## Design Direction

### Colors
- **Primary gradient:** sky-400 (#38bdf8) → sky-500 (#0ea5e9)
- **Backgrounds:** Use gradient mesh (see DESIGN_SYSTEM.md) for hero area
- **Dark mode first.** The landing page should look incredible in dark mode.
- **Dot grid pattern** as subtle background texture (see DESIGN_SYSTEM.md)

### Typography
- Large hero text: `text-5xl md:text-7xl font-bold tracking-tight`
- Use Inter font (already configured in next/font)
- Subheadlines: text-xl text-gray-400 leading-relaxed

### Animation (Framer Motion is installed)
- Hero text: fade up with slight delay between headline and subheadline
- Feature cards: staggered entrance on scroll (use `react-intersection-observer`, already installed)
- CTA button: subtle pulse or glow animation
- Sections: fade in as they enter viewport
- Keep it subtle. Apple-level restraint, not Dribbble-level excess.

### Sections to Build

1. **Hero** — Big bold headline ("Your AI-powered business dashboard"), gradient text on key words, ghost browser mockup or abstract illustration, primary CTA button with sky-blue gradient
2. **Problem** — 3 pain point cards with icons, clean grid, subtle entrance animation
3. **Solution** — How MNotes solves each pain point. Mirror the problem cards visually.
4. **Features** — Bento grid layout (like Linear's features page). 6 features, varying card sizes. Some cards have mockup screenshots, others have icons.
5. **How It Works** — 3 steps, numbered, connected with a subtle line/path
6. **What You Can Track** — Module cards (Income, Ideas, Mentorship, Analytics, AI Insights). Each with icon and brief description.
7. **Roadmap** — Timeline with dots and lines. Show shipped vs upcoming.
8. **Waitlist CTA** — Email input + button. "Join the waitlist" or "Get early access". Sky blue gradient background.
9. **FAQ** — Accordion (Radix accordion is installed). Clean, minimal.
10. **Footer** — Links, logo, social. Simple.

### Component Rules
- Use `framer-motion` for all animations (already installed)
- Use `react-intersection-observer` for scroll-triggered animations (already installed)
- Use `lucide-react` for icons (already installed)
- Use Tailwind classes only (no inline styles except for gradient-related CSS)
- Use `@radix-ui/react-accordion` for FAQ (already installed)
- Mobile-first responsive design
- All text should be generic/product-focused, not personal to any specific user

### Quality Bar
- Every section should have proper heading hierarchy (h1 → h2 → h3)
- Smooth scroll between sections
- No layout shift on load
- Lighthouse performance score > 90
- All images use next/image with proper sizing

### What NOT to Do
- No em dashes. Use periods or commas.
- No cheesy stock photo vibes
- No "buckle up" or "let's dive in" copy
- No dark navy blues. Sky blue / baby blue only.
- Don't touch anything outside `src/app/components/` and `src/app/page.tsx`

## Setup
```bash
git clone https://github.com/irachrist1/mnotes.git
cd mnotes
git checkout fix/jarvis-feb11  # or create your own branch
npm install
npm run dev
```

Build must pass: `npm run build`

Push to `fix/jarvis-feb11` or your own branch. Coordinate via commit messages.
