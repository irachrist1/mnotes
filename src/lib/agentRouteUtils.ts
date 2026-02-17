export function getUserIdFromToken(token: string): string | null {
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

export function buildSseErrorResponse(error: string): Response {
  return new Response(`data: ${JSON.stringify({ type: "error", error })}\n\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
