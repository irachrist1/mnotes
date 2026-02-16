import { NextRequest } from "next/server";

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL ?? "http://localhost:3001";
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET ?? "";

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
  const body = await req.json() as {
    threadId: string;
    message: string;
    sessionId?: string;
    connectors?: string[];
  };

  // TODO: verify the user's Convex session here for production
  // const userId = await getConvexUserId(req);

  const agentRes = await fetch(`${AGENT_SERVER_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(AGENT_SERVER_SECRET ? { Authorization: `Bearer ${AGENT_SERVER_SECRET}` } : {}),
    },
    body: JSON.stringify({
      ...body,
      userId: "default", // Will be replaced with real userId from Convex session
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
