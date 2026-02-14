/**
 * PostHog analytics wrapper.
 *
 * Usage:
 *   import { track, identifyUser } from '@/lib/analytics';
 *   identifyUser(userId);
 *   track('chat_message_sent', { threadId });
 *
 * PostHog is initialized once in PostHogProvider (src/components/PostHogProvider.tsx).
 * If NEXT_PUBLIC_POSTHOG_KEY is not set, all calls are no-ops.
 *
 * Tracked events:
 *   $pageview           — automatic on route change (dashboard)
 *   chat_message_sent   — user sent a chat message
 *   chat_intent_committed / chat_intent_rejected — user confirmed or rejected AI data intent
 *   onboarding_soul_confirmed — user confirmed soul file in onboarding
 *   onboarding_settings_saved — user saved API key in onboarding (provider, model)
 *   onboarding_skipped  — user skipped onboarding setup
 *   income_stream_created / income_stream_updated
 *   idea_created / idea_updated
 *   mentorship_session_created / mentorship_session_updated
 *   settings_saved      — AI provider/model saved (provider, model)
 *   feedback_submitted  — type, page
 *   $ai_generation      — server-side (Convex): chat, onboarding, weekly-digest, soul-evolve, analyze, generate
 */

import posthog from "posthog-js";

const isEnabled =
  typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function identifyUser(userId: string) {
  if (!isEnabled || !userId) return;
  posthog.identify(userId);
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!isEnabled) return;
  posthog.capture(event, properties);
}

export function trackPageView(path: string) {
  if (!isEnabled) return;
  posthog.capture("$pageview", { $current_url: path });
}
