# MNotes Design System v2 — "Sky Blue Premium"

## Design Philosophy

**Think:** Vercel's precision + Linear's polish + Airbnb's warmth + Apple's restraint

The goal is a dashboard that feels like it cost $100M to build. Not because of flashy effects, but because every pixel is intentional. The complexity should be in the engineering, not in the user's face.

### Core Principles

1. **Invisible complexity.** The app feels effortless but the code is meticulous. Micro-interactions, fluid transitions, pixel-perfect spacing.
2. **Sky blue warmth.** Not corporate navy. Baby blue / sky blue gradients that feel aspirational and calm. Like looking at a clear sky.
3. **Whitespace is a feature.** Linear and Vercel use generous spacing. Cards breathe. Text doesn't crowd.
4. **Motion with purpose.** Framer Motion for: page transitions, card entrances, hover states, loading → loaded transitions. Never gratuitous.
5. **Dark mode first.** The dark theme should be the showcase. Light is the fallback. Think Linear's dark mode.

---

## Color Palette

### Primary — Sky Blue Gradient System
```
Sky-50:   #f0f9ff  → backgrounds, hover states
Sky-100:  #e0f2fe  → selected states, light fills
Sky-200:  #bae6fd  → borders on hover, progress bars
Sky-300:  #7dd3fc  → secondary accents
Sky-400:  #38bdf8  → primary buttons, active states
Sky-500:  #0ea5e9  → primary actions, links
Sky-600:  #0284c7  → hover on primary buttons
```

### Gradient Tokens
```css
--gradient-primary: linear-gradient(135deg, #38bdf8, #0ea5e9);        /* sky-400 → sky-500 */
--gradient-subtle:  linear-gradient(135deg, #f0f9ff, #e0f2fe);        /* sky-50 → sky-100 */
--gradient-glow:    linear-gradient(135deg, #7dd3fc20, #38bdf820);    /* transparent sky glow */
--gradient-sidebar: linear-gradient(180deg, #0c1222, #0f172a);        /* deep dark for sidebar */
--gradient-card:    linear-gradient(135deg, #ffffff05, #ffffff02);     /* subtle glass in dark mode */
```

### Neutrals (keep existing gray scale, just update usage)
- Dark bg: `#0a0f1a` (deeper than current gray-950)
- Card bg dark: `#111827` with `border: 1px solid rgba(255,255,255,0.06)`
- Card bg light: `#ffffff` with `border: 1px solid rgba(0,0,0,0.06)`
- Text primary dark: `#f1f5f9`
- Text secondary dark: `#94a3b8`

### Semantic Colors (unchanged)
- Success: emerald-500
- Warning: amber-500
- Error: red-500
- Info: sky-500

---

## Typography

- **Font:** Inter (via `next/font/google`). If we want more premium, add `Cal Sans` for headings.
- **Headings:** font-semibold, tracking-tight (like Linear)
- **Body:** text-sm, leading-relaxed, text-gray-600 dark:text-gray-400
- **Numbers:** tabular-nums everywhere (already doing this, keep it)
- **Labels:** text-xs, uppercase, tracking-wide, font-medium

---

## Subtle Patterns

### Dot Grid Background (like Linear)
```css
.bg-dot-pattern {
  background-image: radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px);
  background-size: 24px 24px;
}
/* Dark mode */
.dark .bg-dot-pattern {
  background-image: radial-gradient(circle, rgba(148,163,184,0.07) 1px, transparent 1px);
}
```

### Gradient Mesh (for hero / landing page)
```css
.bg-gradient-mesh {
  background:
    radial-gradient(at 27% 37%, #7dd3fc15 0px, transparent 50%),
    radial-gradient(at 97% 21%, #38bdf810 0px, transparent 50%),
    radial-gradient(at 52% 99%, #0ea5e908 0px, transparent 50%);
}
```

### Noise Texture (optional, Apple-style)
A very subtle noise overlay at 2-3% opacity for texture on cards.

---

## Component Patterns

### Cards (Vercel-style)
```
- rounded-xl (not rounded-lg)
- border: 1px solid with very low opacity
- Subtle shadow: shadow-sm in light, none in dark (border does the work)
- On hover: border brightens slightly, subtle translateY(-1px) + shadow-md
- Transition: all 200ms ease
```

### Buttons
```
Primary:   bg-gradient-to-r from-sky-400 to-sky-500, text-white, rounded-lg
           hover: from-sky-500 to-sky-600, shadow-lg shadow-sky-500/25
Secondary: bg-white/5 dark:bg-white/5, border border-white/10, text-gray-300
           hover: bg-white/10, border-white/20
Ghost:     text-gray-400, hover:text-white, no bg
```

