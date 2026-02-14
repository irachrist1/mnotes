"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal, api } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { buildSystemPrompt, buildDomainSummary, parseIntentFromResponse } from "./chatPrompt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "node:crypto";
import { captureAiGeneration } from "../lib/posthog";

const CHAT_PROMPT_CACHE_TTL_SECONDS = 120;

/**
 * Send a message to the chat AI.
 * Loads context, calls AI, parses intent, saves messages, returns response.
 */
export const send = action({
  args: {
    message: v.string(),
    threadId: v.optional(v.id("chatThreads")),
  },
  handler: async (ctx, args): Promise<{
    messageId: string;
    reply: string;
    intent: { table: string; operation: "create" | "update" | "query"; data?: Record<string, unknown> } | null;
  }> => {
    if (args.message.length > 10_000) {
      throw new Error("Message too long (max 10,000 characters)");
    }

    const userId = await getUserId(ctx);

    // Load all context in parallel
    const [settings, soulFile, domainInput, recentMessages, memoryCandidates] = await Promise.all([
      ctx.runQuery(internal.userSettings.getWithKeys, {}),
      ctx.runQuery(api.soulFile.get, {}),
      ctx.runQuery(internal.chat.getDomainSummaryInput, {
        userId,
        sampleLimit: 80,
      }),
      ctx.runQuery(api.chat.listMessages, {
        threadId: args.threadId,
        limit: 20,
      }),
      ctx.runQuery(internal.savedInsights.searchCandidatesInternal, {
        userId,
        q: args.message,
        limit: 6,
      }),
    ]);

    if (!settings) {
      console.error(`[CHAT] NO SETTINGS userId=${userId}`);
      throw new Error("Please configure your AI settings first (Settings page)");
    }

    const apiKey = settings.aiProvider === "openrouter"
      ? settings.openrouterApiKey
      : settings.googleApiKey;

    if (!apiKey) {
      console.error(`[CHAT] NO API KEY provider=${settings.aiProvider} userId=${userId}`);
      throw new Error(`Please add your ${settings.aiProvider === "openrouter" ? "OpenRouter" : "Google AI"} API key in Settings`);
    }

    // Build context
    const domainSummary = buildDomainSummary({
      incomeStreams: domainInput.incomeStreams,
      ideas: domainInput.ideas,
      sessions: domainInput.sessions,
    });

    const recentMsgs = recentMessages as Array<{ role: string; content: string }>;

    const relevantMemoryBlock = buildRelevantMemoryBlock(
      memoryCandidates as Array<{
        textScore: number;
        doc: {
          title: string;
          type: string;
          bodySummary: string;
          actionItems: string[];
        };
      }>
    );

    const systemPrompt = buildSystemPrompt(
      soulFile?.content ?? null,
      relevantMemoryBlock
        ? `${domainSummary}\n\n## Relevant Memory From Important Past Chats\n${relevantMemoryBlock}`
        : domainSummary,
      recentMsgs.map((m) => ({ role: m.role, content: m.content }))
    );

    // Build conversation messages for the AI
    const conversationMessages = recentMsgs.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    conversationMessages.push({ role: "user", content: args.message });

    // Save user message
    await ctx.runMutation(internal.chat.saveMessage, {
      userId,
      threadId: args.threadId,
      role: "user",
      content: args.message,
    });

    const model = settings.aiModel || "google/gemini-2.5-flash";
    const promptCacheKey = createHash("sha256")
      .update(JSON.stringify({
        provider: settings.aiProvider,
        model,
        systemPrompt,
        conversationMessages,
      }))
      .digest("hex");

    const cachedResponse = await ctx.runQuery(internal.aiPromptCache.getValidInternal, {
      userId,
      scope: "chat",
      cacheKey: promptCacheKey,
    });

    // Call AI (or use cache)
    const t0 = Date.now();
    let aiResponse: string;
    let cached = false;
    try {
      if (cachedResponse?.responseText) {
        aiResponse = cachedResponse.responseText;
        cached = true;
        console.log(`[CHAT] cacheHit userId=${userId} model=${model}`);
      } else {
        if (settings.aiProvider === "openrouter") {
          const result = await callOpenRouterChat(
            systemPrompt,
            conversationMessages,
            model,
            apiKey
          );
          aiResponse = result.content;

          // Capture LLM analytics
          const latency = (Date.now() - t0) / 1000;
          captureAiGeneration({
            distinctId: userId,
            model,
            provider: "openrouter",
            feature: "chat",
            latencySeconds: latency,
            input: [{ role: "system", content: systemPrompt }, ...conversationMessages],
            output: result.content,
            inputTokens: result.usage?.prompt_tokens,
            outputTokens: result.usage?.completion_tokens,
            totalCostUsd: result.usage?.total_cost,
          });
        } else {
          aiResponse = await callGoogleAIChat(
            systemPrompt,
            conversationMessages,
            model,
            apiKey
          );

          const latency = (Date.now() - t0) / 1000;
          captureAiGeneration({
            distinctId: userId,
            model,
            provider: "google",
            feature: "chat",
            latencySeconds: latency,
            input: [{ role: "system", content: systemPrompt }, ...conversationMessages],
            output: aiResponse,
          });
        }

        await ctx.runMutation(internal.aiPromptCache.setInternal, {
          userId,
          scope: "chat",
          cacheKey: promptCacheKey,
          provider: settings.aiProvider,
          model,
          responseText: aiResponse,
          ttlSeconds: CHAT_PROMPT_CACHE_TTL_SECONDS,
        });
      }
    } catch (error) {
      console.error(`[CHAT] AI ERROR userId=${userId} provider=${settings.aiProvider} model=${model}`, error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to get AI response"
      );
    }
    console.log(`[CHAT] response userId=${userId} len=${aiResponse.length} ms=${Date.now() - t0} cached=${cached} model=${model}`);

    // Parse for intents
    const { reply, intent } = parseIntentFromResponse(aiResponse);
    if (intent) {
      console.log(`[CHAT] intent detected table=${intent.table} op=${intent.operation} userId=${userId}`);
    }

    // Save assistant message
    const assistantMsgId: string = await ctx.runMutation(internal.chat.saveMessage, {
      userId,
      threadId: args.threadId,
      role: "assistant",
      content: reply,
      intent: intent ?? undefined,
      intentStatus: intent ? "proposed" : undefined,
    });

    // Schedule soul file evolution every 5 user messages for fast memory learning
    const userMsgCount = await ctx.runQuery(internal.chat.countUserMessages, {
      userId,
      threadId: args.threadId,
    });

    if (userMsgCount > 0 && userMsgCount % 5 === 0) {
      await ctx.scheduler.runAfter(0, internal.ai.soulFileEvolve.evolveFromChat, {
        userId,
        threadId: args.threadId,
      });
    }

    return {
      messageId: assistantMsgId,
      reply,
      intent,
    };
  },
});

