"use node";

import { action, httpAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { captureEvent } from "../lib/posthog";
import { randomBytes } from "node:crypto";

type GoogleProvider = "gmail" | "google-calendar";

function getScopes(provider: GoogleProvider): string[] {
  if (provider === "gmail") {
    return ["https://www.googleapis.com/auth/gmail.readonly"];
  }
  return ["https://www.googleapis.com/auth/calendar.readonly"];
}

function buildGoogleAuthUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes: string[];
}): string {
  const params = new URLSearchParams();
  params.set("client_id", args.clientId);
  params.set("redirect_uri", args.redirectUri);
  params.set("response_type", "code");
  params.set("scope", args.scopes.join(" "));
  params.set("access_type", "offline");
  params.set("include_granted_scopes", "true");
  params.set("prompt", "consent");
  params.set("state", args.state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export const start = action({
  args: {
    provider: v.union(v.literal("gmail"), v.literal("google-calendar")),
    origin: v.string(), // app origin for postMessage targetOrigin
  },
  handler: async (ctx, args): Promise<{ authUrl: string }> => {
    const userId = await getUserId(ctx);
    if (!userId || userId === "default") {
      throw new Error("Not authenticated");
    }

    const convexSiteUrl = process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
    if (!convexSiteUrl) throw new Error("CONVEX_SITE_URL is not configured.");

    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_OAUTH_CLIENT_ID is not configured in Convex env.");

    const origin = args.origin.trim();
    if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
      throw new Error("Invalid origin");
    }
    if (origin.length > 200) throw new Error("Origin too long");

    const state = randomBytes(16).toString("hex");
    const provider = args.provider as GoogleProvider;
    const scopes = getScopes(provider);
    const redirectUri = `${convexSiteUrl.replace(/\/$/, "")}/connectors/google/callback`;
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await ctx.runMutation(internal.connectors.authSessions.createInternal, {
      userId,
      provider: provider as any,
      state,
      origin,
      scopes,
      expiresAt,
    });

    void captureEvent({
      distinctId: userId,
      event: "connector_oauth_started",
      properties: { provider, scopes },
    });

    return {
      authUrl: buildGoogleAuthUrl({ clientId, redirectUri, state, scopes }),
    };
  },
});

export const callback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const error = url.searchParams.get("error") || "";

  if (error) {
    // If the user cancels/denies, Google still returns a callback. Clean up session if possible.
    const sess = state
      ? await ctx.runQuery(internal.connectors.authSessions.getByStateInternal, { state })
      : null;
    if (sess) {
      await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: sess._id });
      void captureEvent({
        distinctId: sess.userId,
        event: "connector_oauth_failed",
        properties: { provider: sess.provider, error },
      });
      return new Response(buildPostMessageHtml({
        title: "Google connection failed",
        body: error,
        origin: String(sess.origin || ""),
        payload: { type: "mnotes:connector_error", provider: sess.provider, error },
      }), {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(`<html><body><h3>Google connection failed</h3><p>${escapeHtml(error)}</p></body></html>`, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!state || !code) {
    return new Response(`<html><body><h3>Invalid callback</h3><p>Missing state/code.</p></body></html>`, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const session = await ctx.runQuery(internal.connectors.authSessions.getByStateInternal, { state });
  if (!session) {
    return new Response(`<html><body><h3>Session expired</h3><p>Please try connecting again.</p></body></html>`, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (Date.now() > session.expiresAt) {
    await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });
    return new Response(`<html><body><h3>Session expired</h3><p>Please try connecting again.</p></body></html>`, {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const convexSiteUrl = process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!convexSiteUrl || !clientId || !clientSecret) {
    void captureEvent({
      distinctId: session.userId,
      event: "connector_oauth_failed",
      properties: { provider: session.provider, error: "server_not_configured" },
    });
    return new Response(buildPostMessageHtml({
      title: "Server not configured",
      body: "Missing Google OAuth env vars. Ask the app owner to configure GOOGLE_OAUTH_CLIENT_ID/SECRET.",
      origin: String(session.origin || ""),
      payload: { type: "mnotes:connector_error", provider: session.provider, error: "server_not_configured" },
    }), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  const redirectUri = `${convexSiteUrl.replace(/\/$/, "")}/connectors/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });

    void captureEvent({
      distinctId: session.userId,
      event: "connector_oauth_failed",
      properties: { provider: session.provider, error: "token_exchange_failed", status: tokenRes.status },
    });

    return new Response(buildPostMessageHtml({
      title: "Token exchange failed",
      body: text.slice(0, 900),
      origin: String(session.origin || ""),
      payload: { type: "mnotes:connector_error", provider: session.provider, error: "token_exchange_failed" },
    }), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const data = (await tokenRes.json()) as any;
  const accessToken = String(data?.access_token ?? "");
  const refreshToken = data?.refresh_token ? String(data.refresh_token) : undefined;
  const expiresIn = typeof data?.expires_in === "number" ? data.expires_in : 3600;
  const scopeStr = typeof data?.scope === "string" ? data.scope : "";

  if (!accessToken) {
    await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });
    void captureEvent({
      distinctId: session.userId,
      event: "connector_oauth_failed",
      properties: { provider: session.provider, error: "no_access_token" },
    });
    return new Response(buildPostMessageHtml({
      title: "Token exchange failed",
      body: "No access token returned.",
      origin: String(session.origin || ""),
      payload: { type: "mnotes:connector_error", provider: session.provider, error: "no_access_token" },
    }), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const scopes = scopeStr ? scopeStr.split(/\s+/).filter(Boolean) : session.scopes;
  const now = Date.now();
  await ctx.runMutation(internal.connectors.tokens.setInternal, {
    userId: session.userId,
    provider: session.provider,
    accessToken,
    refreshToken,
    scopes,
    expiresAt: now + expiresIn * 1000,
  });

  await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });

  void captureEvent({
    distinctId: session.userId,
    event: "connector_oauth_connected",
    properties: { provider: session.provider, scopes },
  });

  return new Response(buildPostMessageHtml({
    title: "Connected",
    body: "You can close this window.",
    origin: String(session.origin || ""),
    payload: { type: "mnotes:connector_connected", provider: session.provider },
  }), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

function buildPostMessageHtml(args: {
  title: string;
  body: string;
  origin: string;
  payload: any;
}): string {
  const safeTitle = escapeHtml(args.title);
  const safeBody = escapeHtml(args.body || "");
  return `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>${safeTitle}</title></head>
  <body style="font-family: ui-sans-serif, system-ui; padding: 24px;">
    <h3>${safeTitle}</h3>
    <p>${safeBody}</p>
    <script>
      (function() {
        try {
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(args.payload)}, ${JSON.stringify(args.origin)});
          }
        } catch (e) {}
        try { window.close(); } catch (e) {}
      })();
    </script>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
