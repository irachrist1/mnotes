import { query } from "@anthropic-ai/claude-agent-sdk";
import { GoogleGenAI, type Chat } from "@google/genai";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import type { AgentConfig, ChatRequest, SSEEvent } from "./types.js";
import { buildSystemPrompt } from "./prompt.js";
import { getAgentEnv } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SKILLS_DIR = join(__dirname, "..", "skills");

// When running with `tsx watch` the source files are .ts; when running the
// compiled build they are .js. Detect this so MCP subprocesses use the right
// runner and file extension.
const IS_DEV = __filename.endsWith(".ts");
const TSX_BIN = join(__dirname, "..", "node_modules", ".bin", "tsx");
const MCP_EXT = IS_DEV ? ".ts" : ".js";

/** Returns the command + args prefix needed to run an MCP script. */
function mcpRunner(scriptPath: string): { command: string; args: string[] } {
  if (IS_DEV && existsSync(TSX_BIN)) {
    return { command: TSX_BIN, args: [scriptPath] };
  }
  if (IS_DEV) {
    // Fall back to npx tsx if local tsx binary not found
    return { command: "npx", args: ["tsx", scriptPath] };
  }
  return { command: "node", args: [scriptPath] };
}

// Tools always available to Jarvis
const CORE_TOOLS = [
  "WebSearch",
  "WebFetch",
];

const OPTIONAL_LOCAL_TOOLS = ["Bash", "Read", "Write", "Edit", "Glob", "Grep"];

const CONNECTOR_SERVER_NAMES: Record<string, string> = {
  gmail: "gmail",
  "google-calendar": "calendar",
  outlook: "outlook",
  github: "github",
};

const DEFAULT_GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_SESSION_TTL_MS = 30 * 60 * 1000;
const GEMINI_MAX_SESSIONS = 200;
const geminiChats = new Map<
  string,
  { chat: Chat; model: string; apiKey: string; updatedAt: number }
>();

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
  Object.assign(process.env, getAgentEnv(config));

  const systemPrompt = buildSystemPrompt(req.soulFile, req.memories ?? []);
  if (config.mode === "gemini") {
    return runGeminiFallback(req, config, systemPrompt, onEvent);
  }

  try {
    return await runClaudeAgent(req, config, connectors, systemPrompt, onEvent);
  } catch (error) {
    if (!shouldFallbackToGemini(config, error)) {
      throw error;
    }

    const fallbackModel = process.env.GOOGLE_MODEL ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
    return runGeminiFallback(
      req,
      {
        mode: "gemini",
        model: fallbackModel,
        googleApiKey: config.googleApiKey,
      },
      systemPrompt,
      onEvent
    );
  }
}

