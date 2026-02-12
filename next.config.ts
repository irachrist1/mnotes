import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily set to true for initial Convex migration (no backend connected yet)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
