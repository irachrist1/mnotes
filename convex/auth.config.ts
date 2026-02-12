const authConfig = {
  providers: [
    {
      // Clerk issuer domain, configured via CLERK_JWT_ISSUER_DOMAIN env var
      // in Convex dashboard. Falls back to a placeholder if not set.
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://placeholder.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
