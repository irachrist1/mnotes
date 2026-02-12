/**
 * One-time migration: transforms snake_case fields to camelCase in the ideas table.
 * Run from Convex Dashboard: Functions → migrations/migrateIdeasToCamelCase → Run
 * Or: npx convex run migrations/migrateIdeasToCamelCase:migrate
 */

import { mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type SnakeCaseDoc = {
  _id: Id<"ideas">;
  title: string;
  description: string;
  category: string;
  stage: string;
  tags: string[];
  // Snake_case fields (legacy)
  ai_relevance?: boolean;
  competition_level?: string;
  created_date?: string;
  last_updated?: string;
  potential_revenue?: string;
  related_income_stream?: string;
  required_skills?: string[];
  source_of_inspiration?: string;
  next_steps?: string[];
  implementation_complexity?: number;
  time_to_market?: string;
  market_size?: string;
  hardware_component?: boolean;
  // CamelCase (may already exist)
  aiRelevance?: boolean;
  competitionLevel?: string;
  createdDate?: string;
  lastUpdated?: string;
  potentialRevenue?: string;
  relatedIncomeStream?: string;
  requiredSkills?: string[];
  sourceOfInspiration?: string;
  nextSteps?: string[];
  implementationComplexity?: number;
  timeToMarket?: string;
  marketSize?: string;
  hardwareComponent?: boolean;
};

function toCamelCase(doc: SnakeCaseDoc) {
  return {
    _id: doc._id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    stage: doc.stage,
    tags: doc.tags,
    aiRelevance: doc.aiRelevance ?? doc.ai_relevance ?? false,
    competitionLevel: (doc.competitionLevel ?? doc.competition_level ?? "low") as
      | "low"
      | "medium"
      | "high",
    createdDate: doc.createdDate ?? doc.created_date ?? new Date().toISOString(),
    lastUpdated: doc.lastUpdated ?? doc.last_updated ?? new Date().toISOString(),
    potentialRevenue: (doc.potentialRevenue ?? doc.potential_revenue ?? "medium") as
      | "low"
      | "medium"
      | "high"
      | "very-high",
    relatedIncomeStream: doc.relatedIncomeStream ?? doc.related_income_stream,
    requiredSkills: doc.requiredSkills ?? doc.required_skills ?? [],
    sourceOfInspiration: doc.sourceOfInspiration ?? doc.source_of_inspiration ?? "",
    nextSteps: doc.nextSteps ?? doc.next_steps ?? [],
    implementationComplexity: doc.implementationComplexity ?? doc.implementation_complexity ?? 0,
    timeToMarket: doc.timeToMarket ?? doc.time_to_market ?? "",
    marketSize: doc.marketSize ?? doc.market_size ?? "",
    hardwareComponent: doc.hardwareComponent ?? doc.hardware_component ?? false,
  };
}

function needsMigration(doc: SnakeCaseDoc): boolean {
  return (
    "ai_relevance" in doc ||
    "competition_level" in doc ||
    "created_date" in doc ||
    "last_updated" in doc ||
    "potential_revenue" in doc ||
    "related_income_stream" in doc ||
    "required_skills" in doc ||
    "source_of_inspiration" in doc ||
    "next_steps" in doc ||
    "implementation_complexity" in doc ||
    "time_to_market" in doc ||
    "market_size" in doc ||
    "hardware_component" in doc
  );
}

export const migrate = mutation({
  args: {},
  handler: async (ctx) => {
    const ideas = await ctx.db.query("ideas").collect();
    let migrated = 0;

    for (const doc of ideas as SnakeCaseDoc[]) {
      if (needsMigration(doc)) {
        const migratedDoc = toCamelCase(doc);
        const { _id, ...rest } = migratedDoc;
        await ctx.db.replace("ideas", _id, rest);
        migrated++;
      }
    }

    return { total: ideas.length, migrated };
  },
});
