"use node";

import { internal } from "../_generated/api";
import { captureEvent } from "../lib/posthog";
import { parseAgentState } from "./taskAgentParsing";
import { hasAnyScope, requiredScopesForTool } from "../connectors/googleScopes";

type ToolSchema = Record<string, unknown>;

export type AgentToolDef = {
  name: string;
  description: string;
  input_schema: ToolSchema;
};

export type ToolExecResult =
  | { ok: true; result: unknown; summary?: string; pause?: false }
  | { ok: true; result: unknown; summary?: string; pause: true; pauseReason: "ask_user" | "approval"; eventId: string }
  | { ok: false; error: string };

export function getBuiltInToolDefs(): AgentToolDef[] {
  return [
    {
      name: "read_soul_file",
      description: "Read the user's soul file (long-term memory/profile).",
      input_schema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "list_tasks",
      description: "List the user's tasks (most recent first).",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max tasks to return (default 20)." },
          includeDone: { type: "boolean", description: "Include completed tasks (default true)." },
        },
        additionalProperties: false,
      },
    },
    {
      name: "list_income_streams",
      description: "List the user's income streams.",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max streams to return (default 50)." },
        },
        additionalProperties: false,
      },
    },
    {
      name: "list_ideas",
      description: "List the user's idea bank.",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max ideas to return (default 50)." },
        },
        additionalProperties: false,
      },
    },
    {
      name: "list_mentorship_sessions",
      description: "List the user's mentorship sessions (most recent first).",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max sessions to return (default 20)." },
        },
        additionalProperties: false,
      },
    },
    {
      name: "search_insights",
      description: "Search through the user's saved insights and return the most relevant matches.",
      input_schema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query." },
          limit: { type: "number", description: "Max matches (default 6)." },
        },
        required: ["q"],
        additionalProperties: false,
      },
    },
    {
      name: "get_task_result",
      description: "Read the output/result of a previous agent task by taskId.",
      input_schema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "The task id string." },
        },
        required: ["taskId"],
        additionalProperties: false,
      },
    },
    {
      name: "ask_user",
      description:
        "Ask the user a clarifying question and pause execution until they answer.",
      input_schema: {
        type: "object",
        properties: {
          question: { type: "string", description: "The question to ask." },
          options: {
            type: "array",
            items: { type: "string" },
            description: "2-6 short mutually exclusive answer options (recommended).",
          },
        },
        required: ["question"],
        additionalProperties: false,
      },
    },
    {
      name: "create_file",
      description:
        "Create a draft document (markdown) and save it as an agent file linked to this task.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short file title." },
          content: { type: "string", description: "Markdown content." },
          fileType: { type: "string", description: "Type label (e.g. document, checklist, table, plan)." },
        },
        required: ["title", "content"],
        additionalProperties: false,
      },
    },
    {
      name: "list_agent_files",
      description:
        "List agent-created draft files (optionally filtered to this task).",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max files (default 20)." },
          taskOnly: { type: "boolean", description: "If true, only return files created for this task." },
        },
        additionalProperties: false,
      },
    },
    {
      name: "read_agent_file",
      description:
        "Read an agent-created draft file by fileId.",
      input_schema: {
        type: "object",
        properties: {
          fileId: { type: "string", description: "Agent file id string." },
          maxChars: { type: "number", description: "Max chars to return (default 20000)." },
        },
        required: ["fileId"],
        additionalProperties: false,
      },
    },
    {
      name: "update_agent_file",
      description:
        "Update an agent-created draft file (title/content/fileType).",
      input_schema: {
        type: "object",
        properties: {
          fileId: { type: "string", description: "Agent file id string." },
          title: { type: "string", description: "Optional new title." },
          content: { type: "string", description: "Optional new content (markdown)." },
          fileType: { type: "string", description: "Optional new fileType label." },
        },
        required: ["fileId"],
        additionalProperties: false,
      },
    },
    {
      name: "create_task",
      description:
        "Create a new task in MNotes. By default it is created as an idle draft (no agent run) unless startAgent=true.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title." },
          note: { type: "string", description: "Optional task context/notes (markdown or text)." },
          dueDate: { type: "string", description: "Optional due date (YYYY-MM-DD)." },
          priority: { type: "string", description: "low | medium | high (default medium)." },
          startAgent: { type: "boolean", description: "If true, queue the agent to run on this task (default false)." },
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
    {
      name: "update_task",
      description:
        "Update an existing task (mark done, change title, update notes).",
      input_schema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task id string." },
          title: { type: "string", description: "New title (optional)." },
          note: { type: "string", description: "New full note content (optional)." },
          appendNote: { type: "string", description: "Append this text to the existing note (optional)." },
          dueDate: { type: "string", description: "Due date (YYYY-MM-DD) or empty to clear (optional)." },
          priority: { type: "string", description: "low | medium | high (optional)." },
          done: { type: "boolean", description: "Mark done/undone (optional)." },
        },
        required: ["taskId"],
        additionalProperties: false,
      },
    },
    {
      name: "send_notification",
      description:
        "Send an in-app notification to the user (for important updates or next steps).",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short notification title." },
          body: { type: "string", description: "Notification body." },
          actionUrl: { type: "string", description: "Optional link the user can click (dashboard route)." },
          type: { type: "string", description: "Notification type (default agent-task)." },
        },
        required: ["title", "body"],
        additionalProperties: false,
      },
    },
    {
      name: "request_approval",
      description:
        "Request user approval before performing an irreversible or external side-effect. Pauses execution until approved/denied.",
      input_schema: {
        type: "object",
        properties: {
          action: { type: "string", description: "Short action name (e.g. send_email, create_calendar_event)." },
          reason: { type: "string", description: "Why this action is needed." },
          params: { type: "object", description: "Parameters for the action (for user review)." },
        },
        required: ["action", "reason"],
        additionalProperties: false,
      },
    },
    {
      name: "web_search",
      description:
        "Search the web. Returns results or a readable search digest. Requires user approval the first time per task.",
      input_schema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query." },
          maxResults: { type: "number", description: "Max results (default 5)." },
        },
        required: ["q"],
        additionalProperties: false,
      },
    },
    {
      name: "read_url",
      description:
        "Fetch and extract the content of a URL as text/markdown. Requires user approval the first time per task.",
      input_schema: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL starting with http:// or https://." },
          maxChars: { type: "number", description: "Max characters to return (default 20000)." },
        },
        required: ["url"],
        additionalProperties: false,
      },
    },
    {
      name: "github_list_my_pull_requests",
      description:
        "List my open GitHub pull requests (requires GitHub connection).",
      input_schema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Optional extra GitHub search query terms (e.g. repo:owner/name)." },
          limit: { type: "number", description: "Max results (default 10)." },
        },
        additionalProperties: false,
      },
    },
    {
      name: "github_create_issue",
      description:
        "Create a GitHub issue in a repo (external side-effect; requires approval). Requires GitHub connection.",
      input_schema: {
        type: "object",
        properties: {
          repo: { type: "string", description: "Repo in owner/name format." },
          title: { type: "string", description: "Issue title." },
          body: { type: "string", description: "Issue body/description (optional)." },
          labels: { type: "array", items: { type: "string" }, description: "Optional labels." },
        },
        required: ["repo", "title"],
        additionalProperties: false,
      },
    },
    {
      name: "gmail_list_recent",
      description: "List recent Gmail messages (headers/snippet). Requires Gmail connection.",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max messages (default 10)." },
          q: { type: "string", description: "Optional Gmail search query (e.g. from:alice subject:\"invoice\")." },
        },
        additionalProperties: false,
      },
    },
    {
      name: "gmail_create_draft",
      description: "Create a Gmail draft (no send). Requires Gmail connection with write scope.",
      input_schema: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email(s), comma-separated." },
          subject: { type: "string", description: "Email subject." },
          bodyText: { type: "string", description: "Plain text body." },
          bodyHtml: { type: "string", description: "Optional HTML body (if provided, sent as text/html)." },
        },
        required: ["to", "subject", "bodyText"],
        additionalProperties: false,
      },
    },
    {
      name: "gmail_send_email",
      description: "Send an email via Gmail (external side-effect; requires approval). Requires Gmail connection with send scope.",
      input_schema: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email(s), comma-separated." },
          subject: { type: "string", description: "Email subject." },
          bodyText: { type: "string", description: "Plain text body." },
          bodyHtml: { type: "string", description: "Optional HTML body (if provided, sent as text/html)." },
        },
        required: ["to", "subject", "bodyText"],
        additionalProperties: false,
      },
    },
    {
      name: "calendar_list_upcoming",
      description: "List upcoming Google Calendar events. Requires Google Calendar connection.",
      input_schema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max events (default 10)." },
          daysAhead: { type: "number", description: "How many days ahead to look (default 7)." },
        },
        additionalProperties: false,
      },
    },
    {
      name: "calendar_create_event",
      description: "Create a Google Calendar event (external side-effect; requires approval). Requires Calendar connection with write scope.",
      input_schema: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Event title." },
          description: { type: "string", description: "Optional description/body." },
          start: { type: "string", description: "Start datetime ISO (or YYYY-MM-DD for all-day)." },
          end: { type: "string", description: "End datetime ISO (or YYYY-MM-DD for all-day)." },
          timeZone: { type: "string", description: "Optional IANA timezone (e.g. America/New_York)." },
          location: { type: "string", description: "Optional location." },
          attendees: { type: "array", items: { type: "string" }, description: "Optional attendee emails." },
          sendUpdates: { type: "boolean", description: "If true, notify attendees (default false)." },
        },
        required: ["summary", "start", "end"],
        additionalProperties: false,
      },
    },
  ];
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
  return Math.max(min, Math.min(max, n));
}

