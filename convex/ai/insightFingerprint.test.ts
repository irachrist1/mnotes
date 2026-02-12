import { describe, expect, it } from "vitest";
import {
  buildInsightCanonicalString,
  buildInsightHash,
  cosineSimilarity,
  normalizeInsightText,
  trigramJaccardSimilarity,
} from "./insightFingerprint";

describe("insightFingerprint", () => {
  it("normalizes text with punctuation and casing", () => {
    expect(normalizeInsightText("  Hello, WORLD!!  ")).toBe("hello world");
  });

  it("builds stable hash for equivalent insight content", () => {
    const a = buildInsightHash({
      type: "Revenue",
      title: "  Growth Opportunity ",
      body: "Raise rates by 15%!!",
      actionItems: ["Call top clients", "Test new pricing"],
    });

    const b = buildInsightHash({
      type: "revenue",
      title: "growth opportunity",
      body: "raise rates by 15%",
      actionItems: ["call top clients", "test new pricing"],
    });

    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes hash when canonical content changes", () => {
    const first = buildInsightCanonicalString({
      type: "idea",
      title: "New product",
      body: "Build a course",
      actionItems: ["Outline modules"],
    });
    const second = buildInsightCanonicalString({
      type: "idea",
      title: "New product",
      body: "Build a template pack",
      actionItems: ["Outline modules"],
    });

    expect(first).not.toBe(second);
    expect(buildInsightHash({
      type: "idea",
      title: "New product",
      body: "Build a course",
      actionItems: ["Outline modules"],
    })).not.toBe(buildInsightHash({
      type: "idea",
      title: "New product",
      body: "Build a template pack",
      actionItems: ["Outline modules"],
    }));
  });

  it("computes trigram similarity with higher score for near duplicates", () => {
    const close = trigramJaccardSimilarity(
      "Increase consulting rates for new clients",
      "Increase consulting rates for future clients"
    );
    const far = trigramJaccardSimilarity(
      "Increase consulting rates for new clients",
      "Buy office furniture for studio launch"
    );

    expect(close).toBeGreaterThan(far);
    expect(close).toBeGreaterThan(0.5);
  });

  it("computes cosine similarity correctly", () => {
    const same = cosineSimilarity([1, 2, 3], [1, 2, 3]);
    const opposite = cosineSimilarity([1, 0], [-1, 0]);
    const orthogonal = cosineSimilarity([1, 0], [0, 1]);
    expect(same).toBeCloseTo(1, 5);
    expect(opposite).toBeCloseTo(-1, 5);
    expect(orthogonal).toBeCloseTo(0, 5);
  });
});
