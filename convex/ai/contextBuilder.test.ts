import { describe, expect, it } from "vitest";
import {
  buildRollingDigest,
  compressSavedInsightsForContext,
  estimateTokenCount,
  fuseRankings,
} from "./contextBuilder";

describe("contextBuilder helpers", () => {
  it("fuses text and vector rankings with shared ids boosted", () => {
    const docA = { _id: "a", bodySummary: "a" } as never;
    const docB = { _id: "b", bodySummary: "b" } as never;

    const fused = fuseRankings(
      [
        { doc: docA, textScore: 0.9 },
        { doc: docB, textScore: 0.8 },
      ],
      [
        { score: 0.95, doc: docA },
      ]
    );

    expect(fused[0]?.doc._id).toBe("a");
    expect(fused.length).toBe(2);
  });

  it("compresses saved insights to stay within budget", () => {
    const insights = Array.from({ length: 8 }).map((_, index) => ({
      _id: `i${index}`,
      type: "idea",
      title: `Insight ${index}`,
      priority: "medium",
      confidence: 0.8,
      body: "Long body ".repeat(120),
      bodySummary: "Short summary",
      actionItems: ["Action one", "Action two"],
    })) as never[];

    const compressed = compressSavedInsightsForContext(insights as never, 100);
    expect(estimateTokenCount(compressed)).toBeLessThanOrEqual(105);
  });

  it("keeps rolling digest bounded to the target budget", () => {
    const digest = buildRollingDigest(
      "x".repeat(4000),
      [
        {
          title: "Test insight",
          bodySummary: "summary",
          body: "full body",
        },
      ] as never,
      300
    );
    expect(estimateTokenCount(digest)).toBeLessThanOrEqual(305);
  });
});
