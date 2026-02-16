"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { captureAiGeneration, captureEvent } from "../lib/posthog";
import Anthropic from "@anthropic-ai/sdk";

import { getBuiltInToolDefs, executeTool } from "./agentTools";
import { callChat, resolveApiKeyFromSettings, type AiProvider } from "./llm";
import {
  compactTextForPrompt,
  parseAgentState,
  parseFinalPayload,
  parsePlan,
  parseStepPayload,
  shouldYieldAgentRun,
  type AgentPayload,
  type AgentState,
} from "./taskAgentParsing";

// AgentPayload/AgentState live in taskAgentParsing.ts (kept pure for testing).
const MAX_AGENT_RUN_ELAPSED_MS = 210_000;
const MAX_AGENT_STEPS_PER_RUN = 2;

export const start = action({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    const task = await ctx.runQuery(internal.tasks.getInternal, {
      id: args.taskId,
      userId,
    });
    if (!task) return { started: false, error: "Task not found" };

    const now = Date.now();
    await ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId,
      id: args.taskId,
      agentStatus: "queued",
      agentProgress: 3,
      agentPhase: "Queued",
      agentStartedAt: now,
      agentCompletedAt: undefined,
      agentError: undefined,
      agentSummary: undefined,
      agentPlan: undefined,
      agentResult: undefined,
      agentState: undefined,
    });

    await ctx.runMutation(internal.taskEvents.clearForTaskInternal, {
      userId,
      taskId: args.taskId,
    });
    await ctx.runMutation(internal.taskEvents.addInternal, {
      userId,
      taskId: args.taskId,
      kind: "status",
      title: "Queued",
      detail: "Agent is about to start.",
      progress: 3,
    });

    await ctx.runMutation(internal.notifications.createInternal, {
      userId,
      type: "agent-task",
      title: "Agent restarted a task",
      body: `Working on: ${task.title}`,
      actionUrl: `/dashboard/data?tab=tasks&taskId=${String(args.taskId)}`,
    });

    await ctx.scheduler.runAfter(0, internal.ai.taskAgent.runInternal, {
      userId,
      taskId: args.taskId,
    });

    return { started: true };
  },
});

export const runInternal = internalAction({
  args: { userId: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await runFromTaskState(ctx, args, { resume: false });
  },
});

export const continueInternal = internalAction({
  args: { userId: v.string(), taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    await runFromTaskState(ctx, args, { resume: true });
  },
});

