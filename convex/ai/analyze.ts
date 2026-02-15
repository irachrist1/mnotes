"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { parseAIResponse, ParsedInsight } from "./parseAIResponse";
import type { Id } from "../_generated/dataModel";
import { getUserId } from "../lib/auth";
import { createHash } from "node:crypto";
import { resolveApiKeyFromSettings, type AiProvider } from "./llm";

const INSIGHT_PROMPT_CACHE_TTL_SECONDS = 10 * 60;

export const analyze = action({
  args: {
    analysisType: v.string(),
    businessData: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ id: Id<"aiInsights"> } & ParsedInsight> => {
    const userId = await getUserId(ctx);

    // Use internal query to get unmasked API keys (never exposed to client)
    const [settings, soulFile, relevantMemory] = await Promise.all([
      ctx.runQuery(internal.userSettings.getWithKeys, {}),
      ctx.runQuery(api.soulFile.get, {}),
      ctx.runQuery(internal.savedInsights.searchCandidatesInternal, {
        userId,
        q: args.analysisType,
        limit: 6,
      }),
    ]);

    if (!settings) {
      throw new Error("Please configure AI settings first (Settings page)");
    }

    const provider = settings.aiProvider as AiProvider;
    const { apiKey, missingReason } = resolveApiKeyFromSettings({
      aiProvider: provider,
      openrouterApiKey: settings.openrouterApiKey,
      googleApiKey: settings.googleApiKey,
      anthropicApiKey: (settings as any).anthropicApiKey,
    });

    if (!apiKey) {
      throw new Error(missingReason ?? "Please add your API key in Settings");
    }

    // Build the prompt based on analysis type
    const prompt = buildAnalysisPrompt(args.analysisType, args.businessData, {
      soulContent: soulFile?.content ?? "",
      relevantMemoryBlock: buildRelevantMemoryBlock(
        relevantMemory as Array<{
          textScore: number;
          doc: {
            title: string;
            type: string;
            bodySummary: string;
            actionItems: string[];
          };
        }>
      ),
    });

    // Call the AI
    const model = args.model || settings.aiModel;
    const cacheKey = createHash("sha256")
      .update([settings.aiProvider, model, args.analysisType, prompt].join("::"))
      .digest("hex");

    const cached = await ctx.runQuery(internal.aiPromptCache.getValidInternal, {
      userId,
      scope: "insight",
      cacheKey,
    });

    const aiResponse = cached?.responseText
      ? cached.responseText
      : await ctx.runAction(api.ai.generate.generate, {
        prompt,
        model,
        provider,
        apiKey,
      });

    if (!cached?.responseText) {
      await ctx.runMutation(internal.aiPromptCache.setInternal, {
        userId,
        scope: "insight",
        cacheKey,
        provider,
        model,
        responseText: aiResponse,
        ttlSeconds: INSIGHT_PROMPT_CACHE_TTL_SECONDS,
      });
    }

    // Parse the response
    const parsed = parseAIResponse(aiResponse);

    // Save the insight to the database (auth handled inside create)
    const insightId = await ctx.runMutation(api.aiInsights.create, {
      type: args.analysisType,
      title: parsed.title,
      body: parsed.body,
      actionItems: parsed.actionItems,
      priority: parsed.priority,
      confidence: parsed.confidence,
      model,
    });

    return {
      id: insightId,
      ...parsed,
    };
  },
});

function buildAnalysisPrompt(
  analysisType: string,
  businessData: string,
  context: { soulContent: string; relevantMemoryBlock: string }
): string {
  const baseInstructions = `You are a business intelligence assistant analyzing data for an entrepreneur.

Use the user's profile and long-term memory to make recommendations contextually relevant:
${context.soulContent || "(No soul file yet)"}

Relevant previously saved insights:
${context.relevantMemoryBlock || "(No saved insights yet)"}

Respond in valid JSON with this exact structure:
{
  "title": "Short insight title",
  "body": "Detailed analysis (2-3 paragraphs)",
  "actionItems": ["Action 1", "Action 2", "Action 3"],
  "priority": "low" | "medium" | "high",
  "confidence": 0.0-1.0
}

Business data:
${businessData}

Analysis type: ${analysisType}
`;

  if (analysisType === "revenue") {
    return baseInstructions + `
Analyze the income streams. Focus on:
- Which streams have the best revenue-to-time ratio
- Growth opportunities based on growth rates
- Diversification and risk assessment
- Specific actions to increase revenue or efficiency
`;
  } else if (analysisType === "idea") {
    return baseInstructions + `
Analyze the ideas portfolio. Focus on:
- Which ideas have the best potential vs. complexity ratio
- Market opportunities and competition
- Skill gaps that need addressing
- Prioritization recommendations
- Specific next steps for top ideas
`;
  } else if (analysisType === "mentorship") {
    return baseInstructions + `
Analyze mentorship sessions. Focus on:
- Patterns in topics and insights
- Action item completion and follow-through
- Value received vs. given
- Key learnings and how to apply them
- Relationships to nurture or develop
`;
  } else {
    return baseInstructions + `
Provide a general business intelligence insight based on the data provided.
`;
  }
}

function buildRelevantMemoryBlock(items: Array<{
  textScore: number;
  doc: {
    title: string;
    type: string;
    bodySummary: string;
    actionItems: string[];
  };
}>): string {
  if (!items.length) return "";
  return items
    .filter((item) => item.textScore >= 0.15)
    .slice(0, 4)
    .map((item, index) => {
      const actions = item.doc.actionItems.slice(0, 2).join("; ") || "none";
      return `#${index + 1} [${item.doc.type}] ${item.doc.title}\n${item.doc.bodySummary}\nActions: ${actions}`;
    })
    .join("\n\n");
}
