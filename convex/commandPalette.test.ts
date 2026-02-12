import { describe, expect, it } from "vitest";
import {
  computeResultScore,
  computeTextScore,
  tokenizeQuery,
} from "./commandPalette";

describe("commandPalette helpers", () => {
  it("tokenizes query into lower-case searchable terms", () => {
    expect(tokenizeQuery("  AI   Consulting  ")).toEqual(["ai", "consulting"]);
  });

  it("gives stronger text score to phrase matches", () => {
    const tokens = tokenizeQuery("mentor sarah");
    const withPhrase = computeTextScore(
      "mentor sarah pricing strategy notes",
      tokens,
      "mentor sarah"
    );
    const withoutPhrase = computeTextScore(
      "mentor weekly notes",
      tokens,
      "mentor sarah"
    );
    expect(withPhrase).toBeGreaterThan(withoutPhrase);
  });

  it("favors newer and boosted entries for final score", () => {
    const now = Date.now();
    const freshBoosted = computeResultScore({
      textScore: 0.6,
      createdAt: now,
      pinnedBoost: 0.2,
      now,
    });
    const stale = computeResultScore({
      textScore: 0.6,
      createdAt: now - (120 * 24 * 60 * 60 * 1000),
      pinnedBoost: 0,
      now,
    });
    expect(freshBoosted).toBeGreaterThan(stale);
  });
});
