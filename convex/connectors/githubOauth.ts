import { action, httpAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { captureEvent } from "../lib/posthog";
// Use Web Crypto API (works in both Convex V8 and Node runtimes)
function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

type GithubAccess = "read" | "write";

function getScopes(access: GithubAccess): string[] {
  if (access === "write") {
    // Needed for private repos. This is broad; we gate actual side-effects via approvals.
    return ["repo"];
  }
  // No scopes required for basic user info and public repo access.
  return [];
}

function buildGithubAuthUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes: string[];
}): string {
  const params = new URLSearchParams();
  params.set("client_id", args.clientId);
  params.set("redirect_uri", args.redirectUri);
  params.set("state", args.state);
  if (args.scopes.length > 0) params.set("scope", args.scopes.join(" "));
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export const start = action({
  args: {
    origin: v.string(),
    access: v.optional(v.union(v.literal("read"), v.literal("write"))),
  },
  handler: async (ctx, args): Promise<{ authUrl: string }> => {
    const userId = await getUserId(ctx);
    if (!userId || userId === "default") {
      throw new Error("Not authenticated");
    }

    const convexSiteUrl = process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
    if (!convexSiteUrl) throw new Error("CONVEX_SITE_URL is not configured.");

    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
    if (!clientId) throw new Error("GITHUB_OAUTH_CLIENT_ID is not configured in Convex env.");

    const origin = args.origin.trim();
    if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
      throw new Error("Invalid origin");
    }
    if (origin.length > 200) throw new Error("Origin too long");

    const state = randomHex(16);
    const access = (args.access ?? "read") as GithubAccess;
    const scopes = getScopes(access);
    const redirectUri = `${convexSiteUrl.replace(/\/$/, "")}/connectors/github/callback`;
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await ctx.runMutation(internal.connectors.authSessions.createInternal, {
      userId,
      provider: "github",
      state,
      origin,
      scopes,
      expiresAt,
    });

    void captureEvent({
      distinctId: userId,
      event: "connector_oauth_started",
      properties: { provider: "github", scopes, access },
    });

    return {
      authUrl: buildGithubAuthUrl({ clientId, redirectUri, state, scopes }),
    };
  },
});

export const callback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const error = url.searchParams.get("error") || "";
  const errorDescription = url.searchParams.get("error_description") || "";

  if (!state) {
    return new Response(`<html><body><h3>Invalid callback</h3><p>Missing state.</p></body></html>`, {
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

  if (error) {
    await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });
    const msg = errorDescription ? `${error}: ${errorDescription}` : error;
    void captureEvent({
      distinctId: session.userId,
      event: "connector_oauth_failed",
      properties: { provider: "github", error: msg },
    });
    return new Response(buildPostMessageHtml({
      title: "GitHub connection failed",
      body: msg,
      origin: String(session.origin || ""),
      payload: { type: "mnotes:connector_error", provider: "github", error: msg },
    }), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!code) {
    await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });
    void captureEvent({
      distinctId: session.userId,
      event: "connector_oauth_failed",
      properties: { provider: "github", error: "missing_code" },
    });
    return new Response(buildPostMessageHtml({
      title: "GitHub connection failed",
      body: "Missing code in callback.",
      origin: String(session.origin || ""),
      payload: { type: "mnotes:connector_error", provider: "github", error: "missing_code" },
    }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });
    void captureEvent({
      distinctId: session.userId,
      event: "connector_oauth_failed",
      properties: { provider: "github", error: "server_not_configured" },
    });
    return new Response(buildPostMessageHtml({
      title: "Server not configured",
      body: "Missing GitHub OAuth env vars. Ask the app owner to configure GITHUB_OAUTH_CLIENT_ID/SECRET.",
      origin: String(session.origin || ""),
      payload: { type: "mnotes:connector_error", provider: "github", error: "server_not_configured" },
    }), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });
    void captureEvent({
      distinctId: session.userId,
      event: "connector_oauth_failed",
      properties: { provider: "github", error: "token_exchange_failed", status: tokenRes.status },
    });
    return new Response(buildPostMessageHtml({
      title: "Token exchange failed",
      body: text.slice(0, 900),
      origin: String(session.origin || ""),
      payload: { type: "mnotes:connector_error", provider: "github", error: "token_exchange_failed" },
    }), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const data = (await tokenRes.json()) as any;
  const accessToken = String(data?.access_token ?? "");
  const scopeStr = typeof data?.scope === "string" ? data.scope : "";
  const scopes = scopeStr ? scopeStr.split(",").map((s: string) => s.trim()).filter(Boolean) : session.scopes;

  if (!accessToken) {
    await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });
    void captureEvent({
      distinctId: session.userId,
      event: "connector_oauth_failed",
      properties: { provider: "github", error: "no_access_token" },
    });
    return new Response(buildPostMessageHtml({
      title: "Token exchange failed",
      body: "No access token returned.",
      origin: String(session.origin || ""),
      payload: { type: "mnotes:connector_error", provider: "github", error: "no_access_token" },
    }), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await ctx.runMutation(internal.connectors.tokens.setInternal, {
    userId: session.userId,
    provider: "github",
    accessToken,
    scopes,
  });
  await ctx.runMutation(internal.connectors.authSessions.deleteInternal, { id: session._id });

  void captureEvent({
    distinctId: session.userId,
    event: "connector_oauth_connected",
    properties: { provider: "github", scopes },
  });

  return new Response(buildPostMessageHtml({
    title: "Connected",
    body: "You can close this window.",
    origin: String(session.origin || ""),
    payload: { type: "mnotes:connector_connected", provider: "github" },
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

