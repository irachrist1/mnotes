/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

// In some locked-down Windows environments, `child_process.exec("net use")`
// inside Vite's Windows safeRealPath optimization fails with spawn EPERM and
// prevents Vitest from even loading config. This patch removes that call from
// Vitest's bundled Vite copy.
//
// This is intentionally narrow: only targets Vitest's nested Vite.
function patchFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  if (original.includes("MNOTES_PATCH_SKIP_NET_USE")) return false;

  const needle = 'exec("net use"';
  const start = original.indexOf(needle);
  if (start === -1) return false;

  // Remove the first exec("net use", ...) call block by trimming from the
  // needle start to the next occurrence of "\n\t});" or "\n});".
  // This matches the Vite 6.x chunk format used by Vitest today.
  const endCandidates = [
    original.indexOf("\n\t});", start),
    original.indexOf("\n});", start),
  ].filter((i) => i !== -1);
  if (endCandidates.length === 0) return false;
  const end = Math.min(...endCandidates) + "\n\t});".length;

  const patched =
    original.slice(0, start) +
    "/* MNOTES_PATCH_SKIP_NET_USE: removed net use call to avoid spawn EPERM */\n" +
    "/* " +
    original.slice(start, end).replace(/\*\//g, "*\\/") +
    " */" +
    original.slice(end);

  fs.writeFileSync(filePath, patched, "utf8");
  return true;
}

function run() {
  const root = process.cwd();
  const candidates = [
    path.join(
      root,
      "node_modules",
      "vitest",
      "node_modules",
      "vite",
      "dist",
      "node",
      "chunks",
      "config.js"
    ),
  ];

  let patchedAny = false;
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      const patched = patchFile(file);
      if (patched) {
        patchedAny = true;
        console.log(`[patch-vitest-vite] patched: ${file}`);
      }
    } catch (err) {
      console.warn(`[patch-vitest-vite] failed to patch ${file}:`, err && err.message ? err.message : err);
    }
  }

  if (!patchedAny) {
    console.log("[patch-vitest-vite] no changes needed");
  }
}

run();

