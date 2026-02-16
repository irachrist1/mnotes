/**
 * Outlook MCP server — Microsoft Graph API.
 * Uses OAuth tokens stored in Convex (provider: "outlook").
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import { createInterface } from "readline";

const CONVEX_URL = process.env.CONVEX_URL ?? "";
const USER_ID = process.env.USER_ID ?? "";
const MS_TENANT_ID = process.env.MS_TENANT_ID ?? "";
const MS_CLIENT_ID = process.env.MS_CLIENT_ID ?? "";
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET ?? "";

const convex = new ConvexHttpClient(CONVEX_URL);

const TOOLS = [
  {
    name: "outlook_list_emails",
    description: "List recent Outlook/Office 365 emails from the inbox.",
    inputSchema: {
      type: "object",
      properties: {
        top: { type: "number", description: "Number of emails to fetch (default 10, max 50)" },
        filter: { type: "string", description: "OData filter e.g. 'isRead eq false'" },
      },
    },
  },
  {
    name: "outlook_search_emails",
    description: "Search Outlook emails using a keyword query.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search keyword or phrase" },
        top: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "outlook_get_email",
    description: "Get the full content of a specific Outlook email by ID.",
    inputSchema: {
      type: "object",
      properties: {
        messageId: { type: "string" },
      },
      required: ["messageId"],
    },
  },
  {
    name: "outlook_send_email",
    description: "Send an email via Outlook. Requires explicit user confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
        cc: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "outlook_list_calendar",
    description: "List upcoming Outlook calendar events.",
    inputSchema: {
      type: "object",
      properties: {
        top: { type: "number", description: "Number of events (default 10)" },
        startDateTime: { type: "string", description: "ISO 8601 start (default: now)" },
        endDateTime: { type: "string", description: "ISO 8601 end (default: 7 days from now)" },
      },
    },
  },
];

const rl = createInterface({ input: process.stdin });
function respond(id: unknown, result: unknown) { process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n"); }
function respondError(id: unknown, message: string) { process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32000, message } }) + "\n"); }

rl.on("line", async (line) => {
  let req: { id: unknown; method: string; params?: unknown };
  try { req = JSON.parse(line); } catch { return; }
  const { id, method, params } = req;
  if (method === "initialize") { respond(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "outlook", version: "1.0.0" } }); return; }
  if (method === "tools/list") { respond(id, { tools: TOOLS }); return; }
  if (method === "tools/call") {
    const p = params as { name: string; arguments: Record<string, unknown> };
    try {
      const result = await handleTool(p.name, p.arguments);
      respond(id, { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }] });
    } catch (err) { respondError(id, err instanceof Error ? err.message : "Outlook error"); }
    return;
  }
  respond(id, null);
});

async function getAccessToken(): Promise<string> {
  // First try stored OAuth token
  const tokens = await convex.query(api.connectors.tokens.getByProvider, {
    userId: USER_ID,
    provider: "outlook",
  });

  if (tokens?.accessToken) {
    // Check expiry and refresh if needed
    if (tokens.expiresAt && tokens.expiresAt < Date.now() + 60_000) {
      return await refreshToken(tokens.refreshToken ?? "");
    }
    return tokens.accessToken;
  }

  // Fallback: client credentials flow (service account)
  if (MS_TENANT_ID && MS_CLIENT_ID && MS_CLIENT_SECRET) {
    return await getClientCredentialsToken();
  }

  throw new Error("Outlook not connected. Please connect Outlook in Settings.");
}

async function refreshToken(refreshToken: string): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        refresh_token: refreshToken,
        scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Calendars.Read",
      }),
    }
  );
  const data = await res.json() as { access_token?: string; error_description?: string };
  if (!data.access_token) throw new Error(`Token refresh failed: ${data.error_description}`);
  return data.access_token;
}

async function getClientCredentialsToken(): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: MS_CLIENT_ID,
        client_secret: MS_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
      }),
    }
  );
  const data = await res.json() as { access_token?: string; error_description?: string };
  if (!data.access_token) throw new Error(`Client credentials failed: ${data.error_description}`);
  return data.access_token;
}

async function graphFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph API error: ${err}`);
  }
  return res.json();
}

async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "outlook_list_emails": {
      const top = Math.min(Number(args.top ?? 10), 50);
      const filter = args.filter ? `&$filter=${encodeURIComponent(String(args.filter))}` : "";
      const data = await graphFetch(
        `/me/mailFolders/inbox/messages?$top=${top}&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,isRead${filter}`
      ) as { value?: Array<{ id: string; subject?: string; from?: { emailAddress?: { address?: string } }; receivedDateTime?: string; bodyPreview?: string; isRead?: boolean }> };
      if (!data.value?.length) return "No emails found.";
      return data.value.map((m) =>
        `ID: ${m.id}\nFrom: ${m.from?.emailAddress?.address ?? "Unknown"}\nSubject: ${m.subject ?? "(no subject)"}\nDate: ${m.receivedDateTime ?? ""}\nRead: ${m.isRead}\nPreview: ${m.bodyPreview ?? ""}`
      ).join("\n\n---\n\n");
    }

    case "outlook_search_emails": {
      const top = Math.min(Number(args.top ?? 10), 50);
      const data = await graphFetch(
        `/me/messages?$search="${encodeURIComponent(String(args.query))}"&$top=${top}&$select=id,subject,from,receivedDateTime,bodyPreview`
      ) as { value?: Array<{ id: string; subject?: string; from?: { emailAddress?: { address?: string } }; receivedDateTime?: string; bodyPreview?: string }> };
      if (!data.value?.length) return "No matching emails found.";
      return data.value.map((m) =>
        `ID: ${m.id}\nFrom: ${m.from?.emailAddress?.address ?? "Unknown"}\nSubject: ${m.subject ?? "(no subject)"}\nDate: ${m.receivedDateTime ?? ""}\nPreview: ${m.bodyPreview ?? ""}`
      ).join("\n\n---\n\n");
    }

    case "outlook_get_email": {
      const msg = await graphFetch(
        `/me/messages/${args.messageId}?$select=subject,from,toRecipients,receivedDateTime,body`
      ) as { subject?: string; from?: { emailAddress?: { address?: string } }; toRecipients?: Array<{ emailAddress?: { address?: string } }>; receivedDateTime?: string; body?: { content?: string } };
      const to = msg.toRecipients?.map((r) => r.emailAddress?.address).join(", ") ?? "";
      return `From: ${msg.from?.emailAddress?.address ?? ""}\nTo: ${to}\nSubject: ${msg.subject ?? ""}\nDate: ${msg.receivedDateTime ?? ""}\n\n${msg.body?.content ?? "(no body)"}`;
    }

    case "outlook_send_email": {
      await graphFetch("/me/sendMail", {
        method: "POST",
        body: JSON.stringify({
          message: {
            subject: args.subject,
            body: { contentType: "Text", content: args.body },
            toRecipients: [{ emailAddress: { address: args.to } }],
            ...(args.cc ? { ccRecipients: [{ emailAddress: { address: args.cc } }] } : {}),
          },
        }),
      });
      return `Email sent to ${args.to} with subject "${args.subject}".`;
    }

    case "outlook_list_calendar": {
      const top = Math.min(Number(args.top ?? 10), 50);
      const now = new Date();
      const startDateTime = String(args.startDateTime ?? now.toISOString());
      const endDateTime = String(
        args.endDateTime ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      );
      const data = await graphFetch(
        `/me/calendarView?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&$top=${top}&$orderby=start/dateTime&$select=subject,start,end,location,attendees`
      ) as { value?: Array<{ subject?: string; start?: { dateTime?: string }; end?: { dateTime?: string }; location?: { displayName?: string }; attendees?: Array<{ emailAddress?: { address?: string } }> }> };
      if (!data.value?.length) return "No upcoming calendar events.";
      return data.value.map((e) => {
        const start = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleString() : "";
        const end = e.end?.dateTime ? new Date(e.end.dateTime).toLocaleString() : "";
        const attendees = e.attendees?.map((a) => a.emailAddress?.address).join(", ") ?? "";
        return `**${e.subject ?? "Untitled"}**\nTime: ${start} – ${end}\n${e.location?.displayName ? `Location: ${e.location.displayName}\n` : ""}${attendees ? `Attendees: ${attendees}` : ""}`;
      }).join("\n\n---\n\n");
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
