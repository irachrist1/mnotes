"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { captureAiGeneration } from "../lib/posthog";
import { callChat, resolveApiKeyFromSettings, type AiProvider } from "./llm";

/**
 * Scheduled internal action: evolves the user's soul file based on recent chat.
 * Called by chatSend.ts every 5 user messages via ctx.scheduler.runAfter.
 */
export const evolveFromChat = internalAction({
  args: {
    userId: v.string(),
    threadId: v.optional(v.id("chatThreads")),
  },
  handler: async (ctx, args): Promise<void> => {
    console.log(`[SOUL_EVOLVE] triggered userId=${args.userId} threadId=${args.threadId ?? "none"}`);

    const [soulFile, settings] = await Promise.all([
      ctx.runQuery(internal.soulFile.getByUserId, { userId: args.userId }),
      ctx.runQuery(internal.userSettings.getForUser, { userId: args.userId }),
    ]);

    if (!soulFile) return;
    if (!settings) return;

    const provider = settings.aiProvider as AiProvider;
    const { apiKey } = resolveApiKeyFromSettings({
      aiProvider: provider,
      openrouterApiKey: settings.openrouterApiKey,
      googleApiKey: settings.googleApiKey,
      anthropicApiKey: (settings as any).anthropicApiKey,
    });
    if (!apiKey) return;

    const recentMessages = await ctx.runQuery(internal.chat.listMessagesForUser, {
      userId: args.userId,
      threadId: args.threadId,
      limit: 20,
    });

    if (recentMessages.length === 0) return;

    const conversationText = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = `You are maintaining a living soul file -- the AI's ONLY long-term memory about this user. This is critical. Everything important about them must end up here. If it's not in the soul file, the AI won't remember it next conversation.

Think of yourself as a diligent note-taker who captures what matters and throws away what doesn't.

## What to update (check ALL sections every time)

- **## Identity** -- Update if the user corrected their name, role, focus area, or renamed the assistant.
- **## Operating Principles** -- HOW the user wants the AI to behave with them. Add rules you learn from their reactions.
- **## Goals** -- Add new goals the user mentioned. Update existing goals if progress was shared. Remove goals they explicitly abandoned.
- **## Preferences** -- Communication, tools, workflows, scheduling. Anything the user expressed a preference about.
- **## Patterns** -- Behavioral observations clearly evidenced.
- **## Notes** -- Key facts, life events, important context. ALWAYS include dates.

## Rules

- Keep the exact same markdown structure and section headers
- Be aggressive about capturing information -- if in doubt, write it down
- Be specific and factual -- use exact quotes, names, numbers, and dates when available
- Remove stale placeholder text and replace with real observations
- NEVER remove existing content unless it's placeholder text or explicitly contradicted by newer information
- If nothing meaningful was learned, return the file UNCHANGED
- When updating Notes, append new entries -- don't reorganize existing ones

Return the complete updated soul file markdown and nothing else.`;

    const userPrompt = `Current soul file:\n\n${soulFile.content}\n\n---\n\nRecent conversation:\n\n${conversationText}\n\n---\n\nReturn the updated soul file:`;

    let evolved: string;
    const t0 = Date.now();
    try {
      const res = await callChat({
        provider,
        apiKey,
        model: normalizeModelForProvider(provider, settings.aiModel),
        systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: 0.4,
        maxTokens: 2048,
        title: "MNotes Soul Evolution",
      });
      evolved = res.content;

      captureAiGeneration({
        distinctId: args.userId,
        model: settings.aiModel,
        provider,
        feature: "soul-evolve",
        latencySeconds: (Date.now() - t0) / 1000,
        output: evolved,
        inputTokens: res.usage?.prompt_tokens,
        outputTokens: res.usage?.completion_tokens,
        totalCostUsd: res.usage?.total_cost,
      });
    } catch (err) {
      console.error(`[SOUL_EVOLVE] AI FAILED userId=${args.userId}`, err);
      return;
    }

    if (!evolved || evolved.length < 50 || !evolved.includes("## Identity")) {
      console.warn(`[SOUL_EVOLVE] rejected -- invalid output userId=${args.userId} len=${evolved?.length ?? 0}`);
      return;
    }

    await ctx.runMutation(internal.soulFile.evolveInternal, {
      userId: args.userId,
      content: evolved.trim(),
    });
    console.log(`[SOUL_EVOLVE] success userId=${args.userId} newLen=${evolved.trim().length}`);
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