async function runFromTaskState(
  ctx: any,
  args: { userId: string; taskId: any },
  opts: { resume: boolean }
) {
  const runStartedAt = Date.now();
  let stepsCompletedThisRun = 0;

  const [task, settings, soulFile] = await Promise.all([
    ctx.runQuery(internal.tasks.getInternal, { id: args.taskId, userId: args.userId }),
    ctx.runQuery(internal.userSettings.getForUser, { userId: args.userId }),
    ctx.runQuery(internal.soulFile.getByUserId, { userId: args.userId }),
  ]);

  if (!task) return;

  const now = Date.now();
  await ctx.runMutation(internal.tasks.patchAgentInternal, {
    userId: args.userId,
    id: args.taskId,
    agentStatus: "running",
    agentProgress: 8,
    agentPhase: opts.resume ? "Resuming" : "Planning",
    agentError: undefined,
    agentCompletedAt: undefined,
  });

  await ctx.runMutation(internal.taskEvents.addInternal, {
    userId: args.userId,
    taskId: args.taskId,
    kind: "progress",
    title: opts.resume ? "Resuming" : "Planning",
    detail: opts.resume ? "Picking up where we left off." : "Breaking the work into steps.",
    progress: 8,
  });

  if (!settings) {
    await fail(ctx, args.userId, args.taskId, task, "Please configure AI settings first.");
    return;
  }

  // Respect the user's selected provider. Tool-use loop is only implemented for Anthropic currently.
  const provider: AiProvider = settings.aiProvider as AiProvider;

  const { apiKey, missingReason } = resolveApiKeyFromSettings({
    aiProvider: provider,
    openrouterApiKey: settings.openrouterApiKey,
    googleApiKey: settings.googleApiKey,
    anthropicApiKey: (settings as any).anthropicApiKey,
  });

  if (!apiKey) {
    await fail(ctx, args.userId, args.taskId, task, missingReason ?? "No API key configured (Settings).");
    return;
  }

  const model = normalizeModelForProvider(provider, settings.aiModel);

  const baseSystem = buildAgentSystemPrompt();
  const taskBlock = `## Task\nTitle: ${task.title}\nNote: ${task.note ?? "(none)"}`;
  const soulExcerpt = compactTextForPrompt(soulFile?.content ?? "", 7000);

  let planSteps: string[] = Array.isArray(task.agentPlan) ? task.agentPlan : [];
  let stepIndex = 0;
  let contextSummary = "";
  let waitingForEventId: string | undefined;
  let waitingForKind: AgentState["waitingForKind"] | undefined;
  let approvedTools: Record<string, true> = {};
  let deniedTools: Record<string, true> = {};
  let resumeClarification: string | null = null;

  if (opts.resume) {
    const state = parseAgentState(task.agentState);
    if (!state) {
      await fail(ctx, args.userId, args.taskId, task, "Cannot resume: missing agent state.");
      return;
    }
    planSteps = state.planSteps;
    stepIndex = state.stepIndex;
    contextSummary = state.contextSummary ?? "";
    waitingForEventId = state.waitingForEventId;
    waitingForKind = state.waitingForKind;
    approvedTools = state.approvedTools ?? {};
    deniedTools = state.deniedTools ?? {};

    if (waitingForEventId) {
      const found = await ctx.runQuery(internal.taskEvents.getInternal, {
        userId: args.userId,
        eventId: waitingForEventId as any,
      });
      if (!found) {
        await fail(ctx, args.userId, args.taskId, task, "Cannot resume: missing waiting event.");
        return;
      }

      if (found.kind === "question") {
        if (!found.answered || !found.answer) {
          await ctx.runMutation(internal.tasks.patchAgentInternal, {
            userId: args.userId,
            id: args.taskId,
            agentPhase: "Waiting for input",
          });
          return;
        }
        resumeClarification = `## Clarification\nQ: ${found.title}\nA: ${found.answer}`;
      } else if (found.kind === "approval-request") {
        if (found.approved === undefined) {
          await ctx.runMutation(internal.tasks.patchAgentInternal, {
            userId: args.userId,
            id: args.taskId,
            agentPhase: "Waiting for approval",
          });
          return;
        }
        const action = found.approvalAction ?? "(unknown)";
        const params = found.approvalParams ?? "";
        resumeClarification = `## Approval Decision\nAction: ${action}\nApproved: ${found.approved ? "yes" : "no"}\nParams: ${params || "(none)"}`;

        if (action && action !== "(unknown)") {
          if (found.approved) {
            approvedTools[action] = true;
            delete deniedTools[action];
          } else {
            deniedTools[action] = true;
            delete approvedTools[action];
          }
        }

        void captureEvent({
          distinctId: args.userId,
          event: "agent_approval_responded",
          properties: {
            taskId: String(args.taskId),
            action,
            approved: Boolean(found.approved),
          },
        });
      } else {
        await fail(ctx, args.userId, args.taskId, task, "Cannot resume: waiting event kind not supported.");
        return;
      }

      waitingForEventId = undefined;
      waitingForKind = undefined;

      // Persist cleared waiting state so repeated resumes don't re-check.
      await ctx.runMutation(internal.tasks.patchAgentInternal, {
        userId: args.userId,
        id: args.taskId,
        agentState: JSON.stringify({
          v: 1,
          stepIndex,
          planSteps,
          contextSummary,
          approvedTools,
          deniedTools,
        } satisfies AgentState),
      });
    }
  }

  const recentEventContext = await buildRecentEventContext(ctx, args.userId, args.taskId);

  // PLAN (run if missing, including after resuming from a planning pause).
  if (planSteps.length === 0) {
    await ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentProgress: 12,
      agentPhase: "Planning",
    });

    const planPrompt = `${taskBlock}\n\n## User Profile Excerpt\n${soulExcerpt || "(no profile found)"}\n\n${resumeClarification ? `${resumeClarification}\n\n` : ""}You MUST first call read_soul_file, list_tasks, and search_insights (q=task title) if relevant.\n\nReturn ONLY valid JSON: {\n  \"planSteps\": string[]\n}\nRules: 3-7 short user-facing steps.`;

    const t0 = Date.now();
    const planRun = provider === "anthropic"
      ? await runClaudeToolLoop({
        ctx,
        userId: args.userId,
        taskId: args.taskId,
        apiKey,
        model,
        system: baseSystem,
        userPrompt: planPrompt,
        maxTokens: 900,
        temperature: 0.2,
        toolCallBudget: 10,
      })
      : provider === "openrouter"
        ? await runOpenRouterToolLoop({
          ctx,
          userId: args.userId,
          taskId: args.taskId,
          apiKey,
          model,
          system: baseSystem,
          userPrompt: planPrompt,
          maxTokens: 900,
          temperature: 0.2,
          toolCallBudget: 10,
          title: "MNotes Agent Tasks",
        })
        : await runFallbackCall({
          ctx,
          userId: args.userId,
          taskId: args.taskId,
          provider,
          apiKey,
          model,
          system: baseSystem,
          userPrompt: planPrompt,
          temperature: 0.2,
          maxTokens: 900,
        });

    const planText = planRun.text;

    captureAiGeneration({
      distinctId: args.userId,
      model,
      provider,
      feature: "task-agent",
      latencySeconds: (Date.now() - t0) / 1000,
      input: [{ role: "system", content: baseSystem }, { role: "user", content: planPrompt }],
      output: planText,
    });

    if ((planRun as any).paused && (planRun as any).waitingForEventId) {
      const paused = planRun as any;
      const phase = paused.pauseReason === "approval" ? "Waiting for approval" : "Waiting for input";
      await ctx.runMutation(internal.tasks.patchAgentInternal, {
        userId: args.userId,
        id: args.taskId,
        agentPhase: phase,
        agentState: JSON.stringify({
          v: 1,
          stepIndex: 0,
          planSteps: [],
          contextSummary,
          waitingForEventId: paused.waitingForEventId,
          waitingForKind: paused.pauseReason === "approval" ? "approval" : "question",
          approvedTools,
          deniedTools,
        } satisfies AgentState),
      });

      await ctx.runMutation(internal.taskEvents.addInternal, {
        userId: args.userId,
        taskId: args.taskId,
        kind: "status",
        title: phase,
        detail: paused.pauseReason === "approval"
          ? "Approve or deny to continue."
          : "Answer the question to resume.",
        progress: 12,
      });
      return;
    }

    const parsedPlan = parsePlan(planText);
    planSteps = parsedPlan.length ? parsedPlan : ["Gather context", "Draft output", "Review and deliver"];

    await ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentPlan: planSteps,
      agentProgress: 20,
      agentPhase: "Plan ready",
    });

    await ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "status",
      title: "Plan ready",
      detail: `Planned ${planSteps.length} steps.`,
      progress: 20,
    });
  }

  // EXECUTE
  const total = Math.max(1, planSteps.length);
  for (let i = stepIndex; i < planSteps.length; i++) {
    const step = planSteps[i];
    const pct = 20 + Math.round(((i + 1) / total) * 70);

    await ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentProgress: pct,
      agentPhase: `Step ${i + 1}/${total}: ${step}`,
      agentState: JSON.stringify({
        v: 1,
        stepIndex: i,
        planSteps,
        contextSummary,
        approvedTools,
        deniedTools,
      } satisfies AgentState),
    });

    await ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "progress",
      title: `Step ${i + 1}: ${step}`,
      detail: "Executing this step.",
      progress: pct,
    });

    // Slight pacing to make progress visible.
    await sleep(800);

    const existingOutput = (await ctx.runQuery(internal.tasks.getInternal, { id: args.taskId, userId: args.userId }))?.agentResult ?? "";
    const stepPrompt = `${taskBlock}\n\n## User Profile Excerpt\n${soulExcerpt || "(no profile found)"}\n\n## Plan\n${planSteps.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}\n\n## Context Summary So Far\n${contextSummary || "(none yet)"}\n\n## Recent Execution Signals\n${recentEventContext || "(none)"}\n\n## Current Step\n${i + 1}. ${step}\n\n## Output So Far (may be empty)\n${compactTextForPrompt(existingOutput, 6000) || "(none)"}\n\n${resumeClarification ? `${resumeClarification}\n\n` : ""}Use tools to look up the user's data as needed. If ambiguous, call ask_user. If you are producing a real deliverable (doc/checklist/table), prefer create_file.\n\nReturn ONLY valid JSON: {\n  \"stepSummary\": string,\n  \"stepOutputMarkdown\": string\n}`;

    const tStep0 = Date.now();
    const stepRun = provider === "anthropic"
      ? await runClaudeToolLoop({
        ctx,
        userId: args.userId,
        taskId: args.taskId,
        apiKey,
        model,
        system: baseSystem,
        userPrompt: stepPrompt,
        maxTokens: 1400,
        temperature: 0.25,
        toolCallBudget: 10,
      })
      : provider === "openrouter"
        ? await runOpenRouterToolLoop({
          ctx,
          userId: args.userId,
          taskId: args.taskId,
          apiKey,
          model,
          system: baseSystem,
          userPrompt: stepPrompt,
          temperature: 0.25,
          maxTokens: 1400,
          toolCallBudget: 10,
          title: "MNotes Agent Tasks",
        })
        : await runFallbackCall({
          ctx,
          userId: args.userId,
          taskId: args.taskId,
          provider,
          apiKey,
          model,
          system: baseSystem,
          userPrompt: stepPrompt,
          temperature: 0.25,
          maxTokens: 1400,
        });

    void captureAiGeneration({
      distinctId: args.userId,
      model,
      provider,
      feature: "task-agent",
      latencySeconds: (Date.now() - tStep0) / 1000,
      input: [{ role: "system", content: baseSystem }, { role: "user", content: stepPrompt.slice(0, 4000) }],
      output: stepRun.text.slice(0, 8000),
    });

    if (stepRun.paused && stepRun.waitingForEventId) {
      const phase = stepRun.pauseReason === "approval" ? "Waiting for approval" : "Waiting for input";
      await ctx.runMutation(internal.tasks.patchAgentInternal, {
        userId: args.userId,
        id: args.taskId,
        agentPhase: phase,
        agentState: JSON.stringify({
          v: 1,
          stepIndex: i,
          planSteps,
          contextSummary,
          waitingForEventId: stepRun.waitingForEventId,
          waitingForKind: stepRun.pauseReason === "approval" ? "approval" : "question",
          approvedTools,
          deniedTools,
        } satisfies AgentState),
      });

      await ctx.runMutation(internal.taskEvents.addInternal, {
        userId: args.userId,
        taskId: args.taskId,
        kind: "status",
        title: phase,
        detail: stepRun.pauseReason === "approval"
          ? "Approve or deny to continue."
          : "Answer the question to resume.",
        progress: pct,
      });

      return;
    }

    const stepPayload = parseStepPayload(stepRun.text);
    const stepOut = (stepPayload.stepOutputMarkdown || "").trim();
    const stepSummary = (stepPayload.stepSummary || "").trim();
    contextSummary = updateContextSummary(contextSummary, i + 1, step, stepSummary || "Completed");

    if (stepOut.length < 10) {
      await fail(ctx, args.userId, args.taskId, task, "Step output was empty.");
      return;
    }

    // Progressive output: append the step header immediately, then "type" the step output in chunks.
    const header = `### Step ${i + 1}: ${step}`;
    await progressiveAppendToAgentResult({
      ctx,
      userId: args.userId,
      taskId: args.taskId,
      existingOutput,
      headerMarkdown: header,
      bodyMarkdown: stepOut,
    });

    await ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentSummary: stepSummary || undefined,
      agentState: JSON.stringify({
        v: 1,
        stepIndex: i + 1,
        planSteps,
        contextSummary,
        approvedTools,
        deniedTools,
      } satisfies AgentState),
    });

    await ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "note",
      title: `Step ${i + 1} done`,
      detail: stepSummary || "Completed this step.",
      progress: pct,
    });

    stepsCompletedThisRun += 1;
    const shouldYield = shouldYieldAgentRun({
      elapsedMs: Date.now() - runStartedAt,
      stepsCompleted: stepsCompletedThisRun,
      maxElapsedMs: MAX_AGENT_RUN_ELAPSED_MS,
      maxStepsPerRun: MAX_AGENT_STEPS_PER_RUN,
    });
    if (shouldYield && i + 1 < planSteps.length) {
      await scheduleContinuation({
        ctx,
        userId: args.userId,
        taskId: args.taskId,
        stepIndex: i + 1,
        planSteps,
        contextSummary,
        approvedTools,
        deniedTools,
        progress: pct,
        detail: "Continuing in a new run to stay within runtime limits.",
      });
      return;
    }
  }

  const shouldYieldBeforeFinalize = shouldYieldAgentRun({
    elapsedMs: Date.now() - runStartedAt,
    stepsCompleted: stepsCompletedThisRun,
    maxElapsedMs: MAX_AGENT_RUN_ELAPSED_MS,
    maxStepsPerRun: MAX_AGENT_STEPS_PER_RUN,
  });
  if (shouldYieldBeforeFinalize && planSteps.length > 0) {
    await scheduleContinuation({
      ctx,
      userId: args.userId,
      taskId: args.taskId,
      stepIndex: planSteps.length,
      planSteps,
      contextSummary,
      approvedTools,
      deniedTools,
      progress: 95,
      detail: "Continuing in a new run before finalizing output.",
    });
    return;
  }

  // FINALIZE
  await ctx.runMutation(internal.tasks.patchAgentInternal, {
    userId: args.userId,
    id: args.taskId,
    agentProgress: 95,
    agentPhase: "Finalizing",
  });
  await ctx.runMutation(internal.taskEvents.addInternal, {
    userId: args.userId,
    taskId: args.taskId,
    kind: "progress",
    title: "Finalizing",
    detail: "Tidying output and writing a final summary.",
    progress: 95,
  });

  const current = await ctx.runQuery(internal.tasks.getInternal, { id: args.taskId, userId: args.userId });
  const draft = (current?.agentResult ?? "").trim();

  const finalPrompt = `${taskBlock}\n\n## Plan\n${planSteps.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}\n\n## Context Summary So Far\n${contextSummary || "(none yet)"}\n\n## Recent Execution Signals\n${recentEventContext || "(none)"}\n\n## Draft Output\n${compactTextForPrompt(draft, 12000) || "(none)"}\n\n${resumeClarification ? `${resumeClarification}\n\n` : ""}Return ONLY valid JSON with this shape:\n{\n  \"summary\": string,\n  \"resultMarkdown\": string\n}\nRules: resultMarkdown must be immediately usable, with checklists/tables when helpful. If you created agent files, include a short \"Files created\" section listing file titles and what each contains (do not paste the full file content).`;

  const tFinal0 = Date.now();
  const finalRun = provider === "anthropic"
    ? await runClaudeToolLoop({
      ctx,
      userId: args.userId,
      taskId: args.taskId,
      apiKey,
      model,
      system: baseSystem,
      userPrompt: finalPrompt,
      maxTokens: 1600,
      temperature: 0.2,
      toolCallBudget: 4,
    })
    : provider === "openrouter"
      ? await runOpenRouterToolLoop({
        ctx,
        userId: args.userId,
        taskId: args.taskId,
        apiKey,
        model,
        system: baseSystem,
        userPrompt: finalPrompt,
        temperature: 0.2,
        maxTokens: 1600,
        toolCallBudget: 6,
        title: "MNotes Agent Tasks",
      })
      : await runFallbackCall({
        ctx,
        userId: args.userId,
        taskId: args.taskId,
        provider,
        apiKey,
        model,
        system: baseSystem,
        userPrompt: finalPrompt,
        temperature: 0.2,
        maxTokens: 1600,
      });

  const finalText = finalRun.text;

  void captureAiGeneration({
    distinctId: args.userId,
    model,
    provider,
    feature: "task-agent",
    latencySeconds: (Date.now() - tFinal0) / 1000,
    input: [{ role: "system", content: baseSystem }, { role: "user", content: finalPrompt.slice(0, 4000) }],
    output: finalText.slice(0, 8000),
  });

  if ((finalRun as any).paused && (finalRun as any).waitingForEventId) {
    const paused = finalRun as any;
    const phase = paused.pauseReason === "approval" ? "Waiting for approval" : "Waiting for input";
    await ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentPhase: phase,
      agentState: JSON.stringify({
        v: 1,
        stepIndex: planSteps.length,
        planSteps,
        contextSummary,
        waitingForEventId: paused.waitingForEventId,
        waitingForKind: paused.pauseReason === "approval" ? "approval" : "question",
        approvedTools,
        deniedTools,
      } satisfies AgentState),
    });

    await ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "status",
      title: phase,
      detail: paused.pauseReason === "approval"
        ? "Approve or deny to continue."
        : "Answer the question to resume.",
      progress: 95,
    });
    return;
  }

  const finalPayload = parseFinalPayload(finalText, draft);

  if (!finalPayload.resultMarkdown || finalPayload.resultMarkdown.trim().length < 40) {
    await fail(ctx, args.userId, args.taskId, task, "Final output was too short.");
    return;
  }

  let finalMarkdown = finalPayload.resultMarkdown.trim();
  let streamed = false;
  if (provider === "openrouter" || provider === "anthropic") {
    try {
      const streamPrompt = `${taskBlock}\n\nPolish the markdown deliverable below for clarity while preserving all key details.\nReturn ONLY markdown (no JSON, no code fences).\n\n## Draft Markdown\n${compactTextForPrompt(finalMarkdown, 14000)}`;
      const streamedMarkdown = await streamFinalMarkdownToTask({
        ctx,
        userId: args.userId,
        taskId: args.taskId,
        provider,
        apiKey,
        model,
        system: baseSystem,
        userPrompt: streamPrompt,
        temperature: 0.15,
        maxTokens: 2200,
      });
      if (streamedMarkdown.trim().length >= 40) {
        finalMarkdown = streamedMarkdown.trim();
        streamed = true;
      }
    } catch (err) {
      console.error("[AGENT] Final streaming failed; falling back to chunk patch.", err);
    }
  }

  if (!streamed) {
    // Fallback: replace output in chunks.
    await progressiveReplaceAgentResult({
      ctx,
      userId: args.userId,
      taskId: args.taskId,
      markdown: finalMarkdown,
    });
  }

  await ctx.runMutation(internal.tasks.patchAgentInternal, {
    userId: args.userId,
    id: args.taskId,
    agentStatus: "succeeded",
    agentProgress: 100,
    agentPhase: "Ready",
    agentSummary: finalPayload.summary || "Output ready to review.",
    agentCompletedAt: Date.now(),
    agentError: undefined,
    agentState: undefined,
  });

  await ctx.runMutation(internal.taskEvents.addInternal, {
    userId: args.userId,
    taskId: args.taskId,
    kind: "result",
    title: "Output ready",
    detail: finalPayload.summary || "Review the output and decide what to do next.",
    progress: 100,
  });

  if (task.sourceType !== "ai-insight") {
    await ctx.runMutation(internal.notifications.createInternal, {
      userId: args.userId,
      type: "agent-task",
      title: "Agent finished a task",
      body: finalPayload.summary || `Finished: ${task.title}`,
      actionUrl: `/dashboard/data?tab=tasks&taskId=${String(args.taskId)}`,
    });
  }

  void captureEvent({
    distinctId: args.userId,
    event: "agent_task_succeeded",
    properties: {
      taskId: String(args.taskId),
      planSteps: planSteps.length,
      provider,
      model,
      streamedFinal: streamed,
    },
  });
}

