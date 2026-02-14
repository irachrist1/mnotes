"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Research agent — triggered when a user wants to research context
 * for an actionable action. Uses the user's AI provider to generate
 * research-style output (best practices, examples, templates).
 *
 * Future: integrate Perplexity API for real web search.
 * Current: uses the user's configured AI model with a research-focused prompt.
 */
export const triggerResearch = action({
  args: {
    actionId: v.id("actionableActions"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const userId = await getUserId(ctx);

    const [actionItem, settings, soulFile] = await Promise.all([
      ctx.runQuery(internal.actionableActions.getInternal, { id: args.actionId, userId }),
      ctx.runQuery(internal.userSettings.getWithKeys, {}),
      ctx.runQuery(api.soulFile.get, {}),
    ]);

    if (!actionItem) {
      return { success: false, error: "Action not found" };
    }

    if (!settings) {
      return { success: false, error: "Please configure AI settings first" };
    }

    const apiKey = settings.aiProvider === "openrouter"
      ? settings.openrouterApiKey
      : settings.googleApiKey;

    if (!apiKey) {
      return { success: false, error: "No API key configured" };
    }

    const soulSummary = soulFile?.content
      ? soulFile.content.slice(0, 500)
      : "No user profile available";

    const systemPrompt = `You are a research assistant helping an entrepreneur prepare for a specific task. Your job is to provide practical, actionable research — not generic advice.

Respond in markdown format with these sections:
## Key Findings
3-5 bullet points of the most relevant insights

## Best Practices
What experts recommend for this type of task

## Examples & Templates
Real-world examples or template frameworks they can use immediately

## Recommended Next Steps
2-3 specific things to do based on the research

Be specific and practical. Reference real frameworks, methodologies, or approaches where applicable. Keep it under 800 words.`;

    const userPrompt = `Research this task for me:

**Task:** ${actionItem.title}
**Description:** ${actionItem.description}
${actionItem.aiNotes ? `**AI Context:** ${actionItem.aiNotes}` : ""}

**About me (from my profile):**
${soulSummary}

Provide practical research findings I can act on immediately.`;

    let researchResult: string;
    const model = settings.aiModel || "google/gemini-2.5-flash";

    try {
      if (settings.aiProvider === "openrouter") {
        researchResult = await callOpenRouter(systemPrompt, userPrompt, model, apiKey);
      } else {
        researchResult = await callGoogle(systemPrompt, userPrompt, model, apiKey);
      }
    } catch (err) {
      console.error(`[RESEARCH] AI FAILED actionId=${args.actionId}`, err);
      return { success: false, error: "Research generation failed" };
    }

    if (!researchResult || researchResult.length < 50) {
      return { success: false, error: "Research result too short" };
    }

    // Save research results to the action
    await ctx.runMutation(internal.actionableActions.patchResearchInternal, {
      id: args.actionId,
      userId,
      researchResults: researchResult,
    });

    console.log(`[RESEARCH] success actionId=${args.actionId} userId=${userId} len=${researchResult.length}`);
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
      "X-Title": "MNotes Research Agent",
    },
    body: JSON.stringify({
      model: model || "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
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
    generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
  });

  return result.response.text();
}
