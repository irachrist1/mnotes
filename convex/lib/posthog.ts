/**
 * PostHog server-side capture helper for Convex actions.
 *
 * Sends events to PostHog's HTTP API. Used primarily for $ai_generation
 * events so LLM usage shows up in PostHog's AI analytics dashboard.
 *
 * This is fire-and-forget — failures are logged but never throw.
 */

const POSTHOG_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://us.i.posthog.com";

interface AiGenerationEvent {
  /** Distinct user ID for PostHog */
  distinctId: string;
  /** The model used, e.g. "google/gemini-3-flash-preview" */
  model: string;
  /** Provider: "openrouter" or "google" */
  provider: string;
  /** The feature that triggered this call */
  feature: "chat" | "onboarding" | "analyze" | "weekly-digest" | "soul-evolve" | "embed" | "generate";
  /** Latency in seconds */
  latencySeconds: number;
  /** Input messages sent to the model */
  input?: Array<{ role: string; content: string }>;
  /** The model's response text */
  output?: string;
  /** Token counts from the API response (when available) */
  inputTokens?: number;
  outputTokens?: number;
  /** Total cost in USD (when available from OpenRouter) */
  totalCostUsd?: number;
  /** Whether response was served from cache */
  cached?: boolean;
}

/**
 * Capture an $ai_generation event in PostHog.
 * Safe to call without awaiting — never throws.
 */
export async function captureAiGeneration(event: AiGenerationEvent): Promise<void> {
  if (!POSTHOG_KEY) return;

  try {
    const properties: Record<string, unknown> = {
      // Standard PostHog AI properties
      $ai_model: event.model,
      $ai_provider: event.provider,
      $ai_latency: event.latencySeconds,
      // Custom properties
      ai_feature: event.feature,
      ai_cached: event.cached ?? false,
    };

    if (event.input) {
      properties.$ai_input = event.input;
    }
    if (event.output) {
      properties.$ai_output_choices = [{ message: { content: event.output } }];
    }
    if (event.inputTokens !== undefined) {
      properties.$ai_input_tokens = event.inputTokens;
    }
    if (event.outputTokens !== undefined) {
      properties.$ai_output_tokens = event.outputTokens;
    }
    if (event.totalCostUsd !== undefined) {
      properties.$ai_total_cost_usd = event.totalCostUsd;
    }

    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: "$ai_generation",
        distinct_id: event.distinctId,
        properties,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error("[POSTHOG] capture failed:", err);
  }
}
