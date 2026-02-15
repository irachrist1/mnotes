/* eslint-disable no-console */
const assert = require("assert/strict");
const path = require("path");

function run() {
  const parsing = require(path.join(
    process.cwd(),
    "dist-coretests",
    "convex",
    "ai",
    "taskAgentParsing.js"
  ));

  const { parseAgentState, parseFinalPayload, parsePlan, parseStepPayload } = parsing;

  // parsePlan
  assert.deepEqual(parsePlan(`x\n{ "planSteps": ["A", " B ", "", "C"] }\ny`), ["A", "B", "C"]);
  assert.deepEqual(parsePlan("not json"), []);

  // parseStepPayload
  assert.deepEqual(parseStepPayload(`x { "stepSummary": "done", "stepOutputMarkdown": "### hi" } y`), {
    stepSummary: "done",
    stepOutputMarkdown: "### hi",
  });
  assert.deepEqual(parseStepPayload("  hello  "), { stepSummary: "", stepOutputMarkdown: "hello" });

  // parseFinalPayload
  const p = parseFinalPayload("not json", "fallback");
  assert.equal(p.resultMarkdown, "not json");

  // parseAgentState
  assert.equal(parseAgentState(null), null);
  assert.equal(parseAgentState(""), null);
  assert.equal(parseAgentState('{"v":2}'), null);
  assert.deepEqual(parseAgentState(JSON.stringify({
    v: 1,
    stepIndex: 2,
    planSteps: ["a", "b"],
    waitingForEventId: "evt",
    waitingForKind: "approval",
    approvedTools: { web_search: true },
    deniedTools: { send_email: true },
  })), {
    v: 1,
    stepIndex: 2,
    planSteps: ["a", "b"],
    waitingForEventId: "evt",
    waitingForKind: "approval",
    approvedTools: { web_search: true },
    deniedTools: { send_email: true },
  });

  console.log("[coretests] ok");
}

try {
  run();
} catch (err) {
  console.error("[coretests] failed:", err && err.stack ? err.stack : err);
  process.exitCode = 1;
}
