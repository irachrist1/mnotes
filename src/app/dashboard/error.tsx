"use client";

import { useEffect } from "react";

function classifyConvexishError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("table") && (m.includes("does not exist") || m.includes("not found"))) {
    return "missing_table";
  }
  if (m.includes("index") && (m.includes("does not exist") || m.includes("not found"))) {
    return "missing_index";
  }
  if (m.includes("function") && (m.includes("not found") || m.includes("does not exist"))) {
    return "missing_function";
  }
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("fetch")) {
    return "network";
  }
  return "unknown";
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const kind = classifyConvexishError(error?.message ?? "");

  useEffect(() => {
    // Surface details in the browser console even when Next.js hides messages in production.
    // eslint-disable-next-line no-console
    console.error("[dashboard] render error", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
        Dashboard failed to load
      </h2>
      <p className="text-sm text-stone-500 mb-4">
        {kind === "missing_table" || kind === "missing_index" || kind === "missing_function"
          ? "This usually means your Convex backend is out of sync with your frontend."
          : kind === "network"
            ? "This usually means the app can't reach your Convex deployment."
            : "Something unexpected happened while rendering the dashboard."}
      </p>

      <div className="card px-4 py-3 text-left w-full max-w-2xl mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-stone-600 dark:text-stone-300">
            <span className="font-semibold">Convex URL:</span>{" "}
            {convexUrl ? "set" : "missing"}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-md bg-stone-900 text-white text-xs"
          >
            Reload
          </button>
        </div>

        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-stone-500 select-none">
            Show error details
          </summary>
          <pre className="mt-2 text-[11px] leading-snug whitespace-pre-wrap text-stone-700 dark:text-stone-200">
            {error?.message || "(no message)"}
            {"\n"}
            {error?.stack ? `\n${error.stack}` : ""}
          </pre>
        </details>

        {(kind === "missing_table" || kind === "missing_index" || kind === "missing_function") && (
          <div className="mt-3 text-xs text-stone-600 dark:text-stone-300">
            Run <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">npx convex deploy</code> for the same deployment
            your <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">NEXT_PUBLIC_CONVEX_URL</code> points to.
          </div>
        )}
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-stone-900 text-white text-sm"
      >
        Try again
      </button>
    </div>
  );
}
