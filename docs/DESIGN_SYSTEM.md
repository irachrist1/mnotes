# MNotes Design System

> Single source of truth for all visual decisions.

## Principles

1. **Nothing moves unless it has to.** No hover lifts, no scale presses, no shadow blooms. Hover changes a color. That's it.
2. **Fast.** Every transition is ≤ 150ms. The app should feel instant.
3. **Warm monochrome + one accent.** Stone neutrals everywhere. Royal blue only where it earns its place.
4. **Same language everywhere.** Landing page and dashboard share the same tokens, components, and interaction rules.

## Color Palette

Defined as CSS custom properties in `src/app/globals.css`.

### Neutrals (warm stone)

| Token        | Hex       | Usage                          |
|--------------|-----------|--------------------------------|
| `--stone-50` | `#FAFAF9` | Page backgrounds (light)       |
| `--stone-100`| `#F5F5F4` | Subtle surfaces, subtle fills  |
| `--stone-200`| `#E7E5E4` | Borders (light)                |
| `--stone-300`| `#D6D3D1` | Dividers, disabled borders     |
| `--stone-400`| `#A8A29E` | Placeholder text, muted icons  |
| `--stone-500`| `#78716C` | Secondary text                 |
| `--stone-600`| `#57534E` | Tertiary text                  |

### Accent (royal blue)

| Token        | Hex       | Usage                          |
|--------------|-----------|--------------------------------|
| `--blue-400` | `#60A5FA` | Dark mode accent               |
| `--blue-500` | `#3B82F6` | Sidebar active, logo gradient  |
| `--blue-600` | `#2563EB` | Primary accent, input focus    |
| `--blue-700` | `#1D4ED8` | Hover state for blue elements  |

**Do not introduce new hues.** Cyan, teal, violet, and other colors are not part of this palette. Semantic colors (emerald for success, red for error, amber for warning) are allowed only in status badges and trend indicators.

### Semantic (RGB triplets for opacity support)

- `--color-primary` / `--color-accent` — blue scale
- `--color-success` — emerald
- `--color-warning` — amber (semantic only, not decorative)
- `--color-error` — red
- `--color-surface` / `--color-background` / `--color-border`
- `--color-text-primary` / `--color-text-secondary`

### Buttons

- **Primary:** Charcoal `#1C1917` (light) / `#FAFAF9` (dark). Hover shifts one shade lighter.
- **Blue CTA (landing only):** `bg-blue-600 hover:bg-blue-500`. No shadow, no lift.

## Typography

Font: **Inter** via `next/font/google`, loaded with `variable: "--font-inter"` applied to the `<html>` element. Tailwind's `font-sans` resolves to `var(--font-inter)`.

### Scale

| Context              | Size         | Weight       | Notes                              |
|----------------------|--------------|--------------|------------------------------------|
| Page header (h1)     | `text-2xl`   | `semibold`   | `tracking-tight`                   |
| Section heading (h2) | `text-lg`    | `semibold`   | Panel and card titles              |
| Body                 | `text-sm`    | `normal`     | Default for most content           |
| Label                | `text-xs`    | `medium`     | `uppercase tracking-wider` for stats |
| Micro                | `text-[10px]`| `normal`     | Metadata, timestamps               |

- Use `tabular-nums` on all numeric values (stat values, trends, ratings).
- Use `tracking-tight` on large headings.

## Interaction Rules

**These rules are non-negotiable.**

- **Buttons:** Hover = background color change. No transform, no shadow, no scale.
- **Cards:** Hover = border-color shift (stone-400 opacity in light, white/10 in dark). No transform, no shadow.
- **Inputs:** Focus = border turns `#2563EB`. No ring, no glow.
- **Links/nav:** Hover = text color change. No underline animation.
- **Nothing uses `translateY`, `scale`, `box-shadow` on hover/active.** Ever.
- **All transitions ≤ 150ms.** (`duration-150`)

## Motion

All motion config lives in `src/lib/animations.ts`.

### Allowed

- **Page mount:** 200ms opacity fade via `animate-fade-in` CSS class (dashboard content area).
- **Scroll reveal (landing only):** `fadeUpVariants` — 400ms opacity + 14px y offset, triggered once by `useInView`.
- **Stagger:** 60ms between siblings via `staggerContainer`.
- **Panels:** SlideOver slides from right with spring (stiffness 400, damping 35). Backdrop fades 200ms.
- **Accordion:** 250ms height animation.
- **Number counters:** StatCard uses a 600ms count animation on mount only.

### Forbidden

- Infinite animations — no `animate-pulse` on content, no looping glows, no `repeat: Infinity` in Framer Motion.
- `layoutId` on nav items (causes stutter during Next.js page transitions).
- Hover/active transforms of any kind.
- Spring animations on page-level content.
- Any animation > 400ms.
- Transitions > 150ms on hover/active states.

### Easing

All motion uses `[0.16, 1, 0.3, 1]` (Apple-style deceleration curve).

## Utility Classes

Defined in `src/app/globals.css`.

