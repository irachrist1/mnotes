"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { captureAiGeneration } from "../lib/posthog";
import { callChat, resolveApiKeyFromSettings, type AiProvider } from "./llm";

type DraftPayload = {
  kind?: "email" | "outline" | "checklist";
  prompt?: string;
};

export const execute = action({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const userId = await getUserId(ctx);

    const [task, settings, soulFile] = await Promise.all([
      ctx.runQuery(internal.tasks.getInternal, { id: args.taskId, userId }),
      ctx.runQuery(internal.userSettings.getWithKeys, {}),
      ctx.runQuery(internal.soulFile.getByUserId, { userId }),
    ]);

    if (!task) return { success: false, error: "Task not found" };
    if (task.executionType !== "draft") {
      return { success: false, error: "This task is not executable yet" };
    }

    if (!settings) return { success: false, error: "Please configure AI settings first" };

    const provider = settings.aiProvider as AiProvider;
    const { apiKey, missingReason } = resolveApiKeyFromSettings({
      aiProvider: provider,
      openrouterApiKey: settings.openrouterApiKey,
      googleApiKey: settings.googleApiKey,
      anthropicApiKey: (settings as any).anthropicApiKey,
    });
    if (!apiKey) return { success: false, error: missingReason ?? "No API key configured" };

    const payload: DraftPayload =
      task.executionPayload && typeof task.executionPayload === "object"
        ? (task.executionPayload as DraftPayload)
        : {};

    const kind = payload.kind ?? "outline";
    const model = normalizeModelForProvider(provider, settings.aiModel);

    await ctx.runMutation(internal.tasks.patchExecutionInternal, {
      userId,
      id: args.taskId,
      lastExecutionStatus: "queued",
      lastExecutionAt: Date.now(),
      lastExecutionError: undefined,
    });

    const systemPrompt = `You are a precise drafting assistant for an entrepreneur. Produce a high-quality draft the user can use immediately.

Rules:
- Output markdown only.
- Be concise and specific.
- No filler.
- If drafting an email: include subject + body.
- If drafting a checklist: use checkboxes.
- Keep it under 600 words.`;

    const soulSummary = soulFile?.content ? soulFile.content.slice(0, 800) : "(no profile)";

    const userPrompt = `## Task
Title: ${task.title}
Note: ${task.note ?? "(none)"}

## Draft Type
${kind}

## Additional Draft Instructions
${payload.prompt ?? "(none)"}

## About Me (profile excerpt)
${soulSummary}
`;

    const t0 = Date.now();
    let draft: string;
    try {
      const res = await callChat({
        provider,
        apiKey,
        model,
        systemPrompt: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.4,
        maxTokens: 1200,
        title: "MNotes Task Executor",
      });
      draft = res.content;

      captureAiGeneration({
        distinctId: userId,
        model,
        provider,
        feature: "task-execute",
        latencySeconds: (Date.now() - t0) / 1000,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        output: draft,
        inputTokens: res.usage?.prompt_tokens,
        outputTokens: res.usage?.completion_tokens,
        totalCostUsd: res.usage?.total_cost,
      });
    } catch (err) {
      console.error(`[TASK_EXECUTE] FAILED taskId=${args.taskId} userId=${userId}`, err);
      await ctx.runMutation(internal.tasks.patchExecutionInternal, {
        userId,
        id: args.taskId,
        lastExecutionStatus: "failed",
        lastExecutionAt: Date.now(),
        lastExecutionError: "Draft generation failed",
      });
      return { success: false, error: "Draft generation failed" };
    }

    const cleaned = (draft ?? "").trim();
    if (cleaned.length < 40) {
      await ctx.runMutation(internal.tasks.patchExecutionInternal, {
        userId,
        id: args.taskId,
        lastExecutionStatus: "failed",
        lastExecutionAt: Date.now(),
        lastExecutionError: "Draft was too short",
      });
      return { success: false, error: "Draft was too short" };
    }

    const nextNote = [
      task.note?.trim() ? task.note.trim() : null,
      "## Draft",
      cleaned,
    ]
      .filter(Boolean)
      .join("\n\n");

    await ctx.runMutation(internal.tasks.patchExecutionInternal, {
      userId,
      id: args.taskId,
      note: nextNote,
      lastExecutionStatus: "succeeded",
      lastExecutionAt: Date.now(),
      lastExecutionError: undefined,
    });

    return { success: true };
  },
});

function normalizeModelForProvider(provider: AiProvider, model: string | undefined): string {
  if (provider === "anthropic") {
    const candidate = (model || "").trim();
    if (candidate.startsWith("claude-")) return candidate;
    return "claude-sonnet-4-5-20250929";
  }
  return model || "google/gemini-3-flash-preview";
}
