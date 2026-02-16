export type AgentPayload = {
  planSteps: string[];
  summary: string;
  resultMarkdown: string;
};

export type AgentState = {
  v: 1;
  stepIndex: number;
  planSteps: string[];
  waitingForEventId?: string;
  waitingForKind?: "question" | "approval";
  approvedTools?: Record<string, true>;
  deniedTools?: Record<string, true>;
};

export function shouldYieldAgentRun(args: {
  elapsedMs: number;
  stepsCompleted: number;
  maxElapsedMs: number;
  maxStepsPerRun: number;
}): boolean {
  const elapsedMs = Math.max(0, Math.floor(args.elapsedMs));
  const stepsCompleted = Math.max(0, Math.floor(args.stepsCompleted));
  const maxElapsedMs = Math.max(1, Math.floor(args.maxElapsedMs));
  const maxStepsPerRun = Math.max(1, Math.floor(args.maxStepsPerRun));
  return elapsedMs >= maxElapsedMs || stepsCompleted >= maxStepsPerRun;
}

function parseJsonCandidate(raw: string): string | null {
  const trimmed = (raw || "").trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return trimmed.slice(first, last + 1);
}

export function parsePlan(raw: string): string[] {
  const candidate = parseJsonCandidate(raw);
  if (!candidate) return [];
  try {
    const obj = JSON.parse(candidate) as { planSteps?: unknown };
    if (!Array.isArray(obj.planSteps)) return [];
    return obj.planSteps.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 7);
  } catch {
    return [];
  }
}

export function parseStepPayload(raw: string): { stepSummary: string; stepOutputMarkdown: string } {
  const candidate = parseJsonCandidate(raw);
  if (!candidate) {
    return { stepSummary: "", stepOutputMarkdown: (raw || "").trim() };
  }
  try {
    const obj = JSON.parse(candidate) as any;
    return {
      stepSummary: typeof obj.stepSummary === "string" ? obj.stepSummary : "",
      stepOutputMarkdown: typeof obj.stepOutputMarkdown === "string" ? obj.stepOutputMarkdown : (raw || "").trim(),
    };
  } catch {
    return { stepSummary: "", stepOutputMarkdown: (raw || "").trim() };
  }
}

export function parseFinalPayload(raw: string, fallbackMarkdown: string): AgentPayload {
  const candidate = parseJsonCandidate(raw);
  if (!candidate) {
    return { planSteps: [], summary: "Output ready to review.", resultMarkdown: (raw || "").trim() || fallbackMarkdown };
  }
  try {
    const obj = JSON.parse(candidate) as any;
    return {
      planSteps: [],
      summary: typeof obj.summary === "string" ? obj.summary : "Output ready to review.",
      resultMarkdown: typeof obj.resultMarkdown === "string" ? obj.resultMarkdown : (fallbackMarkdown || (raw || "").trim()),
    };
  } catch {
    return { planSteps: [], summary: "Output ready to review.", resultMarkdown: fallbackMarkdown || (raw || "").trim() };
  }
}

export function parseAgentState(raw: unknown): AgentState | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  try {
    const obj = JSON.parse(raw) as any;
    if (obj?.v !== 1) return null;
    if (!Array.isArray(obj.planSteps)) return null;
    if (typeof obj.stepIndex !== "number") return null;
    const waitingForKind =
      obj.waitingForKind === "question" || obj.waitingForKind === "approval"
        ? (obj.waitingForKind as AgentState["waitingForKind"])
        : undefined;

    let approvedTools: Record<string, true> | undefined;
    if (obj.approvedTools && typeof obj.approvedTools === "object") {
      approvedTools = {};
      for (const [k, v] of Object.entries(obj.approvedTools as Record<string, unknown>)) {
        if (typeof k === "string" && v === true) approvedTools[k] = true;
      }
      if (Object.keys(approvedTools).length === 0) approvedTools = undefined;
    }

    let deniedTools: Record<string, true> | undefined;
    if (obj.deniedTools && typeof obj.deniedTools === "object") {
      deniedTools = {};
      for (const [k, v] of Object.entries(obj.deniedTools as Record<string, unknown>)) {
        if (typeof k === "string" && v === true) deniedTools[k] = true;
      }
      if (Object.keys(deniedTools).length === 0) deniedTools = undefined;
    }
    return {
      v: 1,
      stepIndex: Math.max(0, Math.floor(obj.stepIndex)),
      planSteps: obj.planSteps.map(String).filter(Boolean).slice(0, 10),
      waitingForEventId: typeof obj.waitingForEventId === "string" ? obj.waitingForEventId : undefined,
      waitingForKind,
      approvedTools,
      deniedTools,
    };
  } catch {
    return null;
  }
}