async function progressiveAppendToAgentResult(args: {
  ctx: any;
  userId: string;
  taskId: any;
  existingOutput: string;
  headerMarkdown: string;
  bodyMarkdown: string;
}) {
  const base = [
    args.existingOutput.trim() ? args.existingOutput.trim() : null,
    args.headerMarkdown,
    "",
  ].filter(Boolean).join("\n\n");

  const body = args.bodyMarkdown.trim();
  const chunks = chunkText(body, 420, 28);

  // Patch the header first so the UI shows progress immediately.
  await args.ctx.runMutation(internal.tasks.patchAgentInternal, {
    userId: args.userId,
    id: args.taskId,
    agentResult: base,
  });

  let current = base;
  for (const c of chunks) {
    current = current.trimEnd() + "\n" + c;
    await args.ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentResult: current,
    });
    await sleep(70);
  }
}

async function progressiveReplaceAgentResult(args: {
  ctx: any;
  userId: string;
  taskId: any;
  markdown: string;
}) {
  const body = (args.markdown || "").trim();
  const chunks = chunkText(body, 520, 32);
  let current = "";
  for (const c of chunks) {
    current = current ? `${current}${c}` : c;
    await args.ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentResult: current,
    });
    await sleep(60);
  }
}

function chunkText(text: string, chunkSize: number, maxChunks: number): string[] {
  const t = String(text ?? "");
  if (!t) return [""];
  const size = Math.max(120, Math.min(2000, Math.floor(chunkSize)));
  const out: string[] = [];
  for (let i = 0; i < t.length; i += size) {
    out.push(t.slice(i, i + size));
    if (out.length >= maxChunks) {
      out[out.length - 1] = out[out.length - 1] + t.slice(i + size);
      break;
    }
  }
  return out;
}

