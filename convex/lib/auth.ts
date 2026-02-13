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
 * Get the current user ID from Convex Auth, or fall back to "default".
 *
 * @convex-dev/auth stores sessions in the JWT subject as "<userId>|<sessionId>".
 * We take only the first segment so the ID is stable across login sessions.
 */
export async function getUserId(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string> {
  let identity: { subject: string } | null = null;
  try {
    identity = await ctx.auth.getUserIdentity();
  } catch {
    // Auth config can be missing/misconfigured in a Convex deployment.
    // Treat as "not authenticated" so queries don't crash the app.
    identity = null;
  }

  if (identity) {
    // Strip the session suffix added by @convex-dev/auth (format: userId|sessionId)
    return identity.subject.split("|")[0];
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
  try {
    return await ctx.auth.getUserIdentity();
  } catch {
    return null;
  }
}
