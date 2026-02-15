/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentFiles from "../agentFiles.js";
import type * as aiInsights from "../aiInsights.js";
import type * as aiPromptCache from "../aiPromptCache.js";
import type * as ai_agentTools from "../ai/agentTools.js";
import type * as ai_analyze from "../ai/analyze.js";
import type * as ai_chatPrompt from "../ai/chatPrompt.js";
import type * as ai_chatSend from "../ai/chatSend.js";
import type * as ai_contextBuilder from "../ai/contextBuilder.js";
import type * as ai_dailyNotifications from "../ai/dailyNotifications.js";
import type * as ai_embed from "../ai/embed.js";
import type * as ai_generate from "../ai/generate.js";
import type * as ai_insightFingerprint from "../ai/insightFingerprint.js";
import type * as ai_llm from "../ai/llm.js";
import type * as ai_onboardPrompt from "../ai/onboardPrompt.js";
import type * as ai_onboardSend from "../ai/onboardSend.js";
import type * as ai_parseAIResponse from "../ai/parseAIResponse.js";
import type * as ai_soulFileEvolve from "../ai/soulFileEvolve.js";
import type * as ai_taskAgent from "../ai/taskAgent.js";
import type * as ai_taskAgentParsing from "../ai/taskAgentParsing.js";
import type * as ai_taskExecute from "../ai/taskExecute.js";
import type * as ai_weeklyDigest from "../ai/weeklyDigest.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as commandPalette from "../commandPalette.js";
import type * as connectors_tokens from "../connectors/tokens.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as feedback from "../feedback.js";
import type * as http from "../http.js";
import type * as ideas from "../ideas.js";
import type * as incomeStreams from "../incomeStreams.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_posthog from "../lib/posthog.js";
import type * as lib_validate from "../lib/validate.js";
import type * as mentorshipSessions from "../mentorshipSessions.js";
import type * as migrations_backfillAiInsightHashesAndExpiry from "../migrations/backfillAiInsightHashesAndExpiry.js";
import type * as migrations_migrateIdeasToCamelCase from "../migrations/migrateIdeasToCamelCase.js";
import type * as notifications from "../notifications.js";
import type * as savedInsights from "../savedInsights.js";
import type * as soulFile from "../soulFile.js";
import type * as taskEvents from "../taskEvents.js";
import type * as tasks from "../tasks.js";
import type * as userSettings from "../userSettings.js";
import type * as userSettingsPatch from "../userSettingsPatch.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentFiles: typeof agentFiles;
  aiInsights: typeof aiInsights;
  aiPromptCache: typeof aiPromptCache;
  "ai/agentTools": typeof ai_agentTools;
  "ai/analyze": typeof ai_analyze;
  "ai/chatPrompt": typeof ai_chatPrompt;
  "ai/chatSend": typeof ai_chatSend;
  "ai/contextBuilder": typeof ai_contextBuilder;
  "ai/dailyNotifications": typeof ai_dailyNotifications;
  "ai/embed": typeof ai_embed;
  "ai/generate": typeof ai_generate;
  "ai/insightFingerprint": typeof ai_insightFingerprint;
  "ai/llm": typeof ai_llm;
  "ai/onboardPrompt": typeof ai_onboardPrompt;
  "ai/onboardSend": typeof ai_onboardSend;
  "ai/parseAIResponse": typeof ai_parseAIResponse;
  "ai/soulFileEvolve": typeof ai_soulFileEvolve;
  "ai/taskAgent": typeof ai_taskAgent;
  "ai/taskAgentParsing": typeof ai_taskAgentParsing;
  "ai/taskExecute": typeof ai_taskExecute;
  "ai/weeklyDigest": typeof ai_weeklyDigest;
  auth: typeof auth;
  chat: typeof chat;
  commandPalette: typeof commandPalette;
  "connectors/tokens": typeof connectors_tokens;
  crons: typeof crons;
  dashboard: typeof dashboard;
  feedback: typeof feedback;
  http: typeof http;
  ideas: typeof ideas;
  incomeStreams: typeof incomeStreams;
  "lib/auth": typeof lib_auth;
  "lib/posthog": typeof lib_posthog;
  "lib/validate": typeof lib_validate;
  mentorshipSessions: typeof mentorshipSessions;
  "migrations/backfillAiInsightHashesAndExpiry": typeof migrations_backfillAiInsightHashesAndExpiry;
  "migrations/migrateIdeasToCamelCase": typeof migrations_migrateIdeasToCamelCase;
  notifications: typeof notifications;
  savedInsights: typeof savedInsights;
  soulFile: typeof soulFile;
  taskEvents: typeof taskEvents;
  tasks: typeof tasks;
  userSettings: typeof userSettings;
  userSettingsPatch: typeof userSettingsPatch;
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