async function buildRecentEventContext(ctx: any, userId: string, taskId: any): Promise<string> {
  const events = await ctx.runQuery(internal.taskEvents.listByTaskInternal, { userId, taskId });
  const lines = (Array.isArray(events) ? events : [])
    .slice(-12)
    .map((e: any) => {
      const kind = String(e?.kind ?? "");
      const title = String(e?.title ?? "").trim();
      const detail = String(e?.detail ?? "").trim();
      if (kind === "tool") {
        const toolName = String(e?.toolName ?? "").trim();
        const out = String(e?.toolOutput ?? "").trim();
        return toolName ? `tool ${toolName}: ${out || detail || title}` : null;
      }
      if (kind === "note" || kind === "status" || kind === "error") {
        return `${kind}: ${detail || title}`;
      }
      return null;
    })
    .filter(Boolean)
    .map(String);
  return compactTextForPrompt(lines.join("\n"), 1200);
}

async function streamFinalMarkdownToTask(args: {
  ctx: any;
  userId: string;
  taskId: any;
  provider: "openrouter" | "anthropic";
  apiKey: string;
  model: string;
  system: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}): Promise<string> {
  let acc = "";
  let lastFlushAt = 0;
  let lastFlushedLen = 0;

  const flush = async (force = false) => {
    const now = Date.now();
    const deltaLen = acc.length - lastFlushedLen;
    if (!force && deltaLen < 120 && now - lastFlushAt < 140) return;
    await args.ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentResult: acc,
    });
    lastFlushAt = now;
    lastFlushedLen = acc.length;
  };

  if (args.provider === "openrouter") {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
        "HTTP-Referer": "https://mnotes.app",
        "X-Title": "MNotes Agent Tasks",
      },
      body: JSON.stringify({
        model: args.model || "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: args.system },
          { role: "user", content: args.userPrompt },
        ],
        temperature: args.temperature,
        max_tokens: args.maxTokens,
        stream: true,
      }),
    });
    if (!response.ok || !response.body) {
      const text = await response.text();
      throw new Error(`OpenRouter stream error (${response.status}): ${text}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const lineRaw of lines) {
        const line = lineRaw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const obj = JSON.parse(payload) as any;
          const delta = obj?.choices?.[0]?.delta?.content;
          const token = typeof delta === "string" ? delta : "";
          if (!token) continue;
          acc += token;
          await flush(false);
        } catch {
          // Ignore malformed SSE fragments.
        }
      }
    }
    await flush(true);
    return acc;
  }

  const client = new Anthropic({ apiKey: args.apiKey });
  const stream = (await client.messages.create({
    model: args.model,
    system: args.system,
    max_tokens: args.maxTokens,
    temperature: args.temperature,
    stream: true,
    messages: [{ role: "user", content: args.userPrompt }],
  })) as any;

  for await (const event of stream) {
    const type = String(event?.type ?? "");
    if (type === "content_block_delta" && event?.delta?.type === "text_delta") {
      const token = String(event?.delta?.text ?? "");
      if (!token) continue;
      acc += token;
      await flush(false);
    }
  }
  await flush(true);
  return acc;
}

async function runFallbackCall(args: {
  ctx: any;
  userId: string;
  taskId: any;
  provider: AiProvider;
  apiKey: string;
  model: string;
  system: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}): Promise<{ text: string; paused?: false }> {
  // Even without tool-use, do basic, visible data access as explicit tool events.
  const toolDefs = [
    { name: "read_soul_file", input: {} },
    { name: "list_tasks", input: { limit: 12, includeDone: false } },
  ];

  const toolOutputs: string[] = [];
  for (const tool of toolDefs) {
    await args.ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "tool",
      title: `Tool: ${tool.name}`,
      toolName: tool.name,
      toolInput: JSON.stringify(tool.input),
      detail: "Executing.",
    });

    const toolStart = Date.now();
    const res = await executeTool({
      ctx: args.ctx,
      userId: args.userId,
      taskId: args.taskId,
      name: tool.name,
      input: tool.input,
    });
    const durationMs = Date.now() - toolStart;

    toolOutputs.push(JSON.stringify(res.ok ? res.result : { error: res.error }));

    await args.ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "tool",
      title: `Tool result: ${tool.name}`,
      toolName: tool.name,
      toolOutput: res.ok ? (res.summary ?? "ok") : res.error,
      detail: `${res.ok ? (res.summary ?? "ok") : res.error} (${durationMs}ms)`,
    });
  }

  const augmented = `${args.userPrompt}\n\n## Tool Results (read-only)\n${toolOutputs.join("\n\n")}`;

  const res = await callChat({
    provider: args.provider,
    apiKey: args.apiKey,
    model: args.model,
    systemPrompt: args.system,
    messages: [{ role: "user", content: augmented }],
    temperature: args.temperature,
    maxTokens: args.maxTokens,
    title: "MNotes Agent Tasks",
  });

  return { text: res.content };
}

async function runClaudeToolLoop(args: {
  ctx: any;
  userId: string;
  taskId: any;
  apiKey: string;
  model: string;
  system: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  toolCallBudget: number;
}): Promise<{ text: string; paused?: boolean; waitingForEventId?: string; pauseReason?: "ask_user" | "approval" }> {
  const client = new Anthropic({ apiKey: args.apiKey });
  const tools = getBuiltInToolDefs() as any;

  const messages: any[] = [{ role: "user", content: args.userPrompt }];
  let toolCalls = 0;

  for (let iter = 0; iter < 12; iter++) {
    const msg = await client.messages.create({
      model: args.model,
      system: args.system,
      max_tokens: args.maxTokens,
      temperature: args.temperature,
      tools,
      messages,
    });

    const toolUses = msg.content.filter((p: any) => p.type === "tool_use") as any[];
    const text = msg.content
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");

    if (toolUses.length === 0) {
      return { text };
    }

    messages.push({ role: "assistant", content: msg.content });

    for (const tu of toolUses) {
      toolCalls++;
      if (toolCalls > args.toolCallBudget) {
        return { text: text || "{\"error\":\"Tool call limit exceeded\"}" };
      }

      const toolName = String(tu.name);
      const toolInput = tu.input ?? {};

      await args.ctx.runMutation(internal.taskEvents.addInternal, {
        userId: args.userId,
        taskId: args.taskId,
        kind: "tool",
        title: `Tool: ${toolName}`,
        toolName,
        toolInput: JSON.stringify(toolInput).slice(0, 4000),
        detail: "Executing.",
      });

      const startedAt = Date.now();
      const res = await executeTool({
        ctx: args.ctx,
        userId: args.userId,
        taskId: args.taskId,
        name: toolName,
        input: toolInput,
      });
      const durationMs = Date.now() - startedAt;

      await args.ctx.runMutation(internal.taskEvents.addInternal, {
        userId: args.userId,
        taskId: args.taskId,
        kind: "tool",
        title: `Tool result: ${toolName}`,
        toolName,
        toolOutput: res.ok ? (res.summary ?? "ok") : res.error,
        detail: `${res.ok ? (res.summary ?? "ok") : res.error} (${durationMs}ms)`,
      });

      const toolResultPayload = res.ok ? res.result : { error: res.error };
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(toolResultPayload),
          },
        ],
      });

      if (res.ok && (res as any).pause) {
        return {
          text,
          paused: true,
          waitingForEventId: (res as any).eventId,
          pauseReason: (res as any).pauseReason,
        };
      }
    }
  }

  return { text: "{\"error\":\"Exceeded iteration limit\"}" };
}

