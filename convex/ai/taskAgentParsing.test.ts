import { describe, it, expect } from "vitest";
import {
  compactTextForPrompt,
  parseAgentState,
  parseFinalPayload,
  parsePlan,
  parseStepPayload,
  shouldYieldAgentRun,
} from "./taskAgentParsing";

describe("taskAgentParsing", () => {
  it("parsePlan extracts planSteps from JSON", () => {
    const raw = `here\n{ "planSteps": ["A", " B ", "", "C"] }\nbye`;
    expect(parsePlan(raw)).toEqual(["A", "B", "C"]);
  });

  it("parsePlan returns [] on invalid JSON", () => {
    expect(parsePlan("not json")).toEqual([]);
    expect(parsePlan("{oops")).toEqual([]);
  });

  it("parseStepPayload prefers JSON fields when present", () => {
    const raw = `x { "stepSummary": "done", "stepOutputMarkdown": "### hi" } y`;
    expect(parseStepPayload(raw)).toEqual({ stepSummary: "done", stepOutputMarkdown: "### hi" });
  });

  it("parseStepPayload falls back to raw trimmed if JSON missing", () => {
    expect(parseStepPayload("  hello  ")).toEqual({ stepSummary: "", stepOutputMarkdown: "hello" });
  });

  it("parseFinalPayload uses fallbackMarkdown when JSON missing", () => {
    const payload = parseFinalPayload("not json", "fallback");
    expect(payload.resultMarkdown).toBe("not json");
    expect(payload.summary).toBeTruthy();
  });

  it("parseAgentState returns null for empty or invalid state", () => {
    expect(parseAgentState(null)).toBeNull();
    expect(parseAgentState("")).toBeNull();
    expect(parseAgentState("{\"v\":2}")).toBeNull();
  });

  it("parseAgentState parses waiting fields", () => {
    const state = parseAgentState(JSON.stringify({
      v: 1,
      stepIndex: 2,
      planSteps: ["a", "b"],
      waitingForEventId: "evt",
      waitingForKind: "approval",
    }));
    expect(state).toEqual({
      v: 1,
      stepIndex: 2,
      planSteps: ["a", "b"],
      waitingForEventId: "evt",
      waitingForKind: "approval",
    });
  });

  it("shouldYieldAgentRun yields by step count or elapsed budget", () => {
    expect(shouldYieldAgentRun({
      elapsedMs: 1000,
      stepsCompleted: 1,
      maxElapsedMs: 10_000,
      maxStepsPerRun: 2,
    })).toBe(false);

    expect(shouldYieldAgentRun({
      elapsedMs: 1000,
      stepsCompleted: 2,
      maxElapsedMs: 10_000,
      maxStepsPerRun: 2,
    })).toBe(true);

    expect(shouldYieldAgentRun({
      elapsedMs: 11_000,
      stepsCompleted: 0,
      maxElapsedMs: 10_000,
      maxStepsPerRun: 2,
    })).toBe(true);
  });

  it("compactTextForPrompt keeps start and end when truncating", () => {
    const raw = "A".repeat(180) + "B".repeat(180);
    const compact = compactTextForPrompt(raw, 220);
    expect(compact.length).toBeLessThanOrEqual(260);
    expect(compact.includes("[omitted for context]")).toBe(true);
    expect(compact.startsWith("A")).toBe(true);
    expect(compact.endsWith("B")).toBe(true);
  });
});
