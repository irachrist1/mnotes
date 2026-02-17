import { describe, expect, it } from "vitest";
import { buildSseErrorResponse, getUserIdFromToken } from "@/lib/agentRouteUtils";

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

describe("agent route utils", () => {
  it("extracts user id from convex token subject", () => {
    const payload = base64UrlEncode(JSON.stringify({ sub: "user_123|session_abc" }));
    const token = `header.${payload}.sig`;

    expect(getUserIdFromToken(token)).toBe("user_123");
  });

  it("returns null for invalid token payload", () => {
    expect(getUserIdFromToken("invalid.token")).toBeNull();
  });

  it("builds SSE error response", async () => {
    const res = buildSseErrorResponse("Agent server error: 503");
    const body = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(body).toContain('"type":"error"');
    expect(body).toContain("Agent server error: 503");
  });
});
