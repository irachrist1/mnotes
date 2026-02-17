import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "convex/**/*.test.ts", "agent-server/src/**/*.test.ts"],
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
