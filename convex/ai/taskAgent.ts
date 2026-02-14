"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { captureAiGeneration } from "../lib/posthog";

type AgentPayload = {
  planSteps: string[];
  summary: string;
  resultMarkdown: string;
};

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
      agentProgress: 12,
      agentPhase: "Planning",
      agentError: undefined,
      agentCompletedAt: undefined,
    });
    await ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "progress",
      title: "Planning",
      detail: "Breaking the work into steps.",
      progress: 12,
    });

    if (!settings) {
      await fail(ctx, args.userId, args.taskId, task, "Please configure AI settings first.");
      return;
    }

    const apiKey =
      settings.aiProvider === "openrouter"
        ? settings.openrouterApiKey
        : settings.googleApiKey;
    if (!apiKey) {
      await fail(ctx, args.userId, args.taskId, task, "No API key configured (Settings).");
      return;
    }

    const model = settings.aiModel || "google/gemini-2.5-flash";
    const soulExcerpt = (soulFile?.content ?? "").slice(0, 1200);

    const system = `You are an AI agent inside a product called MNotes.
You must be honest about what you did: you can plan, analyze, and draft outputs, but you cannot claim you executed external actions.

Return ONLY valid JSON with this shape:
{
  "planSteps": string[],
  "summary": string,
  "resultMarkdown": string
}

Rules:
- planSteps: 3-7 short, user-facing steps (no internal reasoning).
- summary: 1 sentence.
- resultMarkdown: the useful output (markdown), <= 700 words.
- No extra keys. No prose outside JSON.`;

    const user = `## Task
Title: ${task.title}
Note: ${task.note ?? "(none)"}

## User Profile Excerpt (memory-first)
${soulExcerpt || "(no profile found)"}

## Output intent
Produce something the user can use immediately (draft, checklist, outline, analysis, or plan).`;

    await ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentProgress: 45,
      agentPhase: "Drafting",
    });
    await ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "progress",
      title: "Drafting",
      detail: "Writing an output you can review and approve.",
      progress: 45,
    });

    const t0 = Date.now();
    let raw: string;
    try {
      raw =
        settings.aiProvider === "openrouter"
          ? await callOpenRouter(system, user, model, apiKey)
          : await callGoogle(system, user, model, apiKey);
    } catch (err) {
      console.error(`[TASK_AGENT] FAILED taskId=${args.taskId} userId=${args.userId}`, err);
      await fail(ctx, args.userId, args.taskId, task, "Agent generation failed.");
      return;
    }

    captureAiGeneration({
      distinctId: args.userId,
      model,
      provider: settings.aiProvider,
      feature: "task-agent",
      latencySeconds: (Date.now() - t0) / 1000,
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      output: raw,
    });

    const parsed = parseAgentPayload(raw);
    const plan = parsed.planSteps.slice(0, 7).filter(Boolean);
    const result = (parsed.resultMarkdown || "").trim();
    const summary = (parsed.summary || "").trim();

    if (!result || result.length < 40) {
      await fail(ctx, args.userId, args.taskId, task, "Agent output was too short.");
      return;
    }

    await ctx.runMutation(internal.tasks.patchAgentInternal, {
      userId: args.userId,
      id: args.taskId,
      agentStatus: "succeeded",
      agentProgress: 100,
      agentPhase: "Ready",
      agentPlan: plan.length ? plan : undefined,
      agentSummary: summary || "Output ready to review.",
      agentResult: result,
      agentCompletedAt: Date.now(),
      agentError: undefined,
    });

    await ctx.runMutation(internal.taskEvents.addInternal, {
      userId: args.userId,
      taskId: args.taskId,
      kind: "result",
      title: "Output ready",
      detail: summary || "Review the output and decide what to do next.",
      progress: 100,
    });

    // Avoid spamming notifications for bulk-created insight tasks.
    if (task.sourceType !== "ai-insight") {
      await ctx.runMutation(internal.notifications.createInternal, {
        userId: args.userId,
        type: "agent-task",
        title: "Agent finished a task",
        body: summary || `Finished: ${task.title}`,
        actionUrl: `/dashboard/data?tab=tasks&taskId=${String(args.taskId)}`,
      });
    }
  },
});

async function fail(
  ctx: any,
  userId: string,
  taskId: any,
  task: { title: string; sourceType?: string },
  message: string
) {
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

function parseAgentPayload(raw: string): AgentPayload {
  const fallback: AgentPayload = {
    planSteps: [],
    summary: "Output ready to review.",
    resultMarkdown: raw.trim(),
  };

  const trimmed = raw.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return fallback;
  const candidate = trimmed.slice(firstBrace, lastBrace + 1);

  try {
    const obj = JSON.parse(candidate) as Partial<AgentPayload>;
    return {
      planSteps: Array.isArray(obj.planSteps) ? obj.planSteps.map(String) : [],
      summary: typeof obj.summary === "string" ? obj.summary : fallback.summary,
      resultMarkdown:
        typeof obj.resultMarkdown === "string" ? obj.resultMarkdown : fallback.resultMarkdown,
    };
  } catch {
    return fallback;
  }
}

async function callOpenRouter(
  system: string,
  user: string,
  model: string,
  apiKey: string
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://mnotes.app",
      "X-Title": "MNotes Agent Tasks",
    },
    body: JSON.stringify({
      model: model || "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: 1400,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errorText}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGoogle(
  system: string,
  user: string,
  model: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model: model || "gemini-3-flash-preview",
    systemInstruction: system,
  });

  const result = await generativeModel.generateContent({
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1400 },
  });

  return result.response.text();
}
