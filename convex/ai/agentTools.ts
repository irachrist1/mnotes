"use node";

import { internal } from "../_generated/api";
import { captureEvent } from "../lib/posthog";
import { parseAgentState } from "./taskAgentParsing";

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
