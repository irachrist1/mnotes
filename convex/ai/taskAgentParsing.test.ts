import { describe, it, expect } from "vitest";
import {
  parseAgentState,
  parseFinalPayload,
  parsePlan,
  parseStepPayload,
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
});

