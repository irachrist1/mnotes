# Contributing to MNotes

## Development Setup

```bash
git clone https://github.com/irachrist1/mnotes.git
cd mnotes
npm install
npx convex dev   # terminal 1
npm run dev      # terminal 2
```

## Coding Conventions

### TypeScript

- Strict mode. No `any` unless absolutely necessary.
- Prefer `interface` for object shapes, `type` for unions and intersections.
- Use path aliases: `@/` for `src/`, `@convex` for `convex/`.

### React

- Functional components only.
- Use `"use client"` directive for client components.
- State management via Convex `useQuery`/`useMutation` (no Redux, no Zustand).
- Colocate page logic in `src/app/dashboard/<module>/page.tsx`.

### Convex

- Every query and mutation must call `getUserId(ctx)` to scope data by user.
- Export names must match frontend `api.*` imports exactly. The generated types use `anyApi`, so mismatches crash at runtime.
- Actions that use `fetch()` or Node APIs must have `"use node"` at the top of the file.
- Validate all user inputs server-side in mutation handlers using helpers from `convex/lib/validate.ts`.

### Styling

- Tailwind CSS utility classes. No CSS modules.
- Follow the design system in `docs/DESIGN_SYSTEM.md`.
- Dark mode: use `dark:` variants. The app is dark-mode-first.

### Testing

- Test files live next to the code they test: `Component.test.tsx`.
- Use Vitest + React Testing Library.
- Run tests before committing: `npm test`.

## Commit Messages

Use imperative mood, be specific:

- `add Clerk auth middleware`
- `fix income stream validation for negative amounts`
- `update README with setup instructions`

Avoid vague messages like "update stuff" or "fix bug".

## Branch Naming

- `fix/<description>` for bug fixes
- `feat/<description>` for new features
- `claude/<description>` for AI-assisted development

## Pull Requests

- Keep PRs focused on a single concern.
- Ensure `npm run build` and `npm test` pass.
- Describe what changed and why in the PR body.