function truncate(value: string, max = 4000): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function truncateSoft(value: string, max = 60000): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

async function getConnectorToken(ctx: any, userId: string, provider: string): Promise<string | null> {
  const tok = await ctx.runQuery(internal.connectors.tokens.getInternal, { userId, provider });
  const accessToken = typeof tok?.accessToken === "string" ? tok.accessToken : "";
  return accessToken ? accessToken : null;
}

async function getConnectorTokenDoc(ctx: any, userId: string, provider: "gmail" | "google-calendar") {
  return await ctx.runQuery(internal.connectors.tokens.getInternal, { userId, provider });
}

async function getGoogleAccessToken(args: {
  ctx: any;
  userId: string;
  provider: "gmail" | "google-calendar";
  toolNameForScopes?: string;
}): Promise<{ accessToken: string; refreshed: boolean }> {
  const tok = await getConnectorTokenDoc(args.ctx, args.userId, args.provider);
  if (!tok?.accessToken) {
    throw new Error(`${args.provider === "gmail" ? "Gmail" : "Google Calendar"} is not connected. Go to Settings > Connections.`);
  }

  if (args.toolNameForScopes) {
    const acceptable = requiredScopesForTool(args.toolNameForScopes);
    if (acceptable.length > 0 && !hasAnyScope(tok.scopes, acceptable)) {
      const what = args.provider === "gmail" ? "Gmail" : "Google Calendar";
      throw new Error(`${what} is connected without required permissions for ${args.toolNameForScopes}. Reconnect in Settings > Connections with write access.`);
    }
  }

  const expiresAt = typeof tok.expiresAt === "number" ? tok.expiresAt : undefined;
  if (expiresAt && Date.now() < expiresAt - 60_000) {
    return { accessToken: tok.accessToken, refreshed: false };
  }

  const refreshToken = typeof tok.refreshToken === "string" ? tok.refreshToken : "";
  if (!refreshToken) {
    throw new Error("Google refresh token missing. Disconnect and reconnect to enable offline access.");
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Server missing GOOGLE_OAUTH_CLIENT_ID/GOOGLE_OAUTH_CLIENT_SECRET.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed (${res.status}): ${truncate(text, 240)}`);
  }

  const data = (await res.json()) as any;
  const nextAccess = String(data?.access_token ?? "");
  const expiresIn = typeof data?.expires_in === "number" ? data.expires_in : 3600;
  if (!nextAccess) throw new Error("Google token refresh returned no access_token.");

  await args.ctx.runMutation(internal.connectors.tokens.setInternal, {
    userId: args.userId,
    provider: args.provider,
    accessToken: nextAccess,
    refreshToken, // preserve
    expiresAt: Date.now() + expiresIn * 1000,
  });

  void captureEvent({
    distinctId: args.userId,
    event: "agent_google_token_refreshed",
    properties: { provider: args.provider },
  });

  return { accessToken: nextAccess, refreshed: true };
}

async function getApprovalMaps(ctx: any, userId: string, taskId: any): Promise<{
  approvedTools: Record<string, true>;
  deniedTools: Record<string, true>;
}> {
  const task = await ctx.runQuery(internal.tasks.getInternal, { id: taskId, userId });
  const state = task?.agentState ? parseAgentState(task.agentState) : null;
  return {
    approvedTools: state?.approvedTools ?? {},
    deniedTools: state?.deniedTools ?? {},
  };
}

async function ensureApprovedOrPause(args: {
  ctx: any;
  userId: string;
  taskId: any;
  toolName: string;
  detail: string;
  params: unknown;
}): Promise<null | ToolExecResult> {
  const { approvedTools, deniedTools } = await getApprovalMaps(args.ctx, args.userId, args.taskId);
  if (deniedTools[args.toolName]) {
    return { ok: false, error: `User denied approval for: ${args.toolName}` };
  }
  if (approvedTools[args.toolName]) return null;

  const eventId = await args.ctx.runMutation(internal.taskEvents.addInternal, {
    userId: args.userId,
    taskId: args.taskId,
    kind: "approval-request",
    title: `Approval requested: ${args.toolName}`,
    detail: args.detail,
    approvalAction: args.toolName,
    approvalParams: JSON.stringify(args.params ?? {}).slice(0, 8000),
  });

  void captureEvent({
    distinctId: args.userId,
    event: "agent_approval_requested",
    properties: {
      taskId: String(args.taskId),
      approvalEventId: String(eventId),
      action: args.toolName,
    },
  });

  return {
    ok: true,
    pause: true,
    pauseReason: "approval",
    eventId: String(eventId),
    result: { eventId: String(eventId), action: args.toolName, params: args.params ?? null },
    summary: "Requested approval from user.",
  };
}

export async function executeTool(args: {
  ctx: any;
  userId: string;
  taskId: any;
  name: string;
  input: any;
}): Promise<ToolExecResult> {
  const { ctx, userId, taskId, name, input } = args;

  try {
    if (name === "read_soul_file") {
      const soul = await ctx.runQuery(internal.soulFile.getByUserId, { userId });
      return {
        ok: true,
        result: soul
          ? {
            version: soul.version,
            updatedAt: soul.updatedAt,
            content: truncate(soul.content, 12000),
          }
          : null,
        summary: soul ? `Loaded soul file v${soul.version}.` : "No soul file found.",
      };
    }

    if (name === "list_tasks") {
      const limit = clampInt(input?.limit, 20, 1, 100);
      const includeDone = input?.includeDone === undefined ? true : Boolean(input.includeDone);
      const tasks = await ctx.runQuery(internal.tasks.listForUserInternal, {
        userId,
        limit,
        includeDone,
      });
      const simplified = (tasks as any[]).map((t) => ({
        id: String(t._id),
        title: t.title,
        dueDate: t.dueDate ?? null,
        priority: t.priority ?? null,
        done: Boolean(t.done),
        agentStatus: t.agentStatus ?? "idle",
      }));
      return { ok: true, result: simplified, summary: `Returned ${simplified.length} tasks.` };
    }

    if (name === "list_income_streams") {
      const limit = clampInt(input?.limit, 50, 1, 200);
      const streams = await ctx.runQuery(internal.incomeStreams.listForUserInternal, {
        userId,
        limit,
      });
      const simplified = (streams as any[]).map((s) => ({
        id: String(s._id),
        name: s.name,
        category: s.category,
        status: s.status,
        monthlyRevenue: s.monthlyRevenue,
        timeInvestment: s.timeInvestment,
        growthRate: s.growthRate,
        notes: s.notes ?? null,
      }));
      return {
        ok: true,
        result: simplified,
        summary: `Returned ${simplified.length} income streams.`,
      };
    }

    if (name === "list_ideas") {
      const limit = clampInt(input?.limit, 50, 1, 200);
      const ideas = await ctx.runQuery(internal.ideas.listForUserInternal, { userId, limit });
      const simplified = (ideas as any[]).map((i) => ({
        id: String(i._id),
        title: i.title,
        stage: i.stage,
        category: i.category,
        potentialRevenue: i.potentialRevenue,
        nextSteps: Array.isArray(i.nextSteps) ? i.nextSteps.slice(0, 5) : [],
        tags: Array.isArray(i.tags) ? i.tags.slice(0, 8) : [],
      }));
      return { ok: true, result: simplified, summary: `Returned ${simplified.length} ideas.` };
    }

    if (name === "list_mentorship_sessions") {
      const limit = clampInt(input?.limit, 20, 1, 200);
      const sessions = await ctx.runQuery(internal.mentorshipSessions.listForUserInternal, {
        userId,
        limit,
      });
      const simplified = (sessions as any[]).map((s) => ({
        id: String(s._id),
        mentorName: s.mentorName,
        date: s.date,
        rating: s.rating,
        topics: Array.isArray(s.topics) ? s.topics.slice(0, 8) : [],
        keyInsights: Array.isArray(s.keyInsights) ? s.keyInsights.slice(0, 6) : [],
        actionItems: Array.isArray(s.actionItems) ? s.actionItems.slice(0, 6) : [],
      }));
      return {
        ok: true,
        result: simplified,
        summary: `Returned ${simplified.length} mentorship sessions.`,
      };
    }

    if (name === "search_insights") {
      const q = typeof input?.q === "string" ? input.q.trim() : "";
      if (!q) return { ok: false, error: "q is required" };
      const limit = clampInt(input?.limit, 6, 1, 12);
      const matches = await ctx.runQuery(internal.savedInsights.searchCandidatesInternal, {
        userId,
        q,
        limit,
      });

      const simplified = (matches as any[]).map((m) => ({
        id: String(m.doc._id),
        title: m.doc.title,
        type: m.doc.type,
        priority: m.doc.priority,
        bodySummary: m.doc.bodySummary ?? "",
        bodyExcerpt: truncate(m.doc.body ?? "", 800),
        actionItems: Array.isArray(m.doc.actionItems) ? m.doc.actionItems.slice(0, 5) : [],
        score: m.textScore ?? 0,
      }));

      return { ok: true, result: simplified, summary: `Found ${simplified.length} insights.` };
    }

    if (name === "get_task_result") {
      const rawId = typeof input?.taskId === "string" ? input.taskId.trim() : "";
      if (!rawId) return { ok: false, error: "taskId is required" };
      const task = await ctx.runQuery(internal.tasks.getInternal, { id: rawId as any, userId });
      if (!task) return { ok: true, result: null, summary: "Task not found." };
      return {
        ok: true,
        result: {
          id: String(task._id),
          title: task.title,
          done: Boolean(task.done),
          agentStatus: task.agentStatus ?? "idle",
          agentSummary: task.agentSummary ?? null,
          agentResult: truncate(task.agentResult ?? "", 12000),
        },
        summary: `Loaded result for: ${task.title}`,
      };
    }

    if (name === "ask_user") {
      const question = typeof input?.question === "string" ? input.question.trim() : "";
      if (!question) return { ok: false, error: "question is required" };
      const options = Array.isArray(input?.options)
        ? input.options.map(String).map((s: string) => s.trim()).filter(Boolean).slice(0, 6)
        : undefined;

      const eventId = await ctx.runMutation(internal.taskEvents.addInternal, {
        userId,
        taskId,
        kind: "question",
        title: question,
        detail: "Jarvis needs your input to continue.",
        options: options && options.length >= 2 ? options : undefined,
        answered: false,
      });

      return {
        ok: true,
        pause: true,
        pauseReason: "ask_user",
        eventId: String(eventId),
        result: { eventId: String(eventId), question, options: options ?? null },
        summary: "Asked user a clarifying question.",
      };
    }

    if (name === "create_file") {
      const title = typeof input?.title === "string" ? input.title.trim() : "";
      const content = typeof input?.content === "string" ? input.content : "";
      const fileType = typeof input?.fileType === "string" ? input.fileType.trim() : "document";
      if (!title) return { ok: false, error: "title is required" };
      if (!content || content.trim().length < 10) return { ok: false, error: "content is required" };

      const id = await ctx.runMutation(internal.agentFiles.createInternal, {
        userId,
        taskId,
        title,
        content: truncateSoft(content, 80000),
        fileType: fileType || "document",
      });

      void captureEvent({
        distinctId: userId,
        event: "agent_file_created",
        properties: {
          taskId: String(taskId),
          fileId: String(id),
          title,
          fileType: fileType || "document",
        },
      });

      return {
        ok: true,
        result: { id: String(id), title, fileType: fileType || "document" },
        summary: `Created file: ${title}`,
      };
    }

    if (name === "list_agent_files") {
      const limit = clampInt(input?.limit, 20, 1, 100);
      const taskOnly = Boolean(input?.taskOnly);
      const files = taskOnly
        ? await ctx.runQuery(internal.agentFiles.listByTaskInternal, { userId, taskId, limit })
        : await ctx.runQuery(internal.agentFiles.listInternal, { userId, limit });

      const simplified = (files as any[]).map((f) => ({
        id: String(f._id),
        title: f.title,
        fileType: f.fileType,
        taskId: f.taskId ? String(f.taskId) : null,
        updatedAt: f.updatedAt,
      }));
      return { ok: true, result: simplified, summary: `Returned ${simplified.length} files.` };
    }

    if (name === "read_agent_file") {
      const rawId = typeof input?.fileId === "string" ? input.fileId.trim() : "";
      if (!rawId) return { ok: false, error: "fileId is required" };
      const maxChars = clampInt(input?.maxChars, 20000, 1000, 80000);
      const file = await ctx.runQuery(internal.agentFiles.getInternal, { userId, id: rawId as any });
      if (!file) return { ok: false, error: "File not found" };
      return {
        ok: true,
        result: {
          id: String(file._id),
          title: file.title,
          fileType: file.fileType,
          content: truncateSoft(String(file.content ?? ""), maxChars),
          updatedAt: file.updatedAt,
        },
        summary: `Read file: ${file.title}`,
      };
    }

    if (name === "update_agent_file") {
      const rawId = typeof input?.fileId === "string" ? input.fileId.trim() : "";
      if (!rawId) return { ok: false, error: "fileId is required" };
      const title = typeof input?.title === "string" ? input.title.trim() : undefined;
      const content = typeof input?.content === "string" ? truncateSoft(input.content, 80000) : undefined;
      const fileType = typeof input?.fileType === "string" ? input.fileType.trim() : undefined;

      await ctx.runMutation(internal.agentFiles.updateInternal, {
        userId,
        id: rawId as any,
        title: title || undefined,
        content,
        fileType: fileType || undefined,
      });

      void captureEvent({
        distinctId: userId,
        event: "agent_file_updated",
        properties: { taskId: String(taskId), fileId: rawId },
      });

      return { ok: true, result: { id: rawId }, summary: "Updated file." };
    }

    if (name === "request_approval") {
      const action = typeof input?.action === "string" ? input.action.trim() : "";
      const reason = typeof input?.reason === "string" ? input.reason.trim() : "";
      const params = typeof input?.params === "object" && input.params ? input.params : undefined;
      if (!action) return { ok: false, error: "action is required" };
      if (!reason) return { ok: false, error: "reason is required" };

      const eventId = await ctx.runMutation(internal.taskEvents.addInternal, {
        userId,
        taskId,
        kind: "approval-request",
        title: `Approval requested: ${action}`,
        detail: reason,
        approvalAction: action,
        approvalParams: params ? JSON.stringify(params).slice(0, 8000) : undefined,
      });

      void captureEvent({
        distinctId: userId,
        event: "agent_approval_requested",
        properties: {
          taskId: String(taskId),
          approvalEventId: String(eventId),
          action,
        },
      });

      return {
        ok: true,
        pause: true,
        pauseReason: "approval",
        eventId: String(eventId),
        result: { eventId: String(eventId), action, reason, params: params ?? null },
        summary: "Requested approval from user.",
      };
    }

    if (name === "create_task") {
      const title = typeof input?.title === "string" ? input.title.trim() : "";
      const note = typeof input?.note === "string" ? input.note : undefined;
      const dueDate = typeof input?.dueDate === "string" ? input.dueDate.trim() : undefined;
      const priorityRaw = typeof input?.priority === "string" ? input.priority.trim().toLowerCase() : "";
      const startAgent = Boolean(input?.startAgent);
      if (!title) return { ok: false, error: "title is required" };

      const priority = priorityRaw === "low" || priorityRaw === "high" || priorityRaw === "medium"
        ? (priorityRaw as "low" | "medium" | "high")
        : undefined;

      const id = await ctx.runMutation(internal.tasks.createInternal, {
        userId,
        title,
        note,
        dueDate: dueDate || undefined,
        priority,
        sourceType: "manual",
        startAgent,
      });

      void captureEvent({
        distinctId: userId,
        event: "agent_task_created",
        properties: {
          parentTaskId: String(taskId),
          createdTaskId: String(id),
          startAgent,
        },
      });

      return {
        ok: true,
        result: { id: String(id), title, startAgent: Boolean(startAgent) },
        summary: startAgent ? `Created and queued task: ${title}` : `Created task: ${title}`,
      };
    }

    if (name === "update_task") {
      const rawId = typeof input?.taskId === "string" ? input.taskId.trim() : "";
      if (!rawId) return { ok: false, error: "taskId is required" };

      const existing = await ctx.runQuery(internal.tasks.getInternal, { id: rawId as any, userId });
      if (!existing) return { ok: false, error: "Task not found" };

      const title = typeof input?.title === "string" ? input.title.trim() : undefined;
      const note = typeof input?.note === "string" ? input.note : undefined;
      const appendNote = typeof input?.appendNote === "string" ? input.appendNote : undefined;
      const dueDateRaw = typeof input?.dueDate === "string" ? input.dueDate.trim() : undefined;
      const done = typeof input?.done === "boolean" ? input.done : undefined;
      const priorityRaw = typeof input?.priority === "string" ? input.priority.trim().toLowerCase() : undefined;
      const priority = priorityRaw === "low" || priorityRaw === "high" || priorityRaw === "medium"
        ? (priorityRaw as "low" | "medium" | "high")
        : undefined;

      const nextNote = note !== undefined
        ? note
        : appendNote
          ? [existing.note?.trim() ? existing.note.trim() : null, appendNote.trim()].filter(Boolean).join("\n\n")
          : undefined;

      await ctx.runMutation(internal.tasks.patchTaskInternal, {
        userId,
        id: existing._id,
        title: title || undefined,
        note: nextNote,
        dueDate: dueDateRaw === "" ? undefined : dueDateRaw,
        priority,
        done,
      });

      void captureEvent({
        distinctId: userId,
        event: "agent_task_updated",
        properties: {
          parentTaskId: String(taskId),
          updatedTaskId: String(existing._id),
          fields: {
            title: title !== undefined,
            note: note !== undefined,
            appendNote: appendNote !== undefined,
            dueDate: dueDateRaw !== undefined,
            priority: priority !== undefined,
            done: done !== undefined,
          },
        },
      });

      return {
        ok: true,
        result: { id: String(existing._id) },
        summary: `Updated task: ${existing.title}`,
      };
    }

    if (name === "send_notification") {
      const title = typeof input?.title === "string" ? input.title.trim() : "";
      const body = typeof input?.body === "string" ? input.body.trim() : "";
      const actionUrl = typeof input?.actionUrl === "string" ? input.actionUrl.trim() : undefined;
      const typeRaw = typeof input?.type === "string" ? input.type.trim() : "agent-task";
      const type = (
        typeRaw === "goal-check-in"
        || typeRaw === "stale-idea"
        || typeRaw === "overdue-action"
        || typeRaw === "pattern-detected"
        || typeRaw === "milestone"
        || typeRaw === "agent-task"
      ) ? typeRaw : "agent-task";

      if (!title) return { ok: false, error: "title is required" };
      if (!body) return { ok: false, error: "body is required" };

      const id = await ctx.runMutation(internal.notifications.createInternal, {
        userId,
        type,
        title,
        body,
        actionUrl: actionUrl || undefined,
      });

      void captureEvent({
        distinctId: userId,
        event: "agent_notification_sent",
        properties: {
          taskId: String(taskId),
          notificationId: String(id),
          type,
        },
      });

      return {
        ok: true,
        result: { id: String(id), title, type },
        summary: "Sent notification.",
      };
    }

    if (name === "web_search") {
      const q = typeof input?.q === "string" ? input.q.trim() : "";
      if (!q) return { ok: false, error: "q is required" };
      const maxResults = clampInt(input?.maxResults, 5, 1, 10);

      const approval = await ensureApprovedOrPause({
        ctx,
        userId,
        taskId,
        toolName: "web_search",
        detail: "Allow Jarvis to search the public web for this task.",
        params: { q, maxResults },
      });
      if (approval) return approval;

      const settings = await ctx.runQuery(internal.userSettings.getForUser, { userId });
      const providerRaw = String((settings as any)?.searchProvider ?? "jina");
      const provider = providerRaw === "tavily" || providerRaw === "perplexity" ? providerRaw : "jina";
      const apiKey = typeof (settings as any)?.searchApiKey === "string" ? (settings as any).searchApiKey : "";

      if (provider === "tavily") {
        if (!apiKey) return { ok: false, error: "Tavily API key not configured in Settings." };
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: q,
            max_results: maxResults,
            search_depth: "basic",
            include_answer: false,
            include_raw_content: false,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          return { ok: false, error: `Tavily error (${res.status}): ${truncate(text, 800)}` };
        }
        const data = (await res.json()) as any;
        const results = Array.isArray(data?.results) ? data.results : [];
        const simplified = results.slice(0, maxResults).map((r: any) => ({
          title: String(r?.title ?? ""),
          url: String(r?.url ?? ""),
          content: truncate(String(r?.content ?? ""), 1200),
          score: typeof r?.score === "number" ? r.score : undefined,
        }));

        void captureEvent({
          distinctId: userId,
          event: "agent_web_search",
          properties: { provider: "tavily", q, results: simplified.length },
        });

        return { ok: true, result: { provider: "tavily", q, results: simplified }, summary: `Found ${simplified.length} results.` };
      }

      if (provider === "perplexity") {
        if (!apiKey) return { ok: false, error: "Perplexity API key not configured in Settings." };

        // Uses Perplexity Search API to return structured results.
        const res = await fetch("https://api.perplexity.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            query: q,
            max_results: maxResults,
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          return { ok: false, error: `Perplexity error (${res.status}): ${truncate(text, 800)}` };
        }
        const data = (await res.json()) as any;
        const results = Array.isArray(data?.results) ? data.results : [];
        const simplified = results.slice(0, maxResults).map((r: any) => ({
          title: String(r?.title ?? ""),
          url: String(r?.url ?? ""),
          snippet: truncate(String(r?.snippet ?? ""), 1200),
          date: typeof r?.date === "string" ? r.date : undefined,
        }));

        void captureEvent({
          distinctId: userId,
          event: "agent_web_search",
          properties: { provider: "perplexity", q, results: simplified.length },
        });

        return { ok: true, result: { provider: "perplexity", q, results: simplified }, summary: `Found ${simplified.length} results.` };
      }

      // Jina search returns a readable, LLM-friendly digest (unstructured).
      const res = await fetch(`https://s.jina.ai/${encodeURIComponent(q)}`);
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Jina search error (${res.status}): ${truncate(text, 800)}` };
      }
      const text = await res.text();

      void captureEvent({
        distinctId: userId,
        event: "agent_web_search",
        properties: { provider: "jina", q },
      });

      return {
        ok: true,
        result: { provider: "jina", q, digest: truncateSoft(text, 22000) },
        summary: "Returned search digest.",
      };
    }

    if (name === "read_url") {
      const url = typeof input?.url === "string" ? input.url.trim() : "";
      if (!url) return { ok: false, error: "url is required" };
      const lower = url.toLowerCase();
      if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
        return { ok: false, error: "url must start with http:// or https://" };
      }
      const maxChars = clampInt(input?.maxChars, 20000, 2000, 80000);

      const approval = await ensureApprovedOrPause({
        ctx,
        userId,
        taskId,
        toolName: "read_url",
        detail: "Allow Jarvis to fetch and read a public URL for this task.",
        params: { url },
      });
      if (approval) return approval;

      const readerUrl = `https://r.jina.ai/${url}`;
      const res = await fetch(readerUrl);
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `read_url error (${res.status}): ${truncate(text, 800)}` };
      }
      const text = await res.text();
      const content = truncateSoft(text, maxChars);

      void captureEvent({
        distinctId: userId,
        event: "agent_read_url",
        properties: { url },
      });

      return {
        ok: true,
        result: { url, content, truncated: text.length > content.length },
        summary: `Read ${url}`,
      };
    }

    if (name === "github_list_my_pull_requests") {
      const token = await getConnectorToken(ctx, userId, "github");
      if (!token) return { ok: false, error: "GitHub is not connected. Add a token in Settings > Connections." };

      const limit = clampInt(input?.limit, 10, 1, 20);
      const extra = typeof input?.q === "string" ? input.q.trim() : "";

      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (!userRes.ok) {
        const text = await userRes.text();
        return { ok: false, error: `GitHub auth failed (${userRes.status}): ${truncate(text, 300)}` };
      }
      const userData = (await userRes.json()) as any;
      const login = String(userData?.login ?? "").trim();
      if (!login) return { ok: false, error: "GitHub auth succeeded but user login was missing." };

      const query = [
        "is:pr",
        "is:open",
        `author:${login}`,
        extra ? extra : null,
      ].filter(Boolean).join(" ");

      const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=${limit}`;
      const res = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `GitHub search failed (${res.status}): ${truncate(text, 300)}` };
      }
      const data = (await res.json()) as any;
      const items = Array.isArray(data?.items) ? data.items : [];
      const simplified = items.slice(0, limit).map((it: any) => ({
        title: String(it?.title ?? ""),
        url: String(it?.html_url ?? ""),
        repo: String(it?.repository_url ?? "").replace("https://api.github.com/repos/", ""),
        number: typeof it?.number === "number" ? it.number : undefined,
        updatedAt: String(it?.updated_at ?? ""),
      }));

      void captureEvent({
        distinctId: userId,
        event: "agent_github_list_prs",
        properties: { taskId: String(taskId), results: simplified.length },
      });

      return {
        ok: true,
        result: { query, results: simplified },
        summary: `Returned ${simplified.length} PRs.`,
      };
    }

    if (name === "github_create_issue") {
      const token = await getConnectorToken(ctx, userId, "github");
      if (!token) return { ok: false, error: "GitHub is not connected. Add a token in Settings > Connections." };

      const repo = typeof input?.repo === "string" ? input.repo.trim() : "";
      const title = typeof input?.title === "string" ? input.title.trim() : "";
      const body = typeof input?.body === "string" ? input.body : undefined;
      const labels = Array.isArray(input?.labels) ? input.labels.map(String).map((s: string) => s.trim()).filter(Boolean).slice(0, 10) : undefined;
      if (!repo) return { ok: false, error: "repo is required" };
      if (!title) return { ok: false, error: "title is required" };

      const approval = await ensureApprovedOrPause({
        ctx,
        userId,
        taskId,
        toolName: "github_create_issue",
        detail: `Allow Jarvis to create a GitHub issue in ${repo}.`,
        params: { repo, title, body: body ? truncate(body, 1200) : undefined, labels },
      });
      if (approval) return approval;

      const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
          labels,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `GitHub create issue failed (${res.status}): ${truncate(text, 500)}` };
      }
      const data = (await res.json()) as any;
      const htmlUrl = String(data?.html_url ?? "");

      void captureEvent({
        distinctId: userId,
        event: "agent_github_issue_created",
        properties: { taskId: String(taskId), repo, url: htmlUrl || undefined },
      });

      return {
        ok: true,
        result: { repo, title, url: htmlUrl || null, number: typeof data?.number === "number" ? data.number : null },
        summary: htmlUrl ? "Created GitHub issue." : "Created GitHub issue (no URL returned).",
      };
    }

    if (name === "gmail_list_recent") {
      const limit = clampInt(input?.limit, 10, 1, 20);
      const q = typeof input?.q === "string" ? input.q.trim() : "";
      const { accessToken } = await getGoogleAccessToken({ ctx, userId, provider: "gmail", toolNameForScopes: "gmail_list_recent" });

      const params = new URLSearchParams();
      params.set("maxResults", String(limit));
      if (q) params.set("q", q);

      const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!listRes.ok) {
        const text = await listRes.text();
        return { ok: false, error: `Gmail list failed (${listRes.status}): ${truncate(text, 400)}` };
      }

      const listData = (await listRes.json()) as any;
      const msgs = Array.isArray(listData?.messages) ? listData.messages : [];
      const ids = msgs.map((m: any) => String(m?.id ?? "")).filter(Boolean).slice(0, limit);

      const out = await Promise.all(ids.map(async (id: string) => {
        const metaRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!metaRes.ok) return null;
        const meta = (await metaRes.json()) as any;
        const headers = Array.isArray(meta?.payload?.headers) ? meta.payload.headers : [];
        const getH = (name: string) => String(headers.find((h: any) => String(h?.name ?? "").toLowerCase() === name.toLowerCase())?.value ?? "");
        return {
          id: String(meta?.id ?? id),
          threadId: String(meta?.threadId ?? ""),
          subject: truncate(getH("Subject"), 180),
          from: truncate(getH("From"), 220),
          date: truncate(getH("Date"), 120),
          snippet: truncate(String(meta?.snippet ?? ""), 280),
        };
      }));

      const simplified = out.filter(Boolean);

      void captureEvent({
        distinctId: userId,
        event: "agent_gmail_list_recent",
        properties: { taskId: String(taskId), q: q || undefined, results: simplified.length },
      });

      return {
        ok: true,
        result: { q: q || null, messages: simplified },
        summary: `Returned ${simplified.length} messages.`,
      };
    }

    if (name === "gmail_create_draft") {
      const to = typeof input?.to === "string" ? input.to.trim() : "";
      const subject = typeof input?.subject === "string" ? input.subject.trim() : "";
      const bodyText = typeof input?.bodyText === "string" ? input.bodyText : "";
      const bodyHtml = typeof input?.bodyHtml === "string" ? input.bodyHtml : undefined;
      if (!to) return { ok: false, error: "to is required" };
      if (!subject) return { ok: false, error: "subject is required" };
      if (!bodyText.trim()) return { ok: false, error: "bodyText is required" };

      const { accessToken } = await getGoogleAccessToken({ ctx, userId, provider: "gmail", toolNameForScopes: "gmail_create_draft" });
      const raw = buildEmailRaw({ to, subject, bodyText, bodyHtml });

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: { raw } }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Gmail draft create failed (${res.status}): ${truncate(text, 500)}` };
      }
      const data = (await res.json()) as any;

      void captureEvent({
        distinctId: userId,
        event: "agent_gmail_draft_created",
        properties: { taskId: String(taskId), draftId: typeof data?.id === "string" ? data.id : undefined },
      });

      return {
        ok: true,
        result: { draftId: String(data?.id ?? ""), messageId: String(data?.message?.id ?? ""), to, subject },
        summary: "Created Gmail draft.",
      };
    }

    if (name === "gmail_send_email") {
      const to = typeof input?.to === "string" ? input.to.trim() : "";
      const subject = typeof input?.subject === "string" ? input.subject.trim() : "";
      const bodyText = typeof input?.bodyText === "string" ? input.bodyText : "";
      const bodyHtml = typeof input?.bodyHtml === "string" ? input.bodyHtml : undefined;
      if (!to) return { ok: false, error: "to is required" };
      if (!subject) return { ok: false, error: "subject is required" };
      if (!bodyText.trim()) return { ok: false, error: "bodyText is required" };

      const approval = await ensureApprovedOrPause({
        ctx,
        userId,
        taskId,
        toolName: "gmail_send_email",
        detail: `Allow Jarvis to send an email to ${to}.`,
        params: { to, subject, bodyText: truncate(bodyText, 1200), bodyHtml: bodyHtml ? truncate(bodyHtml, 1200) : undefined },
      });
      if (approval) return approval;

      const { accessToken } = await getGoogleAccessToken({ ctx, userId, provider: "gmail", toolNameForScopes: "gmail_send_email" });
      const raw = buildEmailRaw({ to, subject, bodyText, bodyHtml });

      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Gmail send failed (${res.status}): ${truncate(text, 500)}` };
      }
      const data = (await res.json()) as any;

      void captureEvent({
        distinctId: userId,
        event: "agent_gmail_email_sent",
        properties: { taskId: String(taskId), messageId: typeof data?.id === "string" ? data.id : undefined },
      });

      return {
        ok: true,
        result: { messageId: String(data?.id ?? ""), threadId: String(data?.threadId ?? ""), to, subject },
        summary: "Sent email via Gmail.",
      };
    }

    if (name === "calendar_list_upcoming") {
      const limit = clampInt(input?.limit, 10, 1, 30);
      const daysAhead = clampInt(input?.daysAhead, 7, 1, 30);
      const { accessToken } = await getGoogleAccessToken({ ctx, userId, provider: "google-calendar", toolNameForScopes: "calendar_list_upcoming" });

      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();
      const params = new URLSearchParams({
        timeMin,
        timeMax,
        maxResults: String(limit),
        singleEvents: "true",
        orderBy: "startTime",
      });

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Calendar list failed (${res.status}): ${truncate(text, 400)}` };
      }

      const data = (await res.json()) as any;
      const items = Array.isArray(data?.items) ? data.items : [];
      const simplified = items.slice(0, limit).map((it: any) => ({
        id: String(it?.id ?? ""),
        summary: truncate(String(it?.summary ?? "(no title)"), 200),
        start: String(it?.start?.dateTime ?? it?.start?.date ?? ""),
        end: String(it?.end?.dateTime ?? it?.end?.date ?? ""),
        location: truncate(String(it?.location ?? ""), 220),
        htmlLink: String(it?.htmlLink ?? ""),
      }));

      void captureEvent({
        distinctId: userId,
        event: "agent_calendar_list_upcoming",
        properties: { taskId: String(taskId), daysAhead, results: simplified.length },
      });

      return {
        ok: true,
        result: { daysAhead, events: simplified },
        summary: `Returned ${simplified.length} events.`,
      };
    }

    if (name === "calendar_create_event") {
      const summary = typeof input?.summary === "string" ? input.summary.trim() : "";
      const description = typeof input?.description === "string" ? input.description : undefined;
      const startRaw = typeof input?.start === "string" ? input.start.trim() : "";
      const endRaw = typeof input?.end === "string" ? input.end.trim() : "";
      const timeZone = typeof input?.timeZone === "string" ? input.timeZone.trim() : undefined;
      const location = typeof input?.location === "string" ? input.location.trim() : undefined;
      const attendees = Array.isArray(input?.attendees)
        ? input.attendees.map(String).map((s: string) => s.trim()).filter(Boolean).slice(0, 20)
        : undefined;
      const sendUpdates = Boolean(input?.sendUpdates);

      if (!summary) return { ok: false, error: "summary is required" };
      if (!startRaw) return { ok: false, error: "start is required" };
      if (!endRaw) return { ok: false, error: "end is required" };

      const approval = await ensureApprovedOrPause({
        ctx,
        userId,
        taskId,
        toolName: "calendar_create_event",
        detail: `Allow Jarvis to create a calendar event: ${summary}.`,
        params: { summary, start: startRaw, end: endRaw, timeZone, location, attendees, sendUpdates },
      });
      if (approval) return approval;

      const { accessToken } = await getGoogleAccessToken({ ctx, userId, provider: "google-calendar", toolNameForScopes: "calendar_create_event" });
      const start = buildCalendarTime(startRaw, timeZone);
      const end = buildCalendarTime(endRaw, timeZone);

      const params = new URLSearchParams();
      params.set("sendUpdates", sendUpdates ? "all" : "none");

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary,
          description,
          location,
          start,
          end,
          attendees: attendees ? attendees.map((email: string) => ({ email })) : undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `Calendar create failed (${res.status}): ${truncate(text, 500)}` };
      }

      const data = (await res.json()) as any;
      const htmlLink = typeof data?.htmlLink === "string" ? data.htmlLink : "";

      void captureEvent({
        distinctId: userId,
        event: "agent_calendar_event_created",
        properties: { taskId: String(taskId), eventId: typeof data?.id === "string" ? data.id : undefined },
      });

      return {
        ok: true,
        result: { eventId: String(data?.id ?? ""), htmlLink: htmlLink || null },
        summary: htmlLink ? "Created calendar event." : "Created calendar event (no link returned).",
      };
    }

    void captureEvent({
      distinctId: userId,
      event: "agent_tool_failed",
      properties: {
        taskId: String(taskId),
        toolName: name,
        error: "Unknown tool",
      },
    });
    return { ok: false, error: `Unknown tool: ${name}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    void captureEvent({
      distinctId: userId,
      event: "agent_tool_failed",
      properties: {
        taskId: String(taskId),
        toolName: name,
        error: message,
      },
    });
    return { ok: false, error: message };
  }
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function buildEmailRaw(args: { to: string; subject: string; bodyText: string; bodyHtml?: string }): string {
  // Minimal RFC 5322 message. Keep this simple and ASCII-friendly.
  const headers = [
    `To: ${args.to}`,
    `Subject: ${args.subject}`,
    `MIME-Version: 1.0`,
    args.bodyHtml
      ? `Content-Type: text/html; charset="UTF-8"`
      : `Content-Type: text/plain; charset="UTF-8"`,
    "",
    args.bodyHtml ? args.bodyHtml : args.bodyText,
  ].join("\r\n");

  return encodeBase64Url(headers);
}

function buildCalendarTime(value: string, timeZone?: string): any {
  // All-day events use { date }. Timed events use { dateTime }.
  const isAllDay = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (isAllDay) return { date: value };
  const out: any = { dateTime: value };
  if (timeZone) out.timeZone = timeZone;
  return out;
}
