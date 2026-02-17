/**
 * GitHub MCP server — GitHub REST API.
 * Uses OAuth tokens stored in Convex (provider: "github").
 */

import { ConvexHttpClient } from "convex/browser";
import { createInterface } from "readline";

const CONVEX_URL = process.env.CONVEX_URL ?? "";
const USER_ID = process.env.USER_ID ?? "";
const convex = new ConvexHttpClient(CONVEX_URL);

const TOOLS = [
  {
    name: "github_list_prs",
    description: "List open pull requests for a GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", enum: ["open", "closed", "all"], description: "PR state (default: open)" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "github_list_issues",
    description: "List issues for a GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state (default: open)" },
        labels: { type: "string", description: "Comma-separated list of labels to filter by" },
        assignee: { type: "string", description: "Filter by assignee username" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "github_get_pr",
    description: "Get details of a specific pull request.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        number: { type: "number", description: "PR number" },
      },
      required: ["owner", "repo", "number"],
    },
  },
  {
    name: "github_create_issue",
    description: "Create a new GitHub issue. Requires user confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        title: { type: "string" },
        body: { type: "string" },
        labels: { type: "array", items: { type: "string" } },
        assignees: { type: "array", items: { type: "string" } },
      },
      required: ["owner", "repo", "title"],
    },
  },
  {
    name: "github_get_repo_activity",
    description: "Get recent activity/events for a GitHub repository.",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string" },
        repo: { type: "string" },
        perPage: { type: "number", description: "Events per page (default 10)" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "github_list_my_prs",
    description: "List pull requests assigned to or created by the authenticated user across all repos.",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", enum: ["open", "closed"], description: "PR state (default: open)" },
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
  if (method === "initialize") { respond(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "github", version: "1.0.0" } }); return; }
  if (method === "tools/list") { respond(id, { tools: TOOLS }); return; }
  if (method === "tools/call") {
    const p = params as { name: string; arguments: Record<string, unknown> };
    try {
      const result = await handleTool(p.name, p.arguments);
      respond(id, { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }] });
    } catch (err) { respondError(id, err instanceof Error ? err.message : "GitHub error"); }
    return;
  }
  respond(id, null);
});

async function getAccessToken() {
  const tokens = await convex.query("connectors/tokens:getByProvider" as any, {
    userId: USER_ID,
    provider: "github",
  });
  if (!tokens?.accessToken) throw new Error("GitHub not connected. Please connect GitHub in Settings.");
  return tokens.accessToken;
}

async function ghFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${err}`);
  }
  return res.json();
}

function formatPR(pr: {
  number?: number;
  title?: string;
  user?: { login?: string };
  state?: string;
  draft?: boolean;
  created_at?: string;
  updated_at?: string;
  html_url?: string;
  body?: string;
}) {
  return [
    `#${pr.number} — ${pr.title}`,
    `Author: ${pr.user?.login ?? "Unknown"} | State: ${pr.state}${pr.draft ? " (draft)" : ""}`,
    `Created: ${pr.created_at ? new Date(pr.created_at).toLocaleDateString() : ""} | Updated: ${pr.updated_at ? new Date(pr.updated_at).toLocaleDateString() : ""}`,
    `URL: ${pr.html_url}`,
  ].join("\n");
}

function formatIssue(issue: {
  number?: number;
  title?: string;
  user?: { login?: string };
  state?: string;
  labels?: Array<{ name?: string }>;
  created_at?: string;
  html_url?: string;
  body?: string;
}) {
  const labels = issue.labels?.map((l) => l.name).join(", ") ?? "";
  return [
    `#${issue.number} — ${issue.title}`,
    `Author: ${issue.user?.login ?? "Unknown"} | State: ${issue.state}${labels ? ` | Labels: ${labels}` : ""}`,
    `Created: ${issue.created_at ? new Date(issue.created_at).toLocaleDateString() : ""}`,
    `URL: ${issue.html_url}`,
  ].join("\n");
}

async function handleTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "github_list_prs": {
      const state = String(args.state ?? "open");
      const prs = await ghFetch(
        `/repos/${args.owner}/${args.repo}/pulls?state=${state}&per_page=20`
      ) as Array<{ number?: number; title?: string; user?: { login?: string }; state?: string; draft?: boolean; created_at?: string; updated_at?: string; html_url?: string; body?: string }>;
      if (!prs.length) return `No ${state} pull requests found.`;
      return prs.map(formatPR).join("\n\n---\n\n");
    }

    case "github_list_issues": {
      const state = String(args.state ?? "open");
      const params = new URLSearchParams({ state, per_page: "20" });
      if (args.labels) params.set("labels", String(args.labels));
      if (args.assignee) params.set("assignee", String(args.assignee));
      const issues = await ghFetch(
        `/repos/${args.owner}/${args.repo}/issues?${params}`
      ) as Array<{ number?: number; title?: string; user?: { login?: string }; state?: string; labels?: Array<{ name?: string }>; created_at?: string; html_url?: string; body?: string; pull_request?: unknown }>;
      // Filter out PRs (GitHub issues API returns PRs too)
      const issuesOnly = issues.filter((i) => !i.pull_request);
      if (!issuesOnly.length) return `No ${state} issues found.`;
      return issuesOnly.map(formatIssue).join("\n\n---\n\n");
    }

    case "github_get_pr": {
      const pr = await ghFetch(
        `/repos/${args.owner}/${args.repo}/pulls/${args.number}`
      ) as { number?: number; title?: string; user?: { login?: string }; state?: string; draft?: boolean; created_at?: string; updated_at?: string; html_url?: string; body?: string; head?: { sha?: string }; base?: { ref?: string } };
      const comments = await ghFetch(
        `/repos/${args.owner}/${args.repo}/pulls/${args.number}/comments?per_page=10`
      ) as Array<{ user?: { login?: string }; body?: string }>;
      const commentText = comments.length
        ? `\n\nRecent comments:\n${comments.map((c) => `  ${c.user?.login}: ${c.body}`).join("\n")}`
        : "";
      return `${formatPR(pr)}\n\nDescription: ${pr.body ?? "(none)"}${commentText}`;
    }

    case "github_create_issue": {
      const issue = await ghFetch(`/repos/${args.owner}/${args.repo}/issues`, {
        method: "POST",
        body: JSON.stringify({
          title: args.title,
          body: args.body,
          labels: args.labels,
          assignees: args.assignees,
        }),
      }) as { number?: number; html_url?: string };
      return `Issue created: #${issue.number}\n${issue.html_url}`;
    }

    case "github_get_repo_activity": {
      const events = await ghFetch(
        `/repos/${args.owner}/${args.repo}/events?per_page=${Math.min(Number(args.perPage ?? 10), 30)}`
      ) as Array<{ type?: string; actor?: { login?: string }; created_at?: string; payload?: unknown }>;
      if (!events.length) return "No recent activity.";
      return events.map((e) =>
        `${e.type} by ${e.actor?.login} at ${e.created_at ? new Date(e.created_at).toLocaleString() : ""}`
      ).join("\n");
    }

    case "github_list_my_prs": {
      const state = String(args.state ?? "open");
      const prs = await ghFetch(
        `/search/issues?q=is:pr+is:${state}+involves:@me&per_page=20`
      ) as { items?: Array<{ number?: number; title?: string; user?: { login?: string }; state?: string; draft?: boolean; created_at?: string; updated_at?: string; html_url?: string }> };
      if (!prs.items?.length) return `No ${state} PRs involving you.`;
      return prs.items.map((pr) => `${pr.html_url}\n#${pr.number} — ${pr.title} | ${pr.state}`).join("\n\n");
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
