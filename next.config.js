/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY || 'AIzaSyDEK2L_tx9KQIh5bK_6b3ZBQoMZ1Q7Xsxg',
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Suppress SWC warnings on Windows ARM
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  experimental: {
    // Use WASM fallback
    swcPlugins: [],
  },
}

module.exports = nextConfig 