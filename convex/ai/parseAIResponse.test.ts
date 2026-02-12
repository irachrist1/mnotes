import { describe, it, expect } from "vitest";
import { parseAIResponse } from "./parseAIResponse";

describe("parseAIResponse", () => {
  it("parses valid JSON response", () => {
    const json = JSON.stringify({
      title: "Revenue Analysis",
      body: "Your consulting stream performs best.",
      actionItems: ["Increase consulting rates", "Reduce time on low-ROI streams"],
      priority: "high",
      confidence: 0.92,
    });

    const result = parseAIResponse(json);
    expect(result.title).toBe("Revenue Analysis");
    expect(result.body).toBe("Your consulting stream performs best.");
    expect(result.actionItems).toHaveLength(2);
    expect(result.priority).toBe("high");
    expect(result.confidence).toBe(0.92);
  });

  it("parses JSON wrapped in markdown code block", () => {
    const response = `Here's the analysis:

\`\`\`json
{
  "title": "Idea Prioritization",
  "body": "Focus on AI-related ideas.",
  "actionItems": ["Start with MVP"],
  "priority": "medium",
  "confidence": 0.85
}
\`\`\`

Hope this helps!`;

    const result = parseAIResponse(response);
    expect(result.title).toBe("Idea Prioritization");
    expect(result.body).toBe("Focus on AI-related ideas.");
    expect(result.actionItems).toEqual(["Start with MVP"]);
    expect(result.priority).toBe("medium");
    expect(result.confidence).toBe(0.85);
  });

  it("parses code block without json language tag", () => {
    const response = `\`\`\`
{
  "title": "Test",
  "body": "Content",
  "actionItems": [],
  "priority": "low",
  "confidence": 0.5
}
\`\`\``;

    const result = parseAIResponse(response);
    expect(result.title).toBe("Test");
    expect(result.priority).toBe("low");
  });

  it("falls back to defaults for unparseable response", () => {
    const response = "This is just plain text with no JSON.";
    const result = parseAIResponse(response);

    expect(result.title).toBe("AI Insight");
    expect(result.body).toBe(response);
    expect(result.actionItems).toEqual([]);
    expect(result.priority).toBe("medium");
    expect(result.confidence).toBe(0.7);
  });

  it("handles missing title in JSON", () => {
    const json = JSON.stringify({
      body: "Some analysis",
      actionItems: [],
      priority: "low",
      confidence: 0.6,
    });

    const result = parseAIResponse(json);
    expect(result.title).toBe("AI Insight");
    expect(result.body).toBe("Some analysis");
  });

  it("handles missing body in JSON", () => {
    const json = JSON.stringify({
      title: "Analysis",
      actionItems: [],
      priority: "high",
      confidence: 0.9,
    });

    const result = parseAIResponse(json);
    expect(result.title).toBe("Analysis");
    expect(result.body).toBe(json); // falls back to raw
  });

  it("handles invalid priority with default", () => {
    const json = JSON.stringify({
      title: "Test",
      body: "Content",
      actionItems: [],
      priority: "critical", // invalid
      confidence: 0.8,
    });

    const result = parseAIResponse(json);
    expect(result.priority).toBe("medium");
  });

  it("handles non-array actionItems", () => {
    const json = JSON.stringify({
      title: "Test",
      body: "Content",
      actionItems: "not an array",
      priority: "low",
      confidence: 0.5,
    });

    const result = parseAIResponse(json);
    expect(result.actionItems).toEqual([]);
  });

  it("handles non-number confidence with default", () => {
    const json = JSON.stringify({
      title: "Test",
      body: "Content",
      actionItems: [],
      priority: "low",
      confidence: "high",
    });

    const result = parseAIResponse(json);
    expect(result.confidence).toBe(0.8);
  });

  it("handles empty string response", () => {
    const result = parseAIResponse("");
    expect(result.title).toBe("AI Insight");
    expect(result.body).toBe("");
    expect(result.priority).toBe("medium");
  });

  it("handles all three priority values", () => {
    for (const priority of ["low", "medium", "high"]) {
      const json = JSON.stringify({
        title: "T",
        body: "B",
        actionItems: [],
        priority,
        confidence: 0.5,
      });
      const result = parseAIResponse(json);
      expect(result.priority).toBe(priority);
    }
  });
});
