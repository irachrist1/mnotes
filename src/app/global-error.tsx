"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[global] error boundary", error);
  }, [error]);

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <html>
      <body>
        <div style={{ padding: "2rem", maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center" }}>Something went wrong</h2>
          <p style={{ textAlign: "center", color: "#666", marginTop: 8 }}>
            Convex URL: {convexUrl ? "set" : "missing"}
          </p>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12 }}>
            <button onClick={() => reset()} style={{ padding: "0.5rem 1rem" }}>
              Try again
            </button>
            <button onClick={() => window.location.reload()} style={{ padding: "0.5rem 1rem" }}>
              Reload
            </button>
          </div>

          <details style={{ marginTop: 20 }}>
            <summary style={{ cursor: "pointer" }}>Show error details</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 12 }}>
              {error?.message || "(no message)"}
              {"\n"}
              {error?.digest ? `\nDigest: ${error.digest}\n` : ""}
              {error?.stack ? `\n${error.stack}` : ""}
            </pre>
          </details>
        </div>
      </body>
    </html>
  );
}