| Class                | Purpose                                    |
|----------------------|--------------------------------------------|
| `card`               | White surface, rounded-xl, 1px border      |
| `card-hover`         | Adds border-color shift on hover           |
| `btn-primary`        | Charcoal button, inverts on dark           |
| `btn-secondary`      | White/transparent with border              |
| `btn-ghost`          | Text-only, bg on hover                     |
| `btn-icon`           | 36px square icon button                    |
| `btn-outline`        | Bordered, bg on hover                      |
| `input-field`        | Standard text input with focus border      |
| `focus-ring`         | Blue ring-2 on focus (for non-input elements) |
| `bg-dot-pattern`     | Subtle dot grid background                 |
| `bg-gradient-mesh`   | Radial gradient mesh background            |
| `animate-fade-in`    | 200ms opacity fade on mount                |
| `animate-shimmer`    | Loading shimmer overlay (light: 35% white, dark: 7% white) |
| `skeleton`           | Loading placeholder — use the `.skeleton` CSS class; includes `::after` shimmer |
| `text-gradient`      | Blue gradient text (blue-500 → blue-600)   |
| `dashboard-panel`    | Dashboard section container (rounded-xl, no shadow) |

## Components

All in `src/components/ui/`.

| Component     | Purpose                              | Animation         |
|---------------|--------------------------------------|--------------------|
| `StatCard`    | Metric card with label/value/icon    | 250ms opacity fade |
| `Badge`       | Status pill (success/warning/info/etc)| None              |
| `PageHeader`  | Page title + description + action    | 250ms opacity fade |
| `EmptyState`  | Placeholder for empty data           | 250ms opacity fade |
| `SlideOver`   | Right-side panel for forms           | Spring slide-in    |
| `Skeleton`    | Loading placeholder with shimmer     | Shimmer (via CSS `::after`) |
| `Charts`      | Chart.js wrappers (Bar, Doughnut, Line) | None            |

### Skeleton usage

Use the `Skeleton` component, which applies the `.skeleton` CSS class. This renders a stone-100/stone-800 base with a shimmer `::after` overlay. Do **not** use `animate-pulse` directly.

### Layout

| Component         | Location                              |
|-------------------|---------------------------------------|
| `Sidebar`         | `src/components/layout/Sidebar.tsx`   |
| `DashboardShell`  | `src/components/layout/DashboardShell.tsx` |
| `ChatPanel`       | `src/components/chat/ChatPanel.tsx`   |
| `ChatButton`      | `src/components/chat/ChatButton.tsx`  |
| `ConfirmationCard`| `src/components/chat/ConfirmationCard.tsx` |

Sidebar uses plain `div` for active indicators (no `motion.div`, no `layoutId`).

## File Map

```
src/app/globals.css          — All design tokens, utility classes, animations
src/lib/animations.ts        — Framer Motion variants (fadeUp, fadeIn, stagger, scaleIn, slideIn)
tailwind.config.ts           — Extended colors, fonts (Inter), animation keyframes
src/components/ui/           — Reusable UI components
src/components/layout/       — Sidebar, DashboardShell
src/app/components/          — Landing page sections (Hero, Features, Problem, etc.)
src/app/dashboard/           — Dashboard pages (7 routes)
docs/DESIGN_SYSTEM.md        — This file
```

## Accessibility

- Visible focus styles on all interactive elements (`focus-ring` or `input-field:focus`).
- Semantic heading hierarchy (`h1` > `h2` > `h3`).
- `aria-label` on icon-only buttons.
- Focus trap in `SlideOver` panel.
- `prefers-reduced-motion` is respected — all animations and transitions collapse to near-zero duration.

## Changelog

### 2026-02-12 Rebrand pass
- **Typography:** Added Inter via `next/font/google`. Applied via `--font-inter` CSS variable.
- **Skeleton:** Replaced `animate-pulse` (forbidden) with CSS `::after` shimmer. Updated `Skeleton` component to use `.skeleton` class.
- **Shimmer:** Updated `animate-shimmer` to use a white overlay (35% light / 7% dark) with `ease-in-out` timing.
- **Animations:** Removed two forbidden infinite animations from Hero: `animate-pulse` on eyebrow dot and `repeat: Infinity` bounce on scroll indicator.
- **Palette:** Removed `cyan-*` from Hero, Solution, WaitlistCTA, and Features. All gradients now use blue-400–blue-700 only.
- **Transitions:** Fixed Features bento hover from `duration-300` → `duration-150`.
- **Inputs:** Fixed WaitlistCTA email input focus from `ring-2` → border-only (`focus:border-blue-600`).
- **SlideOver:** Removed broken shadow class (em-dash typo). Body padding bumped `py-4` → `py-5`.
- **PageHeader:** Bumped h1 from `text-xl` → `text-2xl` for more commanding page presence.
- **Sidebar:** Added `border-b` to mobile sticky header.
- **DashboardShell:** Removed `transition-all duration-200` (unnecessary content shift jitter). Removed redundant `min-h-screen`.
- **dashboard-panel:** Changed `rounded-lg` → `rounded-xl` (matches `.card`). Removed `shadow-sm`.
- **layout.tsx:** Improved metadata title/description. Removed `transition-colors` from root div (prevents paint flash).
- **Reduced motion:** Added `@media (prefers-reduced-motion: reduce)` — collapses all animations/transitions to 0.01ms.

### 2026-02-12 Jarvis v1 UI
- **Onboarding:** Added full-screen conversational onboarding page using `bg-gradient-mesh`, standard card styles, and chat bubbles that respect motion rules (short, non-looping animations only).
- **Chat:** Introduced `ChatPanel`, `ChatButton`, and `ConfirmationCard` components. Chat bubbles follow existing color and typography tokens; confirmation cards reuse the `.card` pattern with status-accented borders.
- **Assistant identity:** Avatar picker in onboarding uses existing semantic colors and button rules (no hover scale/transform; only color/border changes on interaction).