async function runGeminiFallback(
  req: ChatRequest,
  config: AgentConfig,
  systemPrompt: string,
  onEvent: (event: SSEEvent) => void
): Promise<{ sessionId: string; response: string }> {
  if (!config.googleApiKey) {
    throw new Error("Google Gemini selected, but GOOGLE_AI_KEY is missing.");
  }

  const sessionId =
    req.sessionId ??
    `gemini-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const sessionKey = `${req.userId}:${sessionId}`;

  onEvent({
    type: "session_init",
    sessionId,
    model: config.model,
  });

  pruneGeminiChats();

  let chatSession = geminiChats.get(sessionKey);
  if (
    !chatSession ||
    chatSession.model !== config.model ||
    chatSession.apiKey !== config.googleApiKey
  ) {
    const client = new GoogleGenAI({ apiKey: config.googleApiKey });
    const chat = client.chats.create({
      model: config.model,
      config: {
        systemInstruction: systemPrompt,
      },
    });
    chatSession = {
      chat,
      model: config.model,
      apiKey: config.googleApiKey,
      updatedAt: Date.now(),
    };
    geminiChats.set(sessionKey, chatSession);
  } else {
    chatSession.updatedAt = Date.now();
  }

  let responseText = "";
  const stream = await chatSession.chat.sendMessageStream({ message: req.message });
  for await (const chunk of stream) {
    const chunkText = chunk.text ?? "";
    if (!chunkText) continue;
    // Handle both delta and cumulative chunk shapes defensively.
    const delta = chunkText.startsWith(responseText)
      ? chunkText.slice(responseText.length)
      : chunkText;
    if (!delta) continue;
    responseText += delta;
    onEvent({ type: "text", content: delta });
  }

  onEvent({ type: "done", content: responseText });

  return { sessionId, response: responseText };
}

async function runClaudeAgent(
  req: ChatRequest,
  config: AgentConfig,
  connectors: string[],
  systemPrompt: string,
  onEvent: (event: SSEEvent) => void
): Promise<{ sessionId: string; response: string }> {
  // Build MCP servers based on connected integrations
  const mcpServers = buildMcpServers(connectors, req.userId);

  // Allowed tools list
  const allowedTools = [
    ...CORE_TOOLS,
    ...OPTIONAL_LOCAL_TOOLS,
    // MCP tool format: "mcp__serverName"
    ...connectors
      .map((connector) => CONNECTOR_SERVER_NAMES[connector])
      .filter((serverName): serverName is string => Boolean(serverName))
      .map((serverName) => `mcp__${serverName}`),
    // Memory tools (always on)
    "mcp__memory",
    // Skills (auto-discovered from SKILLS_DIR)
    "Skill",
  ];

  let sessionId = req.sessionId ?? "";
  let finalResponse = "";
  // Map tool_use id → tool name so we can emit tool_done with the right name
  const toolIdToName = new Map<string, string>();

  const agentQuery = query({
    prompt: req.message,
    options: {
      ...(req.sessionId ? { resume: req.sessionId } : {}),
      model: config.model,
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

    // Stream text output + tool_start events
    if (message.type === "assistant") {
      const content = extractText(message);
      if (content) {
        finalResponse += content;
        onEvent({ type: "text", content });
      }
      const toolUses = extractToolUses(message);
      for (const tool of toolUses) {
        if (tool.id) toolIdToName.set(tool.id, tool.name);
        onEvent({
          type: "tool_start",
          toolName: tool.name,
          toolInput: JSON.stringify(tool.input),
          messageId: tool.id,
        });
      }
    }

    // Tool results — emit tool_done / tool_error to close open tool cards
    if (message.type === "user") {
      const results = extractToolResults(message);
      for (const result of results) {
        const toolName = toolIdToName.get(result.toolUseId) ?? "";
        if (!toolName) continue;
        onEvent({
          type: result.isError ? "tool_error" : "tool_done",
          toolName,
          toolOutput: result.output,
          messageId: result.toolUseId,
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

function shouldFallbackToGemini(config: AgentConfig, error: unknown): boolean {
  if (!config.googleApiKey) return false;
  const message = error instanceof Error ? error.message : String(error);
  return /claude code process exited|no ai auth configured|anthropic|rate limit|billing|overloaded|429|401|403/i.test(
    message
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMcpServers(
  connectors: string[],
  userId: string
): Record<string, { command: string; args: string[]; env?: Record<string, string> }> {
  const servers: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {};

  // Memory MCP server (always on — reads/writes Convex)
  const memoryScript = join(__dirname, "mcp", `memory${MCP_EXT}`);
  const { command: memCmd, args: memArgs } = mcpRunner(memoryScript);
  servers["memory"] = {
    command: memCmd,
    args: memArgs,
    env: {
      CONVEX_URL: process.env.CONVEX_URL ?? "",
      CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
      USER_ID: userId,
    },
  };

  if (connectors.includes("gmail")) {
    const script = join(__dirname, "mcp", `gmail${MCP_EXT}`);
    const { command, args } = mcpRunner(script);
    servers["gmail"] = {
      command,
      args,
      env: {
        CONVEX_URL: process.env.CONVEX_URL ?? "",
        CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
        USER_ID: userId,
      },
    };
  }

  if (connectors.includes("google-calendar")) {
    const script = join(__dirname, "mcp", `calendar${MCP_EXT}`);
    const { command, args } = mcpRunner(script);
    servers["calendar"] = {
      command,
      args,
      env: {
        CONVEX_URL: process.env.CONVEX_URL ?? "",
        CONVEX_DEPLOY_KEY: process.env.CONVEX_DEPLOY_KEY ?? "",
        USER_ID: userId,
      },
    };
  }

  if (connectors.includes("outlook")) {
    const script = join(__dirname, "mcp", `outlook${MCP_EXT}`);
    const { command, args } = mcpRunner(script);
    servers["outlook"] = {
      command,
      args,
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
    const script = join(__dirname, "mcp", `github${MCP_EXT}`);
    const { command, args } = mcpRunner(script);
    servers["github"] = {
      command,
      args,
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

function extractToolUses(message: unknown): Array<{ id: string; name: string; input: unknown }> {
  const m = message as { content?: unknown };
  if (!Array.isArray(m.content)) return [];
  return m.content
    .filter((b: unknown) => (b as { type?: string }).type === "tool_use")
    .map((b: unknown) => {
      const block = b as { id?: string; name?: string; input?: unknown };
      return { id: block.id ?? "", name: block.name ?? "", input: block.input };
    });
}

function extractToolResults(message: unknown): Array<{ toolUseId: string; output: string; isError: boolean }> {
  const m = message as { content?: unknown };
  if (!Array.isArray(m.content)) return [];
  return m.content
    .filter((b: unknown) => (b as { type?: string }).type === "tool_result")
    .map((b: unknown) => {
      const block = b as { tool_use_id?: string; content?: unknown; is_error?: boolean };
      let output = "";
      if (typeof block.content === "string") {
        output = block.content;
      } else if (Array.isArray(block.content)) {
        output = block.content
          .filter((c: unknown) => (c as { type?: string }).type === "text")
          .map((c: unknown) => (c as { text?: string }).text ?? "")
          .join("");
      }
      return { toolUseId: block.tool_use_id ?? "", output, isError: block.is_error ?? false };
    })
    .filter((r) => r.toolUseId);
}

function pruneGeminiChats(): void {
  const now = Date.now();
  for (const [sessionId, session] of geminiChats) {
    if (now - session.updatedAt > GEMINI_SESSION_TTL_MS) {
      geminiChats.delete(sessionId);
    }
  }

  if (geminiChats.size <= GEMINI_MAX_SESSIONS) return;

  const oldestFirst = [...geminiChats.entries()].sort(
    (a, b) => a[1].updatedAt - b[1].updatedAt
  );
  const removeCount = geminiChats.size - GEMINI_MAX_SESSIONS;
  for (let i = 0; i < removeCount; i += 1) {
    geminiChats.delete(oldestFirst[i][0]);
  }
}
