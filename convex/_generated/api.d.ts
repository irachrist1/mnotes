/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as connectors_authSessions from "../connectors/authSessions.js";
import type * as connectors_githubOauth from "../connectors/githubOauth.js";
import type * as connectors_googleOauth from "../connectors/googleOauth.js";
import type * as connectors_googleScopes from "../connectors/googleScopes.js";
import type * as connectors_tokens from "../connectors/tokens.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_validate from "../lib/validate.js";
import type * as memory from "../memory.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as proactive from "../proactive.js";
import type * as scheduledTasks from "../scheduledTasks.js";
import type * as settings from "../settings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "connectors/authSessions": typeof connectors_authSessions;
  "connectors/githubOauth": typeof connectors_githubOauth;
  "connectors/googleOauth": typeof connectors_googleOauth;
  "connectors/googleScopes": typeof connectors_googleScopes;
  "connectors/tokens": typeof connectors_tokens;
  crons: typeof crons;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/validate": typeof lib_validate;
  memory: typeof memory;
  messages: typeof messages;
  notifications: typeof notifications;
  proactive: typeof proactive;
  scheduledTasks: typeof scheduledTasks;
  settings: typeof settings;
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
