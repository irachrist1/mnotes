"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

export const analyze = action({
  args: {
    userId: v.optional(v.string()),
    analysisType: v.string(),
    businessData: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || "default";

    // Get user settings for API key and provider
    const settings = await ctx.runQuery(api.userSettings.get, { userId });
    
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

    // Save the insight to the database
    const insightId = await ctx.runMutation(api.aiInsights.create, {
      userId,
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

interface ParsedInsight {
  title: string;
  body: string;
  actionItems: string[];
  priority: "low" | "medium" | "high";
  confidence: number;
}

function parseAIResponse(response: string): ParsedInsight {
  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(response);
    return {
      title: parsed.title || "AI Insight",
      body: parsed.body || response,
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      priority: ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "medium",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
    };
  } catch (e) {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          title: parsed.title || "AI Insight",
          body: parsed.body || response,
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
          priority: ["low", "medium", "high"].includes(parsed.priority) ? parsed.priority : "medium",
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
        };
      } catch (e2) {
        // Fall through to fallback
      }
    }

    // Fallback: return raw response with default structure
    return {
      title: "AI Insight",
      body: response,
      actionItems: [],
      priority: "medium",
      confidence: 0.7,
    };
  }
}
