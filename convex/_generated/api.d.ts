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
import type * as ai_parseAIResponse from "../ai/parseAIResponse.js";
import type * as aiInsights from "../aiInsights.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as ideas from "../ideas.js";
import type * as incomeStreams from "../incomeStreams.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_validate from "../lib/validate.js";
import type * as mentorshipSessions from "../mentorshipSessions.js";
import type * as migrations_migrateIdeasToCamelCase from "../migrations/migrateIdeasToCamelCase.js";
import type * as userSettings from "../userSettings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/analyze": typeof ai_analyze;
  "ai/generate": typeof ai_generate;
  "ai/parseAIResponse": typeof ai_parseAIResponse;
  aiInsights: typeof aiInsights;
  auth: typeof auth;
  http: typeof http;
  ideas: typeof ideas;
  incomeStreams: typeof incomeStreams;
  "lib/auth": typeof lib_auth;
  "lib/validate": typeof lib_validate;
  mentorshipSessions: typeof mentorshipSessions;
  "migrations/migrateIdeasToCamelCase": typeof migrations_migrateIdeasToCamelCase;
  userSettings: typeof userSettings;
  users: typeof users;
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