### Sidebar (Linear-style)
```
- Deep dark background (#0c1222) with no border (or very subtle one)
- Active item: bg-sky-500/10, text-sky-400, left border accent (2px sky-400)
- Hover: bg-white/5
- Icons: 18px, stroke-width 1.5 (thinner = more premium)
- Logo area: clean wordmark, no icon clutter
```

### Stat Cards (Apple-style)
```
- Large number: text-3xl font-semibold tracking-tight
- Subtle sky-blue gradient icon backgrounds (not flat gray)
- Micro-trend indicators with smooth number animation (framer-motion)
- On hover: subtle glow effect using box-shadow with sky-blue
```

### Charts (Airbnb-style)
```
- Smooth curves, not harsh lines
- Sky blue gradient fills (opacity 0.1 → 0.01 from top to bottom)
- Minimal gridlines (just horizontal, dashed, very low opacity)
- Tooltips: rounded-lg, shadow-xl, animate in with scale
- No axis clutter. Labels only where they add value.
```

### Tables / Lists
```
- No visible borders between rows in dark mode
- Alternate row highlighting at 2% opacity difference
- Hover: bg-white/[0.03]
- Text alignment: numbers right-aligned, names left-aligned
```

---

## Animation System (Framer Motion)

### Page Transitions
```tsx
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};
```

### Card Entrance (staggered)
```tsx
const containerVariants = {
  enter: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};
```

### Hover Effects
```tsx
whileHover={{ y: -1, transition: { duration: 0.2 } }}
// Combined with CSS: shadow transition, border color change
```

### Number Counting
For stat cards, animate from 0 to value on first load using `useMotionValue` + `useTransform`.

### Loading → Loaded
Skeleton → Content transition with crossfade (opacity + slight scale).

---

## Spacing System

Follow Tailwind's 4px grid strictly:
- Section gaps: `gap-6` (24px)
- Card padding: `p-6` (24px)
- Between elements in cards: `space-y-4` (16px)
- Between label and value: `mb-1` (4px)
- Icon to text: `gap-3` (12px)

---

## File Structure for Design System

```
src/
├── styles/
│   └── design-tokens.css     ← CSS custom properties, gradients, patterns
├── components/
│   ├── ui/
│   │   ├── Button.tsx         ← primary, secondary, ghost, icon variants
│   │   ├── Card.tsx           ← base card with hover animation
│   │   ├── StatCard.tsx       ← enhanced with gradient icon bg + number animation
│   │   ├── Badge.tsx          ← already done ✅
│   │   ├── Input.tsx          ← styled input with focus ring
│   │   ├── Select.tsx         ← custom select with sky-blue focus
│   │   ├── PageHeader.tsx     ← already done ✅
│   │   ├── EmptyState.tsx     ← already done ✅
│   │   ├── Skeleton.tsx       ← already done ✅
│   │   ├── SlideOver.tsx      ← already done ✅
│   │   ├── AnimatedNumber.tsx ← counting animation for stats
│   │   └── MotionCard.tsx     ← framer-motion wrapper for stagger
│   └── layout/
│       ├── Sidebar.tsx        ← redesigned with gradient + accent
│       └── DashboardShell.tsx ← add background patterns
```

---

## Work Split

### Jarvis (this agent) — Design System + Dashboard UI
Owns: sidebar redesign, color system, animations, stat cards, dashboard overview, settings page polish
Why: UI taste, design decisions, component architecture

### Claude Code — Landing Page Redesign
Owns: Hero, Features, How It Works, Problem/Solution, CTA, Footer
Why: lots of components, clear scope, can work in parallel
Prompt: see `docs/CLAUDE_CODE_PROMPT.md`

### Codex — Backend + Infrastructure + Testing
Owns: auth system (Clerk), Convex schema validation, test suite, CI/CD, accessibility audit
Why: long-running, systematic work. Not UI-sensitive.
Prompt: see `docs/CODEX_PROMPT.md`

---

## Implementation Priority

1. **CSS tokens + patterns** (globals.css rewrite) — foundation everything else builds on
2. **Sidebar** — first thing users see, sets the tone
3. **StatCard + AnimatedNumber** — immediate wow factor on dashboard
4. **Card component** — base for all panels
5. **Button component** — used everywhere
6. **Page transitions** — the "feel" factor
7. **Chart styling** — analytics page polish
8. **Landing page** — Claude Code handles this in parallel

---

*This is a living document. Update as we build.*
