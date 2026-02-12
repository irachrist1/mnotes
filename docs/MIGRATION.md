# Ideas Table: snake_case → camelCase Migration

This migration transforms legacy Supabase data (snake_case) to match the Convex schema (camelCase).

## Status: ✅ Completed

18 ideas were migrated successfully. The schema has been reverted to camelCase-only.

## For future deployments (e.g. production)

If you have snake_case data in another Convex deployment:

1. Temporarily add optional snake_case fields to the ideas schema (see git history).
2. Push: `npx convex dev` or `npx convex deploy`
3. Run: `npx convex run migrations/migrateIdeasToCamelCase:migrate`
4. Revert schema to camelCase-only and push again.
