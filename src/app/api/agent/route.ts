import { NextRequest } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

function getUserIdFromToken(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(Buffer.from(normalized, "base64").toString("utf8")) as {
      sub?: string;
    };

    return decoded.sub?.split("|")[0] ?? null;
  } catch {
    return null;
  }
}

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL ?? "http://localhost:3001";
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET ?? "";
const SUPPORTED_CONNECTORS = new Set(["gmail", "google-calendar", "github"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const body = await req.json() as {
    threadId: string;
    message: string;
    sessionId?: string;
  };

  const [soulFileDoc, persistentMemories, tokenStatus, userSettings] = await Promise.all([
    fetchQuery(api.memory.getSoulFile, {}, { token }),
    fetchQuery(api.memory.listByTier, { tier: "persistent", limit: 50 }, { token }),
    fetchQuery(api.connectors.tokens.list, {}, { token }),
    fetchQuery(api.settings.getRaw, { userId }, { token }),
  ]);

  const connectors = tokenStatus
    .filter((c) => c.connected && SUPPORTED_CONNECTORS.has(c.provider))
    .map((c) => c.provider);

  const agentServerUrl = userSettings?.agentServerUrl ?? AGENT_SERVER_URL;
  const agentServerSecret = userSettings?.agentServerSecret ?? AGENT_SERVER_SECRET;

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
    }),
  });

  if (!agentRes.ok || !agentRes.body) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", error: `Agent server error: ${agentRes.status}` })}\n\n`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      }
    );
  }

  // Pipe SSE stream from agent server → browser
  return new Response(agentRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
