export interface ParsedInsight {
  title: string;
  body: string;
  actionItems: string[];
  priority: "low" | "medium" | "high";
  confidence: number;
}

/**
 * Parse an AI response string into a structured insight.
 * Handles valid JSON, JSON in markdown code blocks, and raw text fallback.
 */
export function parseAIResponse(response: string): ParsedInsight {
  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(response);
    return normalizeInsight(parsed, response);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return normalizeInsight(parsed, response);
      } catch {
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

function normalizeInsight(
  parsed: Record<string, unknown>,
  rawResponse: string
): ParsedInsight {
  return {
    title: typeof parsed.title === "string" ? parsed.title : "AI Insight",
    body: typeof parsed.body === "string" ? parsed.body : rawResponse,
    actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    priority: isValidPriority(parsed.priority) ? parsed.priority : "medium",
    confidence:
      typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
  };
}

function isValidPriority(
  value: unknown
): value is "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high";
}
