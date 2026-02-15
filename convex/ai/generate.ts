"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { captureAiGeneration } from "../lib/posthog";
import { getUserId } from "../lib/auth";
import { callChat, type AiProvider } from "./llm";

export const generate = action({
  args: {
    prompt: v.string(),
    model: v.string(),
    provider: v.union(v.literal("openrouter"), v.literal("google"), v.literal("anthropic")),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Input validation
    if (args.prompt.length > 50_000) {
      throw new Error("Prompt is too long (max 50,000 characters)");
    }
    if (args.model.length > 200) {
      throw new Error("Model name is too long");
    }
    if (args.apiKey.length > 500) {
      throw new Error("API key is too long");
    }

    const userId = await getUserId(ctx);
    const t0 = Date.now();
    try {
      const provider = args.provider as AiProvider;
      const res = await callChat({
        provider,
        apiKey: args.apiKey,
        model: normalizeModelForProvider(provider, args.model),
        systemPrompt: "",
        messages: [{ role: "user", content: args.prompt }],
        temperature: 0.7,
        maxTokens: 4096,
        title: "MNotes AI",
      });
      const result = res.content;
      captureAiGeneration({
        distinctId: userId,
        model: args.model,
        provider: args.provider,
        feature: "generate",
        latencySeconds: (Date.now() - t0) / 1000,
        input: [{ role: "user", content: args.prompt }],
        output: result,
        inputTokens: res.usage?.prompt_tokens,
        outputTokens: res.usage?.completion_tokens,
        totalCostUsd: res.usage?.total_cost,
      });
      return result;
    } catch (error) {
      console.error("AI generation error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate AI response"
      );
    }
  },
});

function normalizeModelForProvider(provider: AiProvider, model: string): string {
  if (provider === "anthropic") {
    const candidate = (model || "").trim();
    if (candidate.startsWith("claude-")) return candidate;
    return "claude-sonnet-4-5-20250929";
  }
  return model || "google/gemini-3-flash-preview";
}
