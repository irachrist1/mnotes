import { test } from "node:test";
import assert from "node:assert/strict";

import {
  parseAgentState,
  parseFinalPayload,
  parsePlan,
  parseStepPayload,
} from "../convex/ai/taskAgentParsing";

test("parsePlan extracts planSteps from JSON", () => {
  const raw = `here\n{ "planSteps": ["A", " B ", "", "C"] }\nbye`;
  assert.deepEqual(parsePlan(raw), ["A", "B", "C"]);
});

test("parsePlan returns [] on invalid JSON", () => {
  assert.deepEqual(parsePlan("not json"), []);
  assert.deepEqual(parsePlan("{oops"), []);
});

test("parseStepPayload prefers JSON fields when present", () => {
  const raw = `x { "stepSummary": "done", "stepOutputMarkdown": "### hi" } y`;
  assert.deepEqual(parseStepPayload(raw), { stepSummary: "done", stepOutputMarkdown: "### hi" });
});

test("parseStepPayload falls back to raw trimmed if JSON missing", () => {
  assert.deepEqual(parseStepPayload("  hello  "), { stepSummary: "", stepOutputMarkdown: "hello" });
});

test("parseFinalPayload uses raw when JSON missing", () => {
  const payload = parseFinalPayload("not json", "fallback");
  assert.equal(payload.resultMarkdown, "not json");
  assert.ok(payload.summary.length > 0);
});

test("parseAgentState returns null for empty or invalid state", () => {
  assert.equal(parseAgentState(null), null);
  assert.equal(parseAgentState(""), null);
  assert.equal(parseAgentState("{\"v\":2}"), null);
});

test("parseAgentState parses waiting fields", () => {
  const state = parseAgentState(JSON.stringify({
    v: 1,
    stepIndex: 2,
    planSteps: ["a", "b"],
    waitingForEventId: "evt",
    waitingForKind: "approval",
    approvedTools: { web_search: true },
    deniedTools: { send_email: true },
  }));
  assert.deepEqual(state, {
    v: 1,
    stepIndex: 2,
    planSteps: ["a", "b"],
    waitingForEventId: "evt",
    waitingForKind: "approval",
    approvedTools: { web_search: true },
    deniedTools: { send_email: true },
  });
});