async function runOpenRouterToolLoop(args: {
  ctx: any;
  userId: string;
  taskId: any;
  apiKey: string;
  model: string;
  system: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  toolCallBudget: number;
  title: string;
}): Promise<{ text: string; paused?: boolean; waitingForEventId?: string; pauseReason?: "ask_user" | "approval" }> {
  const toolDefs = getBuiltInToolDefs();
  const tools = toolDefs.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));

  const messages: any[] = [
    { role: "system", content: args.system },
    { role: "user", content: args.userPrompt },
  ];

  let toolCalls = 0;

  for (let iter = 0; iter < 12; iter++) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
        "HTTP-Referer": "https://mnotes.app",
        "X-Title": args.title,
      },
      body: JSON.stringify({
        model: args.model || "google/gemini-3-flash-preview",
        messages,
        temperature: args.temperature,
        max_tokens: args.maxTokens,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { text: `{"error":"OpenRouter API error (${response.status}): ${errorText.replace(/\"/g, "\\\"")}"}` };
    }

    const data = (await response.json()) as any;
    const msg = data?.choices?.[0]?.message ?? {};
    const text = typeof msg.content === "string" ? msg.content : "";
    const toolUses = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];

    // Always preserve the assistant message, even if it contains tool calls.
    messages.push(msg);

    if (toolUses.length === 0) {
      return { text };
    }

    for (const tu of toolUses) {
      toolCalls++;
      if (toolCalls > args.toolCallBudget) {
        return { text: text || "{\"error\":\"Tool call limit exceeded\"}" };
      }

      const toolName = String(tu?.function?.name || "");
      const rawArgs = String(tu?.function?.arguments || "{}");
      let toolInput: any = {};
      try {
        toolInput = JSON.parse(rawArgs);
      } catch {
        toolInput = { __parseError: "Invalid JSON arguments", raw: rawArgs.slice(0, 2000) };
      }

      await args.ctx.runMutation(internal.taskEvents.addInternal, {
        userId: args.userId,
        taskId: args.taskId,
        kind: "tool",
        title: `Tool: ${toolName || "(unknown)"}`,
        toolName,
        toolInput: JSON.stringify(toolInput).slice(0, 4000),
        detail: "Executing.",
      });

      const startedAt = Date.now();
      const res = await executeTool({
        ctx: args.ctx,
        userId: args.userId,
        taskId: args.taskId,
        name: toolName,
        input: toolInput,
      });
      const durationMs = Date.now() - startedAt;

      await args.ctx.runMutation(internal.taskEvents.addInternal, {
        userId: args.userId,
        taskId: args.taskId,
        kind: "tool",
        title: `Tool result: ${toolName || "(unknown)"}`,
        toolName,
        toolOutput: res.ok ? (res.summary ?? "ok") : res.error,
        detail: `${res.ok ? (res.summary ?? "ok") : res.error} (${durationMs}ms)`,
      });

      const toolResultPayload = res.ok ? res.result : { error: res.error };
      const toolCallId = String(tu?.id || "");
      messages.push({
        role: "tool",
        tool_call_id: toolCallId,
        content: JSON.stringify(toolResultPayload).slice(0, 15000),
      });

      if (res.ok && (res as any).pause) {
        return {
          text,
          paused: true,
          waitingForEventId: (res as any).eventId,
          pauseReason: (res as any).pauseReason,
        };
      }
    }
  }

  return { text: "{\"error\":\"Exceeded iteration limit\"}" };
}

