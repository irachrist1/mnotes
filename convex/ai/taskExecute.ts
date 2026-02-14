"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { captureAiGeneration } from "../lib/posthog";

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

    const apiKey =
      settings.aiProvider === "openrouter"
        ? settings.openrouterApiKey
        : settings.googleApiKey;
    if (!apiKey) return { success: false, error: "No API key configured" };

    const payload: DraftPayload =
      task.executionPayload && typeof task.executionPayload === "object"
        ? (task.executionPayload as DraftPayload)
        : {};

    const kind = payload.kind ?? "outline";
    const model = settings.aiModel || "google/gemini-2.5-flash";

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
      if (settings.aiProvider === "openrouter") {
        draft = await callOpenRouter(systemPrompt, userPrompt, model, apiKey);
      } else {
        draft = await callGoogle(systemPrompt, userPrompt, model, apiKey);
      }

      captureAiGeneration({
        distinctId: userId,
        model,
        provider: settings.aiProvider,
        feature: "task-execute",
        latencySeconds: (Date.now() - t0) / 1000,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        output: draft,
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
      "X-Title": "MNotes Task Executor",
    },
    body: JSON.stringify({
      model: model || "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 1200,
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
    generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
  });

  return result.response.text();
}

