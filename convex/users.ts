import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserId, getUserIdentity } from "./lib/auth";

// Get or create a user profile from Clerk identity
export const getOrCreate = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getUserIdentity(ctx);
    if (!identity) return null;

    const userId = identity.subject;

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();

    if (existing) {
      // Update user info if it changed
      const updates: Record<string, string | number> = {};
      if (identity.name && identity.name !== existing.name) {
        updates.name = identity.name;
      }
      if (identity.email && identity.email !== existing.email) {
        updates.email = identity.email;
      }
      if (identity.pictureUrl && identity.pictureUrl !== existing.avatarUrl) {
        updates.avatarUrl = identity.pictureUrl;
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = Date.now();
        await ctx.db.patch(existing._id, updates);
      }

      return existing._id;
    }

    // Create new user
    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId: userId,
      name: identity.name || undefined,
      email: identity.email || undefined,
      avatarUrl: identity.pictureUrl || undefined,
      plan: "free",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get current user profile
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (userId === "default") return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();
  },
});
