import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "convex/**/*.test.ts"],
    css: false,
    // Avoid child_process (blocked in some Windows environments); prefer worker_threads.
    pool: "threads",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
    },
    // Avoid Vite's Windows safeRealPath optimization that runs `net use` via child_process.
    preserveSymlinks: true,
  },
});
