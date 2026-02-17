/**
 * Google Calendar MCP server — runs as a subprocess.
 */

import { ConvexHttpClient } from "convex/browser";
import { createInterface } from "readline";

const CONVEX_URL = process.env.CONVEX_URL ?? "";
const USER_ID = process.env.USER_ID ?? "";
const convex = new ConvexHttpClient(CONVEX_URL);

const TOOLS = [
  {
    name: "calendar_list_events",
    description: "List upcoming calendar events from Google Calendar.",
    inputSchema: {
      type: "object",
      properties: {
        maxResults: { type: "number", description: "Number of events (default 10)" },
        timeMin: { type: "string", description: "Start time in ISO 8601 format (default: now)" },
        timeMax: { type: "string", description: "End time in ISO 8601 format (default: 7 days from now)" },
      },
    },
  },
  {
    name: "calendar_get_agenda",
    description: "Get agenda for a specific day.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format (default: today)" },
      },
    },
  },
  {
    name: "calendar_find_free_slots",
    description: "Find free time slots in the user's calendar for scheduling.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        durationMinutes: { type: "number", description: "Duration of the meeting in minutes" },
      },
      required: ["date", "durationMinutes"],
    },
  },
  {
    name: "calendar_create_event",
    description: "Create a new calendar event. Requires user confirmation before creating.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        startDateTime: { type: "string", description: "ISO 8601 datetime" },
        endDateTime: { type: "string", description: "ISO 8601 datetime" },
        description: { type: "string" },
        attendees: { type: "array", items: { type: "string" }, description: "Email addresses of attendees" },
        location: { type: "string" },
      },
      required: ["title", "startDateTime", "endDateTime"],
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
    respond(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "calendar", version: "1.0.0" } });
    return;
  }
  if (method === "tools/list") { respond(id, { tools: TOOLS }); return; }
  if (method === "tools/call") {
    const p = params as { name: string; arguments: Record<string, unknown> };
    try {
      const result = await handleTool(p.name, p.arguments);
      respond(id, { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }] });
    } catch (err) {
      respondError(id, err instanceof Error ? err.message : "Calendar error");
    }
    return;
  }
  respond(id, null);
});

async function getAccessToken() {
  const tokens = await convex.query("connectors/tokens:getByProvider" as any, {
    userId: USER_ID,
    provider: "google-calendar",
  });
  if (!tokens?.accessToken) throw new Error("Google Calendar not connected. Please connect in Settings.");
  return tokens.accessToken;
}

async function calFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${err}`);
  }
  return res.json();
}

function formatEvent(event: {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  attendees?: Array<{ email?: string }>;
}) {
  const start = event.start?.dateTime ?? event.start?.date ?? "Unknown";
  const end = event.end?.dateTime ?? event.end?.date ?? "Unknown";
  const startDate = new Date(start);
  const endDate = new Date(end);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
  return [
    `**${event.summary ?? "Untitled"}**`,
    `Time: ${startDate.toLocaleString()} (${duration} min)`,
    ...(event.location ? [`Location: ${event.location}`] : []),
    ...(event.attendees?.length ? [`Attendees: ${event.attendees.map((a) => a.email).join(", ")}`] : []),
    ...(event.description ? [`Description: ${event.description}`] : []),
    `ID: ${event.id}`,
  ].join("\n");
}

async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "calendar_list_events": {
      const now = new Date();
      const timeMin = String(args.timeMin ?? now.toISOString());
      const timeMax = String(
        args.timeMax ??
          new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      );
      const maxResults = Math.min(Number(args.maxResults ?? 10), 50);
      const data = await calFetch(
        `/calendar/v3/calendars/primary/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
      ) as { items?: Array<{ id?: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string; description?: string; attendees?: Array<{ email?: string }> }> };
      if (!data.items?.length) return "No upcoming events found.";
      return data.items.map(formatEvent).join("\n\n---\n\n");
    }

    case "calendar_get_agenda": {
      const date = String(args.date ?? new Date().toISOString().slice(0, 10));
      const timeMin = new Date(`${date}T00:00:00`).toISOString();
      const timeMax = new Date(`${date}T23:59:59`).toISOString();
      const data = await calFetch(
        `/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`
      ) as { items?: Array<{ id?: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; location?: string; description?: string; attendees?: Array<{ email?: string }> }> };
      if (!data.items?.length) return `No events on ${date}.`;
      return `Agenda for ${date}:\n\n${data.items.map(formatEvent).join("\n\n---\n\n")}`;
    }

    case "calendar_find_free_slots": {
      const date = String(args.date);
      const duration = Number(args.durationMinutes);
      const timeMin = new Date(`${date}T08:00:00`).toISOString();
      const timeMax = new Date(`${date}T18:00:00`).toISOString();

      // Use freeBusy API
      const token = await getAccessToken();
      const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        }),
      });
      const data = await res.json() as {
        calendars?: { primary?: { busy?: Array<{ start: string; end: string }> } };
      };
      const busy = data.calendars?.primary?.busy ?? [];

      // Find free slots
      const slots: string[] = [];
      let cursor = new Date(`${date}T08:00:00`);
      const end = new Date(`${date}T18:00:00`);

      for (const b of busy) {
        const busyStart = new Date(b.start);
        if (cursor < busyStart) {
          const freeMinutes = (busyStart.getTime() - cursor.getTime()) / 60000;
          if (freeMinutes >= duration) {
            slots.push(`${cursor.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${busyStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
          }
        }
        cursor = new Date(Math.max(cursor.getTime(), new Date(b.end).getTime()));
      }
      if (cursor < end) {
        const freeMinutes = (end.getTime() - cursor.getTime()) / 60000;
        if (freeMinutes >= duration) {
          slots.push(`${cursor.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        }
      }

      return slots.length
        ? `Free slots on ${date} for ${duration}-minute meeting:\n${slots.map((s) => `• ${s}`).join("\n")}`
        : `No free slots on ${date} for a ${duration}-minute meeting.`;
    }

    case "calendar_create_event": {
      const event = {
        summary: args.title,
        description: args.description,
        location: args.location,
        start: { dateTime: args.startDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: args.endDateTime, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        attendees: Array.isArray(args.attendees)
          ? args.attendees.map((email) => ({ email }))
          : [],
      };
      const created = await calFetch("/calendar/v3/calendars/primary/events", {
        method: "POST",
        body: JSON.stringify(event),
      }) as { id?: string; htmlLink?: string };
      return `Event created: "${args.title}"\nLink: ${created.htmlLink ?? ""}`;
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
