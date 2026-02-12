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
 * Get the current user ID from Convex Auth, or fall back to "default"
 * for development without auth configured.
 *
 * - With auth: returns the user's tokenIdentifier (stable user ID)
 * - Without auth: returns "default" so dev mode still functions
 */
export async function getUserId(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity) {
    return identity.tokenIdentifier;
  }
  // Fallback for dev mode without auth
  return "default";
}

/**
 * Get the full user identity, or null if not authenticated.
 */
export async function getUserIdentity(
  ctx: QueryCtx | MutationCtx | ActionCtx
) {
  return await ctx.auth.getUserIdentity();
}
