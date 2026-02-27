import { NextRequest } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { buildSseErrorResponse, getUserIdFromToken } from "@/lib/agentRouteUtils";

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL ?? "http://localhost:3001";
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET ?? "";
const SUPPORTED_CONNECTORS = new Set(["gmail", "google-calendar", "github"]);
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_GOOGLE_MODEL = "gemini-3-flash-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeModelForProvider(
  provider: "anthropic" | "google" | "openrouter",
  model: string | undefined
): string {
  if (provider === "google") {
    if (!model) return DEFAULT_GOOGLE_MODEL;
    if (model.startsWith("google/")) return model.slice("google/".length);
    return model.startsWith("gemini-") ? model : DEFAULT_GOOGLE_MODEL;
  }

  if (provider === "anthropic") {
    if (!model) return DEFAULT_ANTHROPIC_MODEL;
    if (model.startsWith("anthropic/")) return model.slice("anthropic/".length);
    return model.startsWith("claude-") ? model : DEFAULT_ANTHROPIC_MODEL;
  }

  return model ?? "google/gemini-3-flash-preview";
}

/**
 * POST /api/agent
 * Proxies chat requests to the agent server and streams SSE back to the browser.
 * This lets us:
 *  1. Keep AGENT_SERVER_SECRET server-side only
 *  2. Add any server-side auth checks (Convex session validation)
 *  3. Work around CORS when the agent server is on a different domain
 */
export async function POST(req: NextRequest) {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let resolvedAgentServerUrl = AGENT_SERVER_URL;

  let body: { threadId: string; message: string; sessionId?: string; modelOverride?: string };
  try {
    body = (await req.json()) as {
      threadId: string;
      message: string;
      sessionId?: string;
      modelOverride?: string;
    };
  } catch {
    return buildSseErrorResponse("Invalid request body");
  }

  // Fetch Convex data first — errors here are backend issues, not agent server issues
  let soulFileDoc: { content: string } | null;
  let persistentMemories: Array<{ _id: string; tier: string; category: string; title: string; content: string; importance: number }>;
  let tokenStatus: Array<{ connected: boolean; provider: string }>;
  let userSettings: {
    agentServerUrl?: string;
    agentServerSecret?: string;
    aiProvider?: "anthropic" | "google" | "openrouter";
    aiModel?: string;
    anthropicApiKey?: string;
    googleApiKey?: string;
    openrouterApiKey?: string;
  } | null;

  try {
    [soulFileDoc, persistentMemories, tokenStatus, userSettings] = await Promise.all([
      fetchQuery(api.memory.getSoulFile, {}, { token }),
      fetchQuery(api.memory.listByTier, { tier: "persistent", limit: 50 }, { token }),
      fetchQuery(api.connectors.tokens.list, {}, { token }),
      fetchQuery(api.settings.getRaw, { userId }, { token }),
    ]);
  } catch (convexError) {
    const msg = convexError instanceof Error ? convexError.message : "Backend error";
    return buildSseErrorResponse(`Backend error: ${msg}`);
  }

  const connectors = tokenStatus
    .filter((c) => c.connected && SUPPORTED_CONNECTORS.has(c.provider))
    .map((c) => c.provider);

  const agentServerUrl = userSettings?.agentServerUrl ?? AGENT_SERVER_URL;
  resolvedAgentServerUrl = agentServerUrl;
  const agentServerSecret = userSettings?.agentServerSecret ?? AGENT_SERVER_SECRET;

  // Model selection: chat UI override takes precedence over user settings
  let aiProvider = userSettings?.aiProvider ?? "anthropic";
  let aiModel = normalizeModelForProvider(aiProvider, userSettings?.aiModel);
  if (body.modelOverride) {
    const m = body.modelOverride;
    if (m.startsWith("gemini-")) {
      aiProvider = "google";
      aiModel = m;
    } else if (m.startsWith("claude-")) {
      aiProvider = "anthropic";
      aiModel = m;
    } else if (m.includes("/")) {
      aiProvider = "openrouter";
      aiModel = m;
    }
  }

  try {
    const agentRes = await fetch(`${agentServerUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(agentServerSecret ? { Authorization: `Bearer ${agentServerSecret}` } : {}),
      },
      body: JSON.stringify({
        ...body,
        userId,
        connectors,
        soulFile: soulFileDoc?.content ?? "",
        memories: persistentMemories.map((memory) => ({
          id: memory._id,
          tier: memory.tier,
          category: memory.category,
          title: memory.title,
          content: memory.content,
          importance: memory.importance,
        })),
        aiProvider,
        aiModel,
        anthropicApiKey: userSettings?.anthropicApiKey,
        googleApiKey: userSettings?.googleApiKey,
        openrouterApiKey: userSettings?.openrouterApiKey,
      }),
    });

    if (!agentRes.ok || !agentRes.body) {
      return buildSseErrorResponse(`Agent server error: ${agentRes.status}`);
    }

    // Pipe SSE stream from agent server -> browser.
    return new Response(agentRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    // Only this catch block is for agent server connectivity issues
    return buildSseErrorResponse(
      `Could not reach agent server at ${resolvedAgentServerUrl}. Start it with \`npm run agent\`.`
    );
  }
}
