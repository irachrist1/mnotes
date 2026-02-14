"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/**
 * PostHog analytics provider. Wraps the app and captures page views.
 * Initializes PostHog lazily inside useEffect to avoid SSR/module-eval issues.
 * Gracefully no-ops when NEXT_PUBLIC_POSTHOG_KEY is not set.
 */
export default function PostHogProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  // Initialize PostHog once on mount (client-side only)
  useEffect(() => {
    if (!POSTHOG_KEY) return;
    // Prevent double-init if already initialized
    if (posthog.__loaded) {
      setReady(true);
      return;
    }
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: "identified_only",
      capture_pageview: false, // We capture manually for SPA routing
      capture_pageleave: true,
      loaded: () => setReady(true),
    });
  }, []);

  // Capture page views on route changes
  useEffect(() => {
    if (!ready || !pathname) return;
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      $pathname: pathname,
    });
  }, [pathname, ready]);

  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
