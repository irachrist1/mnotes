# Google OAuth Connectors (Gmail + Calendar)

This doc explains the shipped Google OAuth connector flow: how the Settings UI connects Gmail/Google Calendar, how tokens are stored in Convex, and how the agent uses them as tools.

## What Shipped

- OAuth connect/disconnect UX in Settings
- Token storage (`connectorTokens`)
- Short-lived OAuth sessions (`connectorAuthSessions`)
- Read-only agent tools:
  - `gmail_list_recent`
  - `calendar_list_upcoming`
- Automatic Google access token refresh when `expiresAt` is reached (requires `refreshToken`)

## Key Files

- Schema:
  - `convex/schema.ts` (`connectorTokens`, `connectorAuthSessions`)
- OAuth session helpers:
  - `convex/connectors/authSessions.ts`
- Google OAuth flow (start + callback):
  - `convex/connectors/googleOauth.ts`
- HTTP route registration:
  - `convex/http.ts`
- Token CRUD:
  - `convex/connectors/tokens.ts`
- Agent tools:
  - `convex/ai/agentTools.ts`
- Settings UI:
  - `src/app/dashboard/settings/page.tsx`

## Environment Variables (Convex)

These are read from **Convex actions/tools** via `process.env.*`. Set them in Convex, not in Next.js env files.

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `CONVEX_SITE_URL`

`CONVEX_SITE_URL` should be your Convex site base URL, for example:

```
https://<your-deployment>.convex.site
```

## Google Cloud Console Setup

You must register the redirect URI to match the callback route:

```
https://<your-deployment>.convex.site/connectors/google/callback
```

Notes:

- You will likely need separate redirect URIs for local dev and prod deployments.
- The shipped flow requests offline access (`access_type=offline`) and forces consent (`prompt=consent`) so a refresh token is returned.

## OAuth Flow (Simple)

1. User clicks Connect (Gmail or Calendar) in Settings.
2. The app calls `connectors.googleOauth.start({ provider, origin })`.
3. Convex:
   - Creates a random `state`
   - Inserts a `connectorAuthSessions` row keyed by that `state`
   - Returns a Google `authUrl` containing `redirect_uri`, `scope`, and `state`
4. The app opens the `authUrl` in a popup.
5. Google redirects the popup to:
   - `GET /connectors/google/callback?code=...&state=...`
6. Convex callback:
   - Loads the session by `state`
   - Exchanges `code` for tokens at `https://oauth2.googleapis.com/token`
   - Stores tokens in `connectorTokens`
   - Deletes the session row
   - Returns a tiny HTML page that `postMessage`s `{ type: "mnotes:connector_connected", provider }` to the opener and closes the popup
7. The Settings page listens for that message and updates the UI reactively.

Failure mode:

- Callback returns an HTML page that posts `{ type: "mnotes:connector_error", provider, error }` when possible.

## Token Refresh (Why It Exists)

Google access tokens expire. For long-running usage, we need refresh tokens.

When `gmail_list_recent` or `calendar_list_upcoming` runs:

1. Load token from `connectorTokens` via internal query.
2. If `expiresAt` is still in the future, use `accessToken`.
3. If expired:
   - Use `refreshToken` + `GOOGLE_OAUTH_CLIENT_ID/SECRET` to refresh at `https://oauth2.googleapis.com/token`
   - Patch `connectorTokens` with the new `accessToken` + new `expiresAt`

Important:

- `convex/connectors/tokens.ts` preserves `refreshToken` by default when upserting, because Google often omits `refresh_token` on subsequent exchanges.

## Analytics (PostHog)

Events are captured server-side via `convex/lib/posthog.ts`.

- `connector_oauth_started`
- `connector_oauth_connected`
- `connector_oauth_failed`
- `agent_gmail_list_recent`
- `agent_calendar_list_upcoming`
- `agent_google_token_refreshed`

## Limitations / Next Steps

- No write actions shipped yet (send email, create event). Those must be approval-gated (P2.7).
- No “tool dashboard” beyond Settings Connections yet (future: show scopes, last sync, and per-tool toggles).

