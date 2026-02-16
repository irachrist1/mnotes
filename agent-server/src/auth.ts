import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { AgentConfig, AuthMode } from "./types.js";

/**
 * Detect which auth mode to use for the agent, in priority order:
 * 1. ANTHROPIC_API_KEY env var → API key mode
 * 2. ~/.claude/credentials.json exists → Claude subscription (local mode)
 * 3. GOOGLE_AI_KEY env var → Gemini fallback
 * 4. Throw: no auth configured
 */
export function detectAuthMode(): AgentConfig {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.GOOGLE_AI_KEY;

  // Priority 1: Explicit API key
  if (anthropicKey) {
    return {
      mode: "api-key",
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929",
      anthropicApiKey: anthropicKey,
    };
  }

  // Priority 2: Claude Code subscription session
  const credentialsPath = join(homedir(), ".claude", "credentials.json");
  if (existsSync(credentialsPath)) {
    return {
      mode: "subscription",
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929",
    };
  }

  // Priority 3: Google AI (Gemini)
  if (googleKey) {
    return {
      mode: "gemini",
      model: process.env.GOOGLE_MODEL ?? "gemini-2.0-flash-exp",
      googleApiKey: googleKey,
    };
  }

  throw new Error(
    "No AI auth configured. Set ANTHROPIC_API_KEY, log in to Claude (run `claude` CLI), or set GOOGLE_AI_KEY."
  );
}

/**
 * Build environment overrides for the Agent SDK based on auth mode.
 * The Agent SDK automatically picks up ANTHROPIC_API_KEY from env.
 * For subscription mode, it picks up the Claude session from ~/.claude/credentials.json.
 */
export function getAgentEnv(config: AgentConfig): Record<string, string> {
  if (config.mode === "api-key" && config.anthropicApiKey) {
    return { ANTHROPIC_API_KEY: config.anthropicApiKey };
  }
  // subscription mode: Agent SDK auto-reads ~/.claude/credentials.json, no extra env needed
  return {};
}

export function getStatusInfo(config: AgentConfig) {
  return {
    mode: config.mode as AuthMode,
    model: config.model,
    description:
      config.mode === "subscription"
        ? "Using Claude subscription (local session)"
        : config.mode === "api-key"
        ? "Using Anthropic API key"
        : "Using Google Gemini Flash",
  };
}
