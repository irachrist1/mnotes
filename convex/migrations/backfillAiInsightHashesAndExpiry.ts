/**
 * Backfill migration for generated AI insights:
 * - Computes contentHash where missing.
 * - Sets expiresAt to now + 30 days where missing.
 *
 * Run:
 *   npx convex run migrations/backfillAiInsightHashesAndExpiry:migrate
 */

import { mutation } from "../_generated/server";
import { buildInsightHash } from "../ai/insightFingerprint";

const GENERATED_INSIGHT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const migrate = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expiresAt = now + GENERATED_INSIGHT_TTL_MS;
    const insights = await ctx.db.query("aiInsights").collect();
    let patched = 0;

    for (const insight of insights) {
      const patch: {
        contentHash?: string;
        expiresAt?: number;
      } = {};

      if (!insight.contentHash) {
        patch.contentHash = buildInsightHash({
          type: insight.type,
          title: insight.title,
          body: insight.body,
          actionItems: insight.actionItems,
        });
      }

      if (typeof insight.expiresAt !== "number") {
        patch.expiresAt = expiresAt;
      }

      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(insight._id, patch);
        patched++;
      }
    }

    return {
      total: insights.length,
      patched,
    };
  },
});