function buildAgentSystemPrompt(): string {
  return `You are Jarvis, an AI executive assistant inside MNotes.

You have access to tools that can read the user's stored data, create draft files, ask clarifying questions, and request approvals.

Rules:
- Always use tools to read the user's data instead of guessing.
- Be honest: never fabricate data.
- Prefer action over analysis.
- If the task is ambiguous, call ask_user with a concise question and 2-6 options.
- If you need to perform an irreversible or external action, call request_approval first.
- For public web research, you may use web_search and read_url (these will require user approval per task).
- For deliverables (docs/checklists/tables), prefer create_file instead of dumping huge text.
- Return ONLY valid JSON when the user prompt demands JSON.
- Produce outputs the user can use immediately (tables, checklists, structured docs when helpful).`;
}

function normalizeModelForProvider(provider: AiProvider, model: string | undefined): string {
  if (provider === "anthropic") {
    const candidate = (model || "").trim();
    if (candidate.startsWith("claude-")) return candidate;
    return "claude-sonnet-4-5-20250929";
  }
  if (provider === "google") {
    return model || "gemini-3-flash-preview";
  }
  return model || "google/gemini-3-flash-preview";
}

async function scheduleContinuation(args: {
  ctx: any;
  userId: string;
  taskId: any;
  stepIndex: number;
  planSteps: string[];
  contextSummary: string;
  approvedTools: Record<string, true>;
  deniedTools: Record<string, true>;
  progress: number;
  detail: string;
}) {
  await args.ctx.runMutation(internal.tasks.patchAgentInternal, {
    userId: args.userId,
    id: args.taskId,
    agentPhase: "Continuing",
    agentProgress: args.progress,
    agentState: JSON.stringify({
      v: 1,
      stepIndex: args.stepIndex,
      planSteps: args.planSteps,
      contextSummary: args.contextSummary,
      approvedTools: args.approvedTools,
      deniedTools: args.deniedTools,
    } satisfies AgentState),
  });

  await args.ctx.runMutation(internal.taskEvents.addInternal, {
    userId: args.userId,
    taskId: args.taskId,
    kind: "status",
    title: "Continuing",
    detail: args.detail,
    progress: args.progress,
  });

  await args.ctx.scheduler.runAfter(0, internal.ai.taskAgent.continueInternal, {
    userId: args.userId,
    taskId: args.taskId,
  });

  void captureEvent({
    distinctId: args.userId,
    event: "agent_task_continuation_scheduled",
    properties: {
      taskId: String(args.taskId),
      nextStepIndex: args.stepIndex,
      remainingSteps: Math.max(0, args.planSteps.length - args.stepIndex),
    },
  });
}

