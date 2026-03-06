/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as contact from "../contact.js";
import type * as http from "../http.js";
import type * as initialization from "../initialization.js";
import type * as intelligence from "../intelligence.js";
import type * as router from "../router.js";
import type * as simulation from "../simulation.js";
import type * as timeline from "../timeline.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  contact: typeof contact;
  http: typeof http;
  initialization: typeof initialization;
  intelligence: typeof intelligence;
  router: typeof router;
  simulation: typeof simulation;
  timeline: typeof timeline;
  users: typeof users;
  wallet: typeof wallet;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
