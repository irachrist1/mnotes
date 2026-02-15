"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { captureAiGeneration } from "../lib/posthog";
import { callChat, resolveApiKeyFromSettings, type AiProvider } from "./llm";

/**
 * Weekly digest pipeline.
 * `runAll` is triggered by a weekly cron and fans out to `generateForUser`
 * for each user with a soul file.
 */
export const runAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.soulFile.listAllUserIds);
    for (const { userId } of users) {
      await ctx.scheduler.runAfter(0, internal.ai.weeklyDigest.generateForUser, {
        userId,
      });
    }
  },
});

export const generateForUser = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const [settings, soulFile, domainData] = await Promise.all([
      ctx.runQuery(internal.userSettings.getForUser, { userId: args.userId }),
      ctx.runQuery(internal.soulFile.getByUserId, { userId: args.userId }),
      ctx.runQuery(internal.chat.getDomainSummaryInput, {
        userId: args.userId,
        sampleLimit: 80,
      }),
    ]);

    // Skip if no AI configured
    if (!settings) return;

    const provider = settings.aiProvider as AiProvider;
    const { apiKey } = resolveApiKeyFromSettings({
      aiProvider: provider,
      openrouterApiKey: settings.openrouterApiKey,
      googleApiKey: settings.googleApiKey,
      anthropicApiKey: (settings as any).anthropicApiKey,
    });
    if (!apiKey) return;

    // Skip if zero domain data
    const hasData =
      domainData.incomeStreams.length > 0 ||
      domainData.ideas.length > 0 ||
      domainData.sessions.length > 0;
    if (!hasData) return;

    const systemPrompt = `You are a weekly business advisor for an entrepreneur. You have access to their soul file (their AI profile with goals and context) and their current business data.

Generate a concise, actionable weekly digest. Be specific -- reference actual numbers, names, and goals from their data. No generic advice.

Respond in valid JSON with this exact structure:
{
  "title": "short catchy title for the digest (max 60 chars)",
  "body": "2-3 paragraph markdown summary covering: revenue trends, idea pipeline progress, mentorship highlights, and one specific recommendation tied to their goals",
  "actionItems": ["specific action 1", "specific action 2", "specific action 3"]
}

Return ONLY the JSON, no other text.`;

    const userPrompt = `## Soul File
${soulFile?.content ?? "(no soul file)"}

## Current Data

### Income Streams (${domainData.incomeStreams.length})
${domainData.incomeStreams
  .map((s) => `- ${s.name} (${s.status}): $${s.monthlyRevenue}/mo -- ${s.category}`)
  .join("\n") || "None"}

### Ideas (${domainData.ideas.length})
${domainData.ideas.map((i) => `- ${i.title} [${i.stage}] -- ${i.category}`).join("\n") || "None"}

### Recent Mentorship Sessions (${domainData.sessions.length})
${domainData.sessions
  .map((s) => `- ${s.mentorName} on ${s.date} (${s.rating}/10)`)
  .join("\n") || "None"}

Generate the weekly digest JSON:`;

    let rawResponse: string;
    const t0 = Date.now();
    try {
      const res = await callChat({
        provider,
        apiKey,
        model: normalizeModelForProvider(provider, settings.aiModel),
        systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.5,
        maxTokens: 1500,
        title: "MNotes Weekly Digest",
      });
      rawResponse = res.content;

      captureAiGeneration({
        distinctId: args.userId,
        model: settings.aiModel,
        provider,
        feature: "weekly-digest",
        latencySeconds: (Date.now() - t0) / 1000,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        output: rawResponse,
        inputTokens: res.usage?.prompt_tokens,
        outputTokens: res.usage?.completion_tokens,
        totalCostUsd: res.usage?.total_cost,
      });
    } catch {
      // AI call failed -- silently skip this user's digest
      return;
    }

    // Parse the JSON response
    let title = "Your Weekly Digest";
    let body = rawResponse;
    let actionItems: string[] = [];

    try {
      const cleaned = rawResponse
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as {
        title?: string;
        body?: string;
        actionItems?: string[];
      };
      if (parsed.title) title = parsed.title;
      if (parsed.body) body = parsed.body;
      if (Array.isArray(parsed.actionItems)) actionItems = parsed.actionItems;
    } catch {
      // JSON parse failed -- use raw text as body with generic title
    }

    await ctx.runMutation(internal.aiInsights.createDigestInternal, {
      userId: args.userId,
      title,
      body,
      actionItems,
      model: settings.aiModel,
    });
  },
});

function normalizeModelForProvider(provider: AiProvider, model: string): string {
  if (provider === "anthropic") {
    const candidate = (model || "").trim();
    if (candidate.startsWith("claude-")) return candidate;
    return "claude-sonnet-4-5-20250929";
  }
  return model || "google/gemini-3-flash-preview";
}
