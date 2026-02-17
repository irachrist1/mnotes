import { query } from "@anthropic-ai/claude-agent-sdk";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { AgentConfig, ChatRequest, SSEEvent } from "./types.js";
import { buildSystemPrompt } from "./prompt.js";
import { getAgentEnv } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, "..", "skills");

// Resolve tsx from our node_modules for running .ts MCP servers
const TSX_BIN = join(__dirname, "..", "node_modules", ".bin", "tsx");

// Tools always available to Jarvis
const CORE_TOOLS = ["WebSearch", "WebFetch"];

const CONNECTOR_SERVER_NAMES: Record<string, string> = {
  gmail: "gmail",
  "google-calendar": "calendar",
  outlook: "outlook",
  github: "github",
};

/**
 * Run the agent for one user message, streaming SSE events.
 */
export async function runAgent(
  req: ChatRequest,
  config: AgentConfig,
  connectors: string[],
  onEvent: (event: SSEEvent) => void
): Promise<{ sessionId: string; response: string }> {
  // Apply auth env vars so the SDK picks them up
  Object.assign(process.env, getAgentEnv(config));

  const systemPrompt = buildSystemPrompt(req.soulFile, req.memories ?? []);

  // Build MCP servers based on connected integrations
  const mcpServers = buildMcpServers(connectors, req.userId);

  // Allowed tools: core + wildcard MCP tool access per server
  const allowedTools = [
    ...CORE_TOOLS,
    "mcp__memory__*",
    ...connectors
      .map((c) => CONNECTOR_SERVER_NAMES[c])
      .filter((s): s is string => Boolean(s))
      .map((s) => `mcp__${s}__*`),
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
      permissionMode: "bypassPermissions" as const,
      allowDangerouslySkipPermissions: true,
      maxTurns: 25,
      cwd: SKILLS_DIR,
    },
  });

  for await (const message of agentQuery) {
    // Capture session ID from init message
    if (message.type === "system" && message.subtype === "init") {
      const initMsg = message as { session_id?: string };
      sessionId = initMsg.session_id ?? sessionId;
      onEvent({ type: "session_init", sessionId, model: config.model });
      continue;
    }

    // Stream text output from assistant messages
    if (message.type === "assistant") {
      const content = extractText(message);
      if (content) {
        finalResponse += content;
        onEvent({ type: "text", content });
      }
      const toolUses = extractToolUses(message);
      for (const tool of toolUses) {
        onEvent({
          type: "tool_start",
          toolName: tool.name,
          toolInput: JSON.stringify(tool.input),
        });
      }
    }

    // Final result message from SDK
    if (message.type === "result") {
      const resultMsg = message as { subtype?: string; result?: string };
      if (resultMsg.subtype === "success" && resultMsg.result) {
        finalResponse = resultMsg.result;
      }
    }
  }

  onEvent({ type: "done", content: finalResponse });
  return { sessionId, response: finalResponse };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type McpServerConfig = {
  command: string;
  args: string[];
  env?: Record<string, string>;
};

function buildMcpServers(
  connectors: string[],
  userId: string
): Record<string, McpServerConfig> {
  const servers: Record<string, McpServerConfig> = {};

  const baseEnv = {
    CONVEX_URL: process.env.CONVEX_URL ?? "",
    CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
    USER_ID: userId,
  };

  // Memory MCP server (always on — reads/writes Convex)
  servers["memory"] = {
    command: TSX_BIN,
    args: [join(__dirname, "mcp", "memory.ts")],
    env: { ...baseEnv },
  };

  if (connectors.includes("gmail")) {
    servers["gmail"] = {
      command: TSX_BIN,
      args: [join(__dirname, "mcp", "gmail.ts")],
      env: { ...baseEnv },
    };
  }

  if (connectors.includes("google-calendar")) {
    servers["calendar"] = {
      command: TSX_BIN,
      args: [join(__dirname, "mcp", "calendar.ts")],
      env: { ...baseEnv },
    };
  }

  if (connectors.includes("outlook")) {
    servers["outlook"] = {
      command: TSX_BIN,
      args: [join(__dirname, "mcp", "outlook.ts")],
      env: {
        ...baseEnv,
        MS_TENANT_ID: process.env.MS_TENANT_ID ?? "",
        MS_CLIENT_ID: process.env.MS_CLIENT_ID ?? "",
        MS_CLIENT_SECRET: process.env.MS_CLIENT_SECRET ?? "",
      },
    };
  }

  if (connectors.includes("github")) {
    servers["github"] = {
      command: TSX_BIN,
      args: [join(__dirname, "mcp", "github.ts")],
      env: { ...baseEnv },
    };
  }

  return servers;
}

function extractText(message: unknown): string {
  const m = message as { message?: { content?: unknown } };
  const content = m.message?.content;
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b: unknown) => (b as { type?: string }).type === "text")
      .map((b: unknown) => (b as { text?: string }).text ?? "")
      .join("");
  }
  return "";
}

function extractToolUses(
  message: unknown
): Array<{ name: string; input: unknown }> {
  const m = message as { message?: { content?: unknown } };
  const content = m.message?.content;
  if (!Array.isArray(content)) return [];
  return content
    .filter((b: unknown) => (b as { type?: string }).type === "tool_use")
    .map((b: unknown) => {
      const block = b as { name?: string; input?: unknown };
      return { name: block.name ?? "", input: block.input };
    });
}
