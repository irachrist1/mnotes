# GitHub OAuth Connector

This doc explains how GitHub OAuth connection works in MNotes and how the agent uses it as tools.

## What Shipped

- OAuth connect/disconnect UX in Settings (replaces PAT)
- Token storage (`connectorTokens`)
- Short-lived OAuth sessions (`connectorAuthSessions`)
- Agent tools:
  - `github_list_my_pull_requests` (read)
  - `github_create_issue` (write, approval-gated)

## Key Files

- OAuth flow:
  - `convex/connectors/githubOauth.ts`
- HTTP route registration:
  - `convex/http.ts` (`GET /connectors/github/callback`)
- Session storage:
  - `convex/connectors/authSessions.ts`
  - `convex/schema.ts` (`connectorAuthSessions`)
- Token storage:
  - `convex/connectors/tokens.ts`
  - `convex/schema.ts` (`connectorTokens`)
- Settings UI:
  - `src/app/dashboard/settings/page.tsx`
- Agent tools:
  - `convex/ai/agentTools.ts`

## Environment Variables (Convex)

Set these in Convex (not Next.js env files):

- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `CONVEX_SITE_URL`

## GitHub App Setup

In your GitHub OAuth App settings, set the callback URL to:

```
https://<your-deployment>.convex.site/connectors/github/callback
```

## OAuth Flow (Simple)

1. User clicks Connect in Settings.
2. The app calls `connectors.githubOauth.start({ origin, access })`.
3. Convex creates a `connectorAuthSessions` row keyed by `state` and returns a GitHub authorize URL.
4. The app opens that URL in a popup.
5. GitHub redirects the popup to Convex callback with `code` + `state`.
6. Convex exchanges `code` for an `access_token`, stores it in `connectorTokens`, deletes the session, then returns a tiny HTML page that `postMessage`s `{ type: "mnotes:connector_connected", provider: "github" }` back to the opener and closes the popup.

## Read vs Write Scopes

Default connect is “read” (no scopes requested).

If you click **Enable write** in Settings, the app reconnects with scope:

- `repo`

This is required for writing to private repos. Actual side-effects are still approval-gated per task.

## Analytics (PostHog)

- `connector_oauth_started`
- `connector_oauth_connected`
- `connector_oauth_failed`
- `agent_github_list_prs`
- `agent_github_issue_created`

