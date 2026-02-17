import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { detectAuthMode, getAgentEnv, getStatusInfo } from "./auth";

const ORIGINAL_ENV = process.env;
let tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "jarvis-auth-"));
  tempDirs.push(dir);
  return dir;
}

describe("agent auth detection", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_MODEL;
    delete process.env.GOOGLE_AI_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_MODEL;
    delete process.env.GEMINI_MODEL;
    delete process.env.CLAUDE_CONFIG_DIR;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];
  });

  it("prefers ANTHROPIC_API_KEY over other auth sources", () => {
    const claudeDir = createTempDir();
    writeFileSync(join(claudeDir, ".credentials.json"), "{}", "utf8");

    process.env.ANTHROPIC_API_KEY = "anth-key";
    process.env.GOOGLE_AI_KEY = "google-key";
    process.env.CLAUDE_CONFIG_DIR = claudeDir;

    const config = detectAuthMode();

    expect(config.mode).toBe("api-key");
    expect(config.anthropicApiKey).toBe("anth-key");
    expect(config.googleApiKey).toBe("google-key");
    expect(config.model).toBe("claude-sonnet-4-5-20250929");
  });

  it("detects Claude subscription with .credentials.json", () => {
    const claudeDir = createTempDir();
    writeFileSync(join(claudeDir, ".credentials.json"), "{}", "utf8");
    process.env.CLAUDE_CONFIG_DIR = claudeDir;

    const config = detectAuthMode();

    expect(config.mode).toBe("subscription");
    expect(config.model).toBe("claude-sonnet-4-5-20250929");
  });

  it("detects Claude subscription with legacy credentials.json", () => {
    const claudeDir = createTempDir();
    writeFileSync(join(claudeDir, "credentials.json"), "{}", "utf8");
    process.env.CLAUDE_CONFIG_DIR = claudeDir;

    const config = detectAuthMode();

    expect(config.mode).toBe("subscription");
    expect(config.model).toBe("claude-sonnet-4-5-20250929");
  });

  it("falls back to Gemini 3 Flash when GOOGLE_AI_KEY is set", () => {
    process.env.CLAUDE_CONFIG_DIR = createTempDir();
    process.env.GOOGLE_AI_KEY = "google-key";

    const config = detectAuthMode();

    expect(config.mode).toBe("gemini");
    expect(config.googleApiKey).toBe("google-key");
    expect(config.model).toBe("gemini-3-flash-preview");
  });

  it("accepts GOOGLE_API_KEY alias for Gemini auth", () => {
    process.env.CLAUDE_CONFIG_DIR = createTempDir();
    process.env.GOOGLE_API_KEY = "google-key";

    const config = detectAuthMode();

    expect(config.mode).toBe("gemini");
    expect(config.googleApiKey).toBe("google-key");
  });

  it("returns env override only for api-key mode", () => {
    expect(getAgentEnv({ mode: "subscription", model: "claude-sonnet-4-5-20250929" })).toEqual({});
    expect(
      getAgentEnv({
        mode: "api-key",
        model: "claude-sonnet-4-5-20250929",
        anthropicApiKey: "anth-key",
      })
    ).toEqual({ ANTHROPIC_API_KEY: "anth-key" });
    expect(
      getAgentEnv({
        mode: "gemini",
        model: "gemini-3-flash-preview",
        googleApiKey: "google-key",
      })
    ).toEqual({
      GOOGLE_AI_KEY: "google-key",
      GOOGLE_API_KEY: "google-key",
      GEMINI_API_KEY: "google-key",
    });
  });

  it("respects explicit google provider override and normalizes google/ model ids", () => {
    const config = detectAuthMode({
      preferredProvider: "google",
      preferredModel: "google/gemini-3-flash-preview",
      googleApiKey: "google-key",
    });

    expect(config.mode).toBe("gemini");
    expect(config.googleApiKey).toBe("google-key");
    expect(config.model).toBe("gemini-3-flash-preview");
  });

  it("respects explicit anthropic provider override and normalizes anthropic/ model ids", () => {
    const config = detectAuthMode({
      preferredProvider: "anthropic",
      preferredModel: "anthropic/claude-sonnet-4-5-20250929",
      anthropicApiKey: "anth-key",
    });

    expect(config.mode).toBe("api-key");
    expect(config.anthropicApiKey).toBe("anth-key");
    expect(config.model).toBe("claude-sonnet-4-5-20250929");
  });

  it("falls back to Gemini when anthropic is preferred but unavailable", () => {
    process.env.CLAUDE_CONFIG_DIR = createTempDir();

    const config = detectAuthMode({
      preferredProvider: "anthropic",
      googleApiKey: "google-key",
    });

    expect(config.mode).toBe("gemini");
    expect(config.googleApiKey).toBe("google-key");
    expect(config.model).toBe("gemini-3-flash-preview");
  });

  it("reports status with Gemini fallback when both providers are configured", () => {
    const status = getStatusInfo({
      mode: "api-key",
      model: "claude-sonnet-4-5-20250929",
      anthropicApiKey: "anth-key",
      googleApiKey: "google-key",
    });

    expect(status.description).toContain("Gemini fallback");
  });
});
