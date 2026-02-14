"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import {
  buildOnboardingPrompt,
  parseSoulFileFromResponse,
  summarizeLearnedInfo,
} from "./onboardPrompt";
import { captureAiGeneration } from "../lib/posthog";

/**
 * Default model for onboarding. Reads from env var ONBOARD_MODEL,
 * falls back to Gemini 3 Flash (fast, 1M context, $0.50/M input).
 *
 * Available OpenRouter Gemini models (as of Feb 2026):
 *   google/gemini-3-flash-preview   — fastest, reasoning, 1M ctx
 *   google/gemini-3-pro-preview     — flagship, multimodal, 1M ctx
 *   google/gemini-2.5-flash         — stable workhorse
 *   google/gemini-2.5-pro           — deep reasoning
 */
function getOnboardModel(): string {
  return process.env.ONBOARD_MODEL || "google/gemini-3-flash-preview";
}

/**
 * Send a message during onboarding.
 * Uses the platform API key (not the user's key).
 * Returns the AI reply + optional soul file content.
 */
export const send = action({
  args: {
    message: v.string(),
    assistantName: v.optional(v.string()),
    priorMessages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<{
    reply: string;
    soulFileContent: string | null;
    assistantName: string | null;
  }> => {
    if (args.message.length > 10_000) {
      throw new Error("Message too long (max 10,000 characters)");
    }

    // Use platform API key from Convex env var
    const platformKey = process.env.OPENROUTER_PLATFORM_KEY;
    if (!platformKey) {
      throw new Error(
        "Platform API key not configured. Set OPENROUTER_PLATFORM_KEY in Convex environment variables."
      );
    }

    // Build context from prior messages
    const learned = summarizeLearnedInfo(args.priorMessages);

    // Build the onboarding system prompt
    const systemPrompt = buildOnboardingPrompt(
      args.assistantName ?? null,
      learned
    );

    // Build conversation messages
    const messages = [
      ...args.priorMessages,
      { role: "user" as const, content: args.message },
    ];

    // Call AI (model configurable via ONBOARD_MODEL env var)
    const t0 = Date.now();
    const onboardModel = getOnboardModel();
    const aiResponse = await callOpenRouter(
      systemPrompt,
      messages,
      onboardModel,
      platformKey
    );
    captureAiGeneration({
      distinctId: "onboarding-anonymous",
      model: onboardModel,
      provider: "openrouter",
      feature: "onboarding",
      latencySeconds: (Date.now() - t0) / 1000,
      output: aiResponse,
    });

    // Parse for soul file
    const { reply, soulFileContent, assistantName } =
      parseSoulFileFromResponse(aiResponse);

    return {
      reply,
      soulFileContent,
      assistantName: assistantName ?? args.assistantName ?? null,
    };
  },
});

/**
 * Generate the first message (the AI's greeting).
 * No user message needed — this is the opening.
 */
export const generateGreeting = action({
  args: {},
  handler: async (ctx): Promise<{ reply: string }> => {
    const platformKey = process.env.OPENROUTER_PLATFORM_KEY;
    if (!platformKey) {
      throw new Error(
        "Platform API key not configured. Set OPENROUTER_PLATFORM_KEY in Convex environment variables."
      );
    }

    const systemPrompt = buildOnboardingPrompt(null, null);

    // Ask the AI to generate its opening message
    const t0 = Date.now();
    const greetModel = getOnboardModel();
    const aiResponse = await callOpenRouter(
      systemPrompt,
      [
        {
          role: "user",
          content:
            "[SYSTEM: The user just arrived at the onboarding page. Generate your opening message to greet them and start getting to know them. This is your first message to them ever.]",
        },
      ],
      greetModel,
      platformKey
    );
    captureAiGeneration({
      distinctId: "onboarding-anonymous",
      model: greetModel,
      provider: "openrouter",
      feature: "onboarding",
      latencySeconds: (Date.now() - t0) / 1000,
      output: aiResponse,
    });

    // Clean up — remove any accidental intent/soulfile blocks from greeting
    const cleanReply = aiResponse
      .replace(/```soulfile[\s\S]*?```/g, "")
      .replace(/```intent[\s\S]*?```/g, "")
      .trim();

    return { reply: cleanReply };
  },
});

// ---------------------------------------------------------------------------
// AI call helper (OpenRouter only for platform key)
// ---------------------------------------------------------------------------

async function callOpenRouter(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  model: string,
  apiKey: string
): Promise<string> {
  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages,
  ];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://mnotes.app",
        "X-Title": "MNotes AI",
      },
      body: JSON.stringify({
        model,
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 1024,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content || "";
}
