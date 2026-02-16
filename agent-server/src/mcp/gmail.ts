/**
 * Gmail MCP server — runs as a subprocess.
 * Uses OAuth tokens stored in Convex to access Gmail via Google APIs.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api.js";
import { createInterface } from "readline";

const CONVEX_URL = process.env.CONVEX_URL ?? "";
const USER_ID = process.env.USER_ID ?? "";

const convex = new ConvexHttpClient(CONVEX_URL);

const TOOLS = [
  {
    name: "gmail_list_recent",
    description: "List recent emails from Gmail inbox. Use to check for new messages.",
    inputSchema: {
      type: "object",
      properties: {
        maxResults: { type: "number", description: "Number of emails to fetch (default 10, max 50)" },
        labelIds: { type: "array", items: { type: "string" }, description: "Filter by labels e.g. ['INBOX', 'UNREAD']" },
      },
    },
  },
  {
    name: "gmail_search",
    description: "Search Gmail messages using Gmail query syntax (e.g. 'from:boss@company.com is:unread').",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Gmail search query" },
        maxResults: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "gmail_get_message",
    description: "Get the full content of a specific email by ID.",
    inputSchema: {
      type: "object",
      properties: {
        messageId: { type: "string", description: "Gmail message ID" },
      },
      required: ["messageId"],
    },
  },
  {
    name: "gmail_send",
    description: "Send an email via Gmail. Requires explicit user approval before sending.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject" },
        body: { type: "string", description: "Email body (plain text or HTML)" },
        cc: { type: "string", description: "CC recipient(s) optional" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "gmail_create_draft",
    description: "Create a Gmail draft without sending it.",
    inputSchema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
  },
];

const rl = createInterface({ input: process.stdin });

function respond(id: unknown, result: unknown) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}
function respondError(id: unknown, message: string) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32000, message } }) + "\n");
}

rl.on("line", async (line) => {
  let req: { id: unknown; method: string; params?: unknown };
  try { req = JSON.parse(line); } catch { return; }
  const { id, method, params } = req;

  if (method === "initialize") {
    respond(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "gmail", version: "1.0.0" } });
    return;
  }
  if (method === "tools/list") { respond(id, { tools: TOOLS }); return; }
  if (method === "tools/call") {
    const p = params as { name: string; arguments: Record<string, unknown> };
    try {
      const result = await handleTool(p.name, p.arguments);
      respond(id, { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }] });
    } catch (err) {
      respondError(id, err instanceof Error ? err.message : "Gmail error");
    }
    return;
  }
  respond(id, null);
});

async function getAccessToken(): Promise<string> {
  const tokens = await convex.query(api.connectors.tokens.getByProvider, {
    userId: USER_ID,
    provider: "gmail",
  });
  if (!tokens?.accessToken) throw new Error("Gmail not connected. Please connect Gmail in Settings.");
  // TODO: refresh if expired
  return tokens.accessToken;
}

async function gmailFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`https://gmail.googleapis.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail API error: ${err}`);
  }
  return res.json();
}

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function extractBody(payload: { mimeType?: string; body?: { data?: string }; parts?: unknown[] }): string {
  if (payload.body?.data) return decodeBase64(payload.body.data);
  if (payload.parts) {
    for (const part of payload.parts as Array<{ mimeType?: string; body?: { data?: string }; parts?: unknown[] }>) {
      if (part.mimeType === "text/plain" && part.body?.data) return decodeBase64(part.body.data);
    }
  }
  return "(no readable body)";
}

async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "gmail_list_recent": {
      const maxResults = Math.min(Number(args.maxResults ?? 10), 50);
      const labels = Array.isArray(args.labelIds) ? args.labelIds.join(",") : "INBOX";
      const list = await gmailFetch(
        `/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=${labels}`
      ) as { messages?: Array<{ id: string }> };
      if (!list.messages?.length) return "No messages found.";

      const summaries = await Promise.all(
        list.messages.slice(0, maxResults).map(async ({ id }) => {
          const msg = await gmailFetch(
            `/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From,Subject,Date`
          ) as { id: string; payload?: { headers?: Array<{ name: string; value: string }> }; snippet?: string };
          const headers = msg.payload?.headers ?? [];
          const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
          return `ID: ${id}\nFrom: ${get("From")}\nSubject: ${get("Subject")}\nDate: ${get("Date")}\nPreview: ${msg.snippet}`;
        })
      );
      return summaries.join("\n\n---\n\n");
    }

    case "gmail_search": {
      const maxResults = Math.min(Number(args.maxResults ?? 10), 50);
      const list = await gmailFetch(
        `/gmail/v1/users/me/messages?q=${encodeURIComponent(String(args.query))}&maxResults=${maxResults}`
      ) as { messages?: Array<{ id: string }> };
      if (!list.messages?.length) return "No messages matching that search.";

      const summaries = await Promise.all(
        list.messages.map(async ({ id }) => {
          const msg = await gmailFetch(
            `/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From,Subject,Date`
          ) as { id: string; payload?: { headers?: Array<{ name: string; value: string }> }; snippet?: string };
          const headers = msg.payload?.headers ?? [];
          const get = (n: string) => headers.find((h) => h.name === n)?.value ?? "";
          return `ID: ${id}\nFrom: ${get("From")}\nSubject: ${get("Subject")}\nDate: ${get("Date")}\nPreview: ${msg.snippet}`;
        })
      );
      return summaries.join("\n\n---\n\n");
    }

    case "gmail_get_message": {
      const msg = await gmailFetch(
        `/gmail/v1/users/me/messages/${args.messageId}?format=full`
      ) as { id: string; payload?: { headers?: Array<{ name: string; value: string }>; mimeType?: string; body?: { data?: string }; parts?: unknown[] } };
      const headers = msg.payload?.headers ?? [];
      const get = (n: string) => headers.find((h) => h.name === n)?.value ?? "";
      const body = msg.payload ? extractBody(msg.payload) : "(no body)";
      return `From: ${get("From")}\nTo: ${get("To")}\nSubject: ${get("Subject")}\nDate: ${get("Date")}\n\n${body}`;
    }

    case "gmail_send": {
      const email = [
        `To: ${args.to}`,
        ...(args.cc ? [`Cc: ${args.cc}`] : []),
        `Subject: ${args.subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        String(args.body),
      ].join("\r\n");
      const raw = Buffer.from(email).toString("base64url");
      await gmailFetch("/gmail/v1/users/me/messages/send", {
        method: "POST",
        body: JSON.stringify({ raw }),
      });
      return `Email sent to ${args.to} with subject "${args.subject}".`;
    }

    case "gmail_create_draft": {
      const email = [
        `To: ${args.to}`,
        `Subject: ${args.subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        String(args.body),
      ].join("\r\n");
      const raw = Buffer.from(email).toString("base64url");
      await gmailFetch("/gmail/v1/users/me/drafts", {
        method: "POST",
        body: JSON.stringify({ message: { raw } }),
      });
      return `Draft created to ${args.to} with subject "${args.subject}".`;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
