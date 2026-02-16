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

  const outputFormats = require(path.join(
    process.cwd(),
    "dist-coretests",
    "src",
    "lib",
    "outputFormats.js"
  ));

  const googleScopes = require(path.join(
    process.cwd(),
    "dist-coretests",
    "convex",
    "connectors",
    "googleScopes.js"
  ));

  const {
    parseAgentState,
    parseFinalPayload,
    parsePlan,
    parseStepPayload,
    shouldYieldAgentRun,
    compactTextForPrompt,
  } = parsing;
  const { parseTaskOutput, serializeChecklist } = outputFormats;
  const { hasAnyScope, requiredScopesForTool, GOOGLE_SCOPES } = googleScopes;

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
    contextSummary: "done step 1",
    waitingForEventId: "evt",
    waitingForKind: "approval",
    approvedTools: { web_search: true },
    deniedTools: { send_email: true },
  })), {
    v: 1,
    stepIndex: 2,
    planSteps: ["a", "b"],
    contextSummary: "done step 1",
    waitingForEventId: "evt",
    waitingForKind: "approval",
    approvedTools: { web_search: true },
    deniedTools: { send_email: true },
  });

  assert.equal(shouldYieldAgentRun({
    elapsedMs: 1000,
    stepsCompleted: 1,
    maxElapsedMs: 10000,
    maxStepsPerRun: 2,
  }), false);
  assert.equal(shouldYieldAgentRun({
    elapsedMs: 1000,
    stepsCompleted: 2,
    maxElapsedMs: 10000,
    maxStepsPerRun: 2,
  }), true);
  assert.equal(shouldYieldAgentRun({
    elapsedMs: 15000,
    stepsCompleted: 0,
    maxElapsedMs: 10000,
    maxStepsPerRun: 2,
  }), true);

  const compacted = compactTextForPrompt("A".repeat(200) + "B".repeat(200), 220);
  assert.equal(compacted.includes("[omitted for context]"), true);
  assert.equal(compacted.startsWith("A"), true);
  assert.equal(compacted.endsWith("B"), true);

  // output formats
  const parsed1 = parseTaskOutput("- [ ] a\n- [x] b\n");
  assert.equal(parsed1.type, "checklist");
  assert.deepEqual(parsed1.items, [{ text: "a", checked: false }, { text: "b", checked: true }]);
  const md1 = serializeChecklist({ items: parsed1.items });
  assert.ok(md1.includes("- [ ] a"));
  assert.ok(md1.includes("- [x] b"));

  const parsed2 = parseTaskOutput("hello\n- [ ] only one\n");
  assert.equal(parsed2.type, "markdown");

  const parsedText = parseTaskOutput("Just text\nSecond line\n");
  assert.equal(parsedText.type, "plaintext");

  const tableRaw = [
    "Intro",
    "",
    "| Name | Value |",
    "| --- | --- |",
    "| A | 1 |",
    "| B | 2 |",
    "",
    "Outro",
  ].join("\n");
  const parsed3 = parseTaskOutput(tableRaw);
  assert.equal(parsed3.type, "table");
  assert.deepEqual(parsed3.header, ["Name", "Value"]);
  assert.equal(parsed3.rows.length, 2);

  // google scopes helpers
  assert.deepEqual(requiredScopesForTool("calendar_create_event"), [GOOGLE_SCOPES.calendarFull]);
  assert.equal(hasAnyScope([GOOGLE_SCOPES.calendarReadonly], requiredScopesForTool("calendar_find_free_slots")), true);
  assert.equal(hasAnyScope([GOOGLE_SCOPES.gmailReadonly], requiredScopesForTool("gmail_list_recent")), true);
  assert.equal(hasAnyScope([GOOGLE_SCOPES.gmailReadonly], requiredScopesForTool("gmail_search_messages")), true);
  assert.equal(hasAnyScope([GOOGLE_SCOPES.gmailReadonly], requiredScopesForTool("gmail_send_email")), false);

  console.log("[coretests] ok");
}

try {
  run();
} catch (err) {
  console.error("[coretests] failed:", err && err.stack ? err.stack : err);
  process.exitCode = 1;
}
