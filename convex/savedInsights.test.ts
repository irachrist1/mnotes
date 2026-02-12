import { describe, expect, it } from "vitest";
import {
  computeCommandScore,
  findBestLexicalDuplicate,
} from "./savedInsights";

describe("savedInsights helpers", () => {
  it("prioritizes pinned and recent items in command scoring", () => {
    const now = Date.now();
    const pinnedRecent = computeCommandScore({
      textScore: 0.7,
      savedAt: now,
      pinned: true,
      usedCount: 3,
      now,
    });
    const oldUnpinned = computeCommandScore({
      textScore: 0.7,
      savedAt: now - 90 * 24 * 60 * 60 * 1000,
      pinned: false,
      usedCount: 0,
      now,
    });
    expect(pinnedRecent).toBeGreaterThan(oldUnpinned);
  });

  it("returns the best lexical near duplicate above threshold", () => {
    const result = findBestLexicalDuplicate(
      "Increase consulting pricing for incoming clients",
      [
        {
          _id: "saved_1" as never,
          searchText: "Increase consulting pricing for new clients this quarter",
        } as never,
        {
          _id: "saved_2" as never,
          searchText: "Plan a mentorship networking dinner next month",
        } as never,
      ],
      0.5
    );

    expect(result).not.toBeNull();
    expect(result?.candidateId).toBe("saved_1");
    expect(result?.similarity).toBeGreaterThan(0.5);
  });
});