// ---------------------------------------------------------------------------
// AI provider helpers (chat-specific with message arrays)
// ---------------------------------------------------------------------------

interface OpenRouterResult {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_cost?: number;
  };
}

async function callOpenRouterChat(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  model: string,
  apiKey: string
): Promise<OpenRouterResult> {
  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages,
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://mnotes.app",
      "X-Title": "MNotes AI",
    },
    body: JSON.stringify({
      model: model || "google/gemini-3-flash-preview",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_cost?: number };
  };
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage,
  };
}

async function callGoogleAIChat(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  model: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model: model || "gemini-3-flash-preview",
    systemInstruction: systemPrompt,
  });

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const result = await generativeModel.generateContent({
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const response = await result.response;
  return response.text();
}

function buildRelevantMemoryBlock(items: Array<{
  textScore: number;
  doc: {
    title: string;
    type: string;
    bodySummary: string;
    actionItems: string[];
  };
}>): string {
  if (!items.length) return "";
  return items
    .filter((item) => item.textScore >= 0.15)
    .slice(0, 4)
    .map((item, index) => {
      const actions = item.doc.actionItems.slice(0, 2).join("; ") || "none";
      return `#${index + 1} [${item.doc.type}] ${item.doc.title}\n${item.doc.bodySummary}\nActions: ${actions}`;
    })
    .join("\n\n");
}
