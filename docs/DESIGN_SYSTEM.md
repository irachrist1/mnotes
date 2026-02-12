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

## Interaction Rules

**These rules are non-negotiable.**

- **Buttons:** Hover = background color change. No transform, no shadow, no scale.
- **Cards:** Hover = border-color shift (stone-400 opacity in light, white/10 in dark). No transform, no shadow.
- **Inputs:** Focus = border turns `#2563EB`. No ring, no glow.
- **Links/nav:** Hover = text color change. No underline animation.
- **Nothing uses `translateY`, `scale`, `box-shadow` on hover/active.** Ever.

## Motion

All motion config lives in `src/lib/animations.ts`.

### Allowed

- **Page mount:** 200ms opacity fade via `animate-fade-in` CSS class (dashboard content area).
- **Scroll reveal (landing only):** `fadeUpVariants` — 400ms opacity + 14px y offset, triggered once by `useInView`.
- **Stagger:** 60ms between siblings via `staggerContainer`.
- **Panels:** SlideOver slides from right with spring (stiffness 400, damping 35). Backdrop fades 200ms.
- **Accordion:** 250ms height animation.

### Forbidden

- Infinite animations (no `animate-pulse` on content, no looping glows).
- `layoutId` on nav items (causes stutter during Next.js page transitions).
- Hover/active transforms of any kind.
- Spring animations on page-level content.
- Any animation > 400ms.

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
| `animate-shimmer`    | Loading skeleton shimmer                   |
| `text-gradient`      | Blue gradient text                         |
| `dashboard-panel`    | Dashboard section container                |

## Components

All in `src/components/ui/`.

| Component     | Purpose                              | Animation         |
|---------------|--------------------------------------|--------------------|
| `StatCard`    | Metric card with label/value/icon    | 250ms opacity fade |
| `Badge`       | Status pill (success/warning/info/etc)| None              |
| `PageHeader`  | Page title + description + action    | 250ms opacity fade |
| `EmptyState`  | Placeholder for empty data           | 250ms opacity fade |
| `SlideOver`   | Right-side panel for forms           | Spring slide-in    |
| `Skeleton`    | Loading placeholder with shimmer     | Shimmer animation  |
| `Charts`      | Chart.js wrappers (Bar, Doughnut, Line) | None            |

### Layout

| Component       | Location                              |
|-----------------|---------------------------------------|
| `Sidebar`       | `src/components/layout/Sidebar.tsx`   |
| `DashboardShell`| `src/components/layout/DashboardShell.tsx` |

Sidebar uses plain `div` for active indicators (no `motion.div`, no `layoutId`).

## File Map

```
src/app/globals.css          — All design tokens, utility classes, animations
src/lib/animations.ts        — Framer Motion variants (fadeUp, fadeIn, stagger, scaleIn, slideIn)
tailwind.config.ts           — Extended colors, animation keyframes
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
- `prefers-reduced-motion` should be respected (TODO: not yet implemented).
