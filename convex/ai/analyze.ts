"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { parseAIResponse } from "./parseAIResponse";

export const analyze = action({
  args: {
    analysisType: v.string(),
    businessData: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user settings for API key and provider (auth handled inside get)
    const settings = await ctx.runQuery(api.userSettings.get, {});

    if (!settings) {
      throw new Error("Please configure AI settings first (Settings page)");
    }

    const apiKey = settings.aiProvider === "openrouter"
      ? settings.openrouterApiKey
      : settings.googleApiKey;

    if (!apiKey) {
      throw new Error(`Please add your ${settings.aiProvider === "openrouter" ? "OpenRouter" : "Google AI"} API key in Settings`);
    }

    // Build the prompt based on analysis type
    const prompt = buildAnalysisPrompt(args.analysisType, args.businessData);

    // Call the AI
    const model = args.model || settings.aiModel;
    const aiResponse = await ctx.runAction(api.ai.generate.generate, {
      prompt,
      model,
      provider: settings.aiProvider,
      apiKey,
    });

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

function buildAnalysisPrompt(analysisType: string, businessData: string): string {
  const baseInstructions = `You are a business intelligence assistant analyzing data for an entrepreneur.

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

