import express from "express";
import cors from "cors";
import { detectAuthMode, getStatusInfo } from "./auth.js";
import { runAgent } from "./agent.js";
import type { ChatRequest, SSEEvent } from "./types.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET;
const SUPPORTED_CONNECTORS = new Set(["gmail", "google-calendar", "github"]);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

// Simple bearer token auth for Next.js → agent server calls
function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!AGENT_SERVER_SECRET) {
    // No secret configured: allow all (dev mode)
    return next();
  }
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${AGENT_SERVER_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.get("/api/status", requireAuth, (_req, res) => {
  try {
    const config = detectAuthMode();
    res.json(getStatusInfo(config));
  } catch (err) {
    res.status(503).json({
      mode: "unconfigured",
      model: null,
      description: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

/**
 * POST /api/chat
 * Body: ChatRequest
 * Response: SSE stream of SSEEvent objects
 *
 * Each event is: data: <JSON>\n\n
 */
app.post("/api/chat", requireAuth, async (req, res) => {
  const body = req.body as ChatRequest;

  if (!body.userId || !body.message || !body.threadId) {
    res.status(400).json({ error: "Missing required fields: userId, message, threadId" });
    return;
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();

  const sendEvent = (event: SSEEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    const config = detectAuthMode({
      preferredProvider: body.aiProvider,
      preferredModel: body.aiModel,
      anthropicApiKey: body.anthropicApiKey,
      googleApiKey: body.googleApiKey,
    });

    // Determine which connectors this user has (passed from Next.js)
    const connectors: string[] = Array.isArray(body.connectors)
      ? (body.connectors as string[]).filter((connector) => SUPPORTED_CONNECTORS.has(connector))
      : [];

    await runAgent(body, config, connectors, sendEvent);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent error";
    sendEvent({ type: "error", error: message });
  } finally {
    res.end();
  }
});

/**
 * POST /api/task
 * Non-streaming task execution for scheduled/proactive agent runs.
 * Body: same as ChatRequest minus sessionId (tasks always start fresh)
 * Response: { success: true, response: string, sessionId: string }
 *         | { success: false, error: string }
 */
app.post("/api/task", requireAuth, async (req, res) => {
  const body = req.body as ChatRequest;

  if (!body.userId || !body.message || !body.threadId) {
    res.status(400).json({ error: "Missing required fields: userId, message, threadId" });
    return;
  }

  try {
    const config = detectAuthMode({
      preferredProvider: body.aiProvider,
      preferredModel: body.aiModel,
      anthropicApiKey: body.anthropicApiKey,
      googleApiKey: body.googleApiKey,
    });

    const connectors: string[] = Array.isArray(body.connectors)
      ? (body.connectors as string[]).filter((c) => SUPPORTED_CONNECTORS.has(c))
      : [];

    // Collect events but don't stream — return when done
    const events: SSEEvent[] = [];
    const onEvent = (event: SSEEvent) => events.push(event);

    const result = await runAgent(body, config, connectors, onEvent);

    res.json({
      success: true,
      response: result.response,
      sessionId: result.sessionId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent error";
    res.status(500).json({ success: false, error: message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const authConfig = (() => {
  try {
    return detectAuthMode();
  } catch {
    return null;
  }
})();

app.listen(PORT, () => {
  console.log(`🤖 Jarvis agent server running on http://localhost:${PORT}`);
  if (authConfig) {
    console.log(`🔑 Auth mode: ${authConfig.mode} (${authConfig.model})`);
  } else {
    console.warn("⚠️  No AI auth configured. Set ANTHROPIC_API_KEY or log in with `claude`.");
  }
});
