# Ideas Field Migration (snake_case -> camelCase)

## Purpose

This migration exists only for legacy Convex deployments that still have snake_case idea fields.

- Migration function: `convex/migrations/migrateIdeasToCamelCase.ts`
- Command: `npx convex run migrations/migrateIdeasToCamelCase:migrate`

## Current Status

Completed for this project. Keep this doc only as a reference for older environments.

## When to run it

Run only if your `ideas` documents still include fields like:

- `ai_relevance`, `competition_level`, `created_date`, `last_updated`
- `potential_revenue`, `related_income_stream`, `required_skills`
- `source_of_inspiration`, `next_steps`, `implementation_complexity`
- `time_to_market`, `market_size`, `hardware_component`

If your deployment already uses camelCase fields, do not run this migration.
