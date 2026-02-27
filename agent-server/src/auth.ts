import { existsSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { AgentConfig, AuthMode } from "./types.js";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-preview-04-17";

export interface AuthOverrides {
  preferredProvider?: "anthropic" | "google" | "openrouter";
  preferredModel?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
}

function hasClaudeCredentials(): boolean {
  const claudeConfigDir = process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), ".claude");

  // Legacy: credentials.json (old API key auth format)
  const credentialsPaths = [
    join(claudeConfigDir, ".credentials.json"),
    join(claudeConfigDir, "credentials.json"),
  ];
  if (credentialsPaths.some((path) => existsSync(path))) return true;

  // Modern: OAuth-based session files stored in session-env/ directory
  // (used by Claude Code 1.x+ with subscription auth)
  const sessionEnvDir = join(claudeConfigDir, "session-env");
  if (existsSync(sessionEnvDir)) {
    try {
      return readdirSync(sessionEnvDir).length > 0;
    } catch {
      // ignore read errors
    }
  }

  return false;
}

function normalizeGeminiModel(model: string | undefined): string {
  if (!model) return process.env.GOOGLE_MODEL ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  if (model.startsWith("google/")) return model.slice("google/".length);
  return model.startsWith("gemini-") ? model : DEFAULT_GEMINI_MODEL;
}

function normalizeAnthropicModel(model: string | undefined): string {
  if (!model) return process.env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL;
  if (model.startsWith("anthropic/")) return model.slice("anthropic/".length);
  return model.startsWith("claude-") ? model : DEFAULT_ANTHROPIC_MODEL;
}

/**
 * Detect which auth mode to use for the agent, in priority order:
 * 1. ANTHROPIC_API_KEY env var -> API key mode
 * 2. Claude credentials file exists -> Claude subscription mode
 * 3. GOOGLE_AI_KEY env var -> Gemini fallback
 * 4. Throw: no auth configured
 */
export function detectAuthMode(overrides?: AuthOverrides): AgentConfig {
  const anthropicKey = overrides?.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY;
  const googleKey =
    overrides?.googleApiKey ??
    process.env.GOOGLE_AI_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GEMINI_API_KEY;
  const preferredProvider = overrides?.preferredProvider;

  // Respect explicit Google provider selection from user settings.
  if (preferredProvider === "google") {
    if (!googleKey) {
      throw new Error("Google Gemini selected, but no Google AI key was provided.");
    }
    return {
      mode: "gemini",
      model: normalizeGeminiModel(overrides?.preferredModel),
      googleApiKey: googleKey,
    };
  }

  // Respect explicit Anthropic provider selection from user settings.
  if (preferredProvider === "anthropic") {
    if (anthropicKey) {
      return {
        mode: "api-key",
        model: normalizeAnthropicModel(overrides?.preferredModel),
        anthropicApiKey: anthropicKey,
        ...(googleKey ? { googleApiKey: googleKey } : {}),
      };
    }

    if (hasClaudeCredentials()) {
      return {
        mode: "subscription",
        model: normalizeAnthropicModel(overrides?.preferredModel),
        ...(googleKey ? { googleApiKey: googleKey } : {}),
      };
    }

    if (googleKey) {
      return {
        mode: "gemini",
        model: normalizeGeminiModel(undefined),
        googleApiKey: googleKey,
      };
    }

    throw new Error("Anthropic selected, but no API key or local Claude subscription session was found.");
  }

  // Priority 1: explicit API key
  if (anthropicKey) {
    return {
      mode: "api-key",
      model: normalizeAnthropicModel(overrides?.preferredModel),
      anthropicApiKey: anthropicKey,
      ...(googleKey ? { googleApiKey: googleKey } : {}),
    };
  }

  // Priority 2: Claude Code subscription session
  if (hasClaudeCredentials()) {
    return {
      mode: "subscription",
      model: normalizeAnthropicModel(overrides?.preferredModel),
      ...(googleKey ? { googleApiKey: googleKey } : {}),
    };
  }

  // Priority 3: Google AI (Gemini)
  if (googleKey) {
    return {
      mode: "gemini",
      model: normalizeGeminiModel(overrides?.preferredModel),
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
 */
export function getAgentEnv(config: AgentConfig): Record<string, string> {
  if (config.mode === "api-key" && config.anthropicApiKey) {
    return { ANTHROPIC_API_KEY: config.anthropicApiKey };
  }
  if (config.mode === "gemini" && config.googleApiKey) {
    return {
      GOOGLE_AI_KEY: config.googleApiKey,
      GOOGLE_API_KEY: config.googleApiKey,
      GEMINI_API_KEY: config.googleApiKey,
    };
  }
  // Subscription mode auto-reads Claude credentials from the Claude config dir.
  return {};
}

export function getStatusInfo(config: AgentConfig) {
  const hasGeminiFallback = config.mode !== "gemini" && !!config.googleApiKey;
  return {
    mode: config.mode as AuthMode,
    model: config.model,
    description:
      config.mode === "subscription"
        ? hasGeminiFallback
          ? "Using Claude subscription (local session) with Gemini fallback"
          : "Using Claude subscription (local session)"
        : config.mode === "api-key"
          ? hasGeminiFallback
            ? "Using Anthropic API key with Gemini fallback"
            : "Using Anthropic API key"
          : "Using Google Gemini 3 Flash",
  };
}
