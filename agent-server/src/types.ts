// Shared types for the agent server

export interface ChatRequest {
  threadId: string;
  message: string;
  userId: string;
  sessionId?: string; // Agent SDK session ID for resume
  connectors?: string[];
  soulFile?: string; // User's soul file content
  memories?: MemoryEntry[]; // Persistent memories
  aiProvider?: "anthropic" | "google" | "openrouter";
  aiModel?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  openrouterApiKey?: string;
}

export interface MemoryEntry {
  id: string;
  tier: "persistent" | "archival" | "session";
  category: string;
  title: string;
  content: string;
  importance: number;
}

export type SSEEvent =
  | { type: "session_init"; sessionId: string; model: string }
  | { type: "text"; content: string }
  | { type: "tool_start"; toolName: string; toolInput: string; messageId?: string }
  | { type: "tool_done"; toolName: string; toolOutput: string; messageId?: string }
  | { type: "tool_error"; toolName: string; error: string; messageId?: string }
  | { type: "memory_saved"; title: string; tier: string }
  | { type: "done"; content: string }
  | { type: "error"; error: string };

export type AuthMode = "subscription" | "api-key" | "gemini";

export interface AgentConfig {
  mode: AuthMode;
  model: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}
