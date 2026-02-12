const convexSiteUrl =
  process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

export default {
  providers: [
    {
      // Convex Auth issues tokens with CONVEX_SITE_URL as issuer.
      // Keep NEXT_PUBLIC_CONVEX_SITE_URL as a local fallback.
      domain: convexSiteUrl,
      applicationID: "convex",
    },
  ],
};
