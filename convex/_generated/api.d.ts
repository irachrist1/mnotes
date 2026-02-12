/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_analyze from "../ai/analyze.js";
import type * as ai_generate from "../ai/generate.js";
import type * as aiInsights from "../aiInsights.js";
import type * as ideas from "../ideas.js";
import type * as incomeStreams from "../incomeStreams.js";
import type * as mentorshipSessions from "../mentorshipSessions.js";
import type * as migrations_migrateIdeasToCamelCase from "../migrations/migrateIdeasToCamelCase.js";
import type * as userSettings from "../userSettings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/analyze": typeof ai_analyze;
  "ai/generate": typeof ai_generate;
  aiInsights: typeof aiInsights;
  ideas: typeof ideas;
  incomeStreams: typeof incomeStreams;
  mentorshipSessions: typeof mentorshipSessions;
  "migrations/migrateIdeasToCamelCase": typeof migrations_migrateIdeasToCamelCase;
  userSettings: typeof userSettings;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
