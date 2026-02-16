import { query } from "@anthropic-ai/claude-agent-sdk";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { AgentConfig, ChatRequest, SSEEvent } from "./types.js";
import { buildSystemPrompt } from "./prompt.js";
import { createMemoryMcpServer } from "./mcp/memory.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, "..", "skills");

// Tools always available to Jarvis
const CORE_TOOLS = [
  "WebSearch",
  "WebFetch",
];

// Tools that require explicit allow (side-effect or heavy)
const OPTIONAL_TOOLS = [
  "Bash",
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",
];

/**
 * Run the agent for one user message, streaming SSE events.
 *
 * @param req       - Incoming chat request
 * @param config    - Auth config (subscription / api-key / gemini)
 * @param connectors - Which connectors are enabled for this user
 * @param onEvent   - Callback to emit SSE events
 * @returns         - The final agent session ID (for resume)
 */
export async function runAgent(
  req: ChatRequest,
  config: AgentConfig,
  connectors: string[],
  onEvent: (event: SSEEvent) => void
): Promise<{ sessionId: string; response: string }> {
  const systemPrompt = buildSystemPrompt(req.soulFile, req.memories ?? []);

  // Build MCP servers based on connected integrations
  const mcpServers = buildMcpServers(connectors, req.userId);

  // Allowed tools list
  const allowedTools = [
    ...CORE_TOOLS,
    // MCP tool format: "mcp__serverName"
    ...connectors.map((c) => `mcp__${c}`),
    // Memory tools (always on)
    "mcp__memory",
    // Skills (auto-discovered from SKILLS_DIR)
    "Skill",
  ];

  let sessionId = req.sessionId ?? "";
  let finalResponse = "";

  const agentQuery = query({
    prompt: req.message,
    options: {
      ...(req.sessionId ? { resume: req.sessionId } : {}),
      model: config.mode !== "gemini" ? config.model : undefined,
      systemPrompt,
      allowedTools,
      mcpServers,
      permissionMode: "acceptEdits",
      settingSources: ["project"],
      cwd: SKILLS_DIR,
    },
  });

  for await (const message of agentQuery) {
    // Capture session ID from init message
    if (message.type === "system" && message.subtype === "init") {
      sessionId = (message as { session_id?: string }).session_id ?? sessionId;
      onEvent({
        type: "session_init",
        sessionId,
        model: config.model,
      });
      continue;
    }

    // Stream text output
    if (message.type === "assistant") {
      const content = extractText(message);
      if (content) {
        finalResponse += content;
        onEvent({ type: "text", content });
      }
      // Detect tool use
      const toolUses = extractToolUses(message);
      for (const tool of toolUses) {
        onEvent({
          type: "tool_start",
          toolName: tool.name,
          toolInput: JSON.stringify(tool.input),
        });
      }
    }

    // Tool results
    if (message.type === "tool_result") {
      const m = message as {
        tool_name?: string;
        content?: string;
        is_error?: boolean;
      };
      if (m.tool_name) {
        onEvent({
          type: m.is_error ? "tool_error" : "tool_done",
          toolName: m.tool_name,
          toolOutput: m.content ?? "",
          ...(m.is_error ? { error: m.content ?? "" } : {}),
        });
      }
    }

    // Final result
    if ("result" in message && typeof (message as { result?: string }).result === "string") {
      finalResponse = (message as { result: string }).result;
    }
  }

  onEvent({ type: "done", content: finalResponse });
  return { sessionId, response: finalResponse };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMcpServers(
  connectors: string[],
  userId: string
): Record<string, { command: string; args: string[]; env?: Record<string, string> }> {
  const servers: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {};

  // Memory MCP server (always on — reads/writes Convex)
  servers["memory"] = {
    command: "node",
    args: [join(__dirname, "mcp", "memory-server.js")],
    env: {
      CONVEX_URL: process.env.CONVEX_URL ?? "",
      CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
      USER_ID: userId,
    },
  };

  if (connectors.includes("gmail")) {
    servers["gmail"] = {
      command: "node",
      args: [join(__dirname, "mcp", "gmail-server.js")],
      env: {
        CONVEX_URL: process.env.CONVEX_URL ?? "",
        CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
        USER_ID: userId,
      },
    };
  }

  if (connectors.includes("google-calendar")) {
    servers["calendar"] = {
      command: "node",
      args: [join(__dirname, "mcp", "calendar-server.js")],
      env: {
        CONVEX_URL: process.env.CONVEX_URL ?? "",
        CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
        USER_ID: userId,
      },
    };
  }

  if (connectors.includes("outlook")) {
    servers["outlook"] = {
      command: "node",
      args: [join(__dirname, "mcp", "outlook-server.js")],
      env: {
        CONVEX_URL: process.env.CONVEX_URL ?? "",
        CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
        USER_ID: userId,
        MS_TENANT_ID: process.env.MS_TENANT_ID ?? "",
        MS_CLIENT_ID: process.env.MS_CLIENT_ID ?? "",
        MS_CLIENT_SECRET: process.env.MS_CLIENT_SECRET ?? "",
      },
    };
  }

  if (connectors.includes("github")) {
    servers["github"] = {
      command: "node",
      args: [join(__dirname, "mcp", "github-server.js")],
      env: {
        CONVEX_URL: process.env.CONVEX_URL ?? "",
        CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
        USER_ID: userId,
      },
    };
  }

  return servers;
}

function extractText(message: unknown): string {
  const m = message as { content?: unknown };
  if (!m.content) return "";
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.content)) {
    return m.content
      .filter((b: unknown) => (b as { type?: string }).type === "text")
      .map((b: unknown) => (b as { text?: string }).text ?? "")
      .join("");
  }
  return "";
}

function extractToolUses(message: unknown): Array<{ name: string; input: unknown }> {
  const m = message as { content?: unknown };
  if (!Array.isArray(m.content)) return [];
  return m.content
    .filter((b: unknown) => (b as { type?: string }).type === "tool_use")
    .map((b: unknown) => {
      const block = b as { name?: string; input?: unknown };
      return { name: block.name ?? "", input: block.input };
    });
}

// Minimal stub for import — actual MCP runs as subprocess
export function createMemoryMcpServer(_userId: string) {
  return {};
}