function updateContextSummary(
  currentSummary: string,
  stepNumber: number,
  stepTitle: string,
  stepSummary: string
): string {
  const base = String(currentSummary || "").trim();
  const line = `- Step ${stepNumber} (${stepTitle}): ${stepSummary}`;
  const combined = base ? `${base}\n${line}` : line;
  return compactTextForPrompt(combined, 1800);
}

async function fail(
  ctx: any,
  userId: string,
  taskId: any,
  task: { title: string; sourceType?: string },
  message: string
) {
  void captureEvent({
    distinctId: userId,
    event: "agent_task_failed",
    properties: {
      taskId: String(taskId),
      title: task.title,
      reason: message,
    },
  });
  await ctx.runMutation(internal.tasks.patchAgentInternal, {
    userId,
    id: taskId,
    agentStatus: "failed",
    agentProgress: 100,
    agentPhase: "Failed",
    agentError: message,
    agentCompletedAt: Date.now(),
  });
  await ctx.runMutation(internal.taskEvents.addInternal, {
    userId,
    taskId,
    kind: "error",
    title: "Failed",
    detail: message,
    progress: 100,
  });
  await ctx.runMutation(internal.notifications.createInternal, {
    userId,
    type: "agent-task",
    title: "Agent failed a task",
    body: `Task: ${task.title}. ${message}`,
    actionUrl: `/dashboard/data?tab=tasks&taskId=${String(taskId)}`,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
