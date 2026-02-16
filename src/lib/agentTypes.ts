// Shared SSE event types — mirrors agent-server/src/types.ts
// Keep in sync.

export type SSEEvent =
  | { type: "session_init"; sessionId: string; model: string }
  | { type: "text"; content: string }
  | { type: "tool_start"; toolName: string; toolInput: string; messageId?: string }
  | { type: "tool_done"; toolName: string; toolOutput: string; messageId?: string }
  | { type: "tool_error"; toolName: string; toolOutput: string; error?: string; messageId?: string }
  | { type: "memory_saved"; title: string; tier: string }
  | { type: "done"; content: string }
  | { type: "error"; error: string };
