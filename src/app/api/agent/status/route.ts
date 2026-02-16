import { NextRequest, NextResponse } from "next/server";

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL ?? "http://localhost:3001";
const AGENT_SERVER_SECRET = process.env.AGENT_SERVER_SECRET ?? "";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${AGENT_SERVER_URL}/api/status`, {
      headers: {
        ...(AGENT_SERVER_SECRET ? { Authorization: `Bearer ${AGENT_SERVER_SECRET}` } : {}),
      },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { mode: "error", model: null, description: "Could not reach agent server" },
      { status: 503 }
    );
  }
}
