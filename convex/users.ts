import { query } from "./_generated/server";
import { getUserId, getUserIdentity } from "./lib/auth";

// Get current user profile from Convex Auth identity
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return null;

    return {
      name: identity.name || undefined,
      email: identity.email || undefined,
      avatarUrl: identity.pictureUrl || undefined,
    };
  },
});
