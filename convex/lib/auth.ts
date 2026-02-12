import {
  GenericQueryCtx,
  GenericMutationCtx,
  GenericActionCtx,
} from "convex/server";
import type { DataModel } from "../_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;
type ActionCtx = GenericActionCtx<DataModel>;

/**
 * Get the current user ID from Clerk auth, or fall back to "default"
 * for development without Clerk configured.
 *
 * This ensures the app works both with and without Clerk:
 * - With Clerk: returns the Clerk user subject (e.g., "user_2abc...")
 * - Without Clerk: returns "default" so dev mode still functions
 */
export async function getUserId(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    return identity.subject;
  }
  // Fallback for dev mode without Clerk configured
  return "default";
}

/**
 * Get the full user identity from Clerk, or null if not authenticated.
 */
export async function getUserIdentity(
  ctx: QueryCtx | MutationCtx | ActionCtx
) {
  return await ctx.auth.getUserIdentity();
}
