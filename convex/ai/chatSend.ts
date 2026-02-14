"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getUserId } from "../lib/auth";
import { buildSystemPrompt, buildDomainSummary, parseIntentFromResponse } from "./chatPrompt";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createHash } from "node:crypto";
import { captureAiGeneration } from "../lib/posthog";

const CHAT_PROMPT_CACHE_TTL_SECONDS = 120;

/**
 * Send a message to the chat AI.
 * Fast path: saves the user message + an assistant placeholder, then schedules
 * async generation to upgrade the placeholder in-place. This makes chat feel
 * instant even when the model takes seconds.
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

    // Validate AI settings (fast fail before persisting messages).
    const settings = await ctx.runQuery(internal.userSettings.getWithKeys, {});

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

    // Save user message immediately
    await ctx.runMutation(internal.chat.saveMessage, {
      userId,
      threadId: args.threadId,
      role: "user",
      content: args.message,
    });

    // Save assistant placeholder immediately (client sees it as a bubble)
    const assistantMsgId = await ctx.runMutation(internal.chat.saveMessage, {
      userId,
      threadId: args.threadId,
      role: "assistant",
      content: "Thinking...",
    });

    // Async generation upgrades the placeholder in-place.
    await ctx.scheduler.runAfter(0, internal.ai.chatSend.generateReplyInternal, {
      userId,
      threadId: args.threadId,
      assistantMessageId: assistantMsgId,
      message: args.message,
    });

    return {
      messageId: String(assistantMsgId),
      reply: "Thinking...",
      intent: null,
    };
  },
});

// ---------------------------------------------------------------------------
// AI provider helpers (chat-specific with message arrays)
// ---------------------------------------------------------------------------

/**
 * Internal generator that upgrades a placeholder assistant message with the final reply + intent.
 * Runs outside the client request path.
 */
export const generateReplyInternal = internalAction({
  args: {
    userId: v.string(),
    threadId: v.optional(v.id("chatThreads")),
    assistantMessageId: v.id("chatMessages"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const [settings, soulFile, domainInput, recentMessages, memoryCandidates] = await Promise.all([
      ctx.runQuery(internal.userSettings.getForUser, { userId: args.userId }),
      ctx.runQuery(internal.soulFile.getByUserId, { userId: args.userId }),
      ctx.runQuery(internal.chat.getDomainSummaryInput, {
        userId: args.userId,
        sampleLimit: 80,
      }),
      ctx.runQuery(internal.chat.listMessagesForUser, {
        userId: args.userId,
        threadId: args.threadId,
        limit: 20,
      }),
      ctx.runQuery(internal.savedInsights.searchCandidatesInternal, {
        userId: args.userId,
        q: args.message,
        limit: 6,
      }),
    ]);

    if (!settings) {
      await ctx.runMutation(internal.chat.patchAssistantMessageInternal, {
        userId: args.userId,
        messageId: args.assistantMessageId,
        content: "I need AI settings configured before I can respond. Open Settings and add your API key.",
      });
      return;
    }

    const apiKey = settings.aiProvider === "openrouter"
      ? settings.openrouterApiKey
      : settings.googleApiKey;

    if (!apiKey) {
      await ctx.runMutation(internal.chat.patchAssistantMessageInternal, {
        userId: args.userId,
        messageId: args.assistantMessageId,
        content: `I need your ${settings.aiProvider === "openrouter" ? "OpenRouter" : "Google AI"} API key before I can respond. Open Settings to add it.`,
      });
      return;
    }

    const model = settings.aiModel || "google/gemini-2.5-flash";

    // Build context
    const domainSummary = buildDomainSummary({
      incomeStreams: domainInput.incomeStreams,
      ideas: domainInput.ideas,
      sessions: domainInput.sessions,
    });

    const recentMsgsRaw = (recentMessages as Array<{ _id: string; role: string; content: string }>).filter(
      (m) => String(m._id) !== String(args.assistantMessageId)
    );

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
      recentMsgsRaw.map((m) => ({ role: m.role, content: m.content }))
    );

    // Build conversation messages for the AI (exclude placeholder)
    const conversationMessages = recentMsgsRaw
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-10)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    if (conversationMessages.length === 0 || conversationMessages[conversationMessages.length - 1].content !== args.message) {
      conversationMessages.push({ role: "user", content: args.message });
    }

    const promptCacheKey = createHash("sha256")
      .update(JSON.stringify({
        provider: settings.aiProvider,
        model,
        systemPrompt,
        conversationMessages,
      }))
      .digest("hex");

    const cachedResponse = await ctx.runQuery(internal.aiPromptCache.getValidInternal, {
      userId: args.userId,
      scope: "chat",
      cacheKey: promptCacheKey,
    });

    const t0 = Date.now();
    let aiResponse: string;
    let cached = false;
    try {
      if (cachedResponse?.responseText) {
        aiResponse = cachedResponse.responseText;
        cached = true;
      } else {
        if (settings.aiProvider === "openrouter") {
          const result = await callOpenRouterChat(
            systemPrompt,
            conversationMessages,
            model,
            apiKey
          );
          aiResponse = result.content;

          captureAiGeneration({
            distinctId: args.userId,
            model,
            provider: "openrouter",
            feature: "chat",
            latencySeconds: (Date.now() - t0) / 1000,
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

          captureAiGeneration({
            distinctId: args.userId,
            model,
            provider: "google",
            feature: "chat",
            latencySeconds: (Date.now() - t0) / 1000,
            input: [{ role: "system", content: systemPrompt }, ...conversationMessages],
            output: aiResponse,
          });
        }

        await ctx.runMutation(internal.aiPromptCache.setInternal, {
          userId: args.userId,
          scope: "chat",
          cacheKey: promptCacheKey,
          provider: settings.aiProvider,
          model,
          responseText: aiResponse,
          ttlSeconds: CHAT_PROMPT_CACHE_TTL_SECONDS,
        });
      }
    } catch (error) {
      console.error(`[CHAT] AI ERROR userId=${args.userId} provider=${settings.aiProvider} model=${model}`, error);
      await ctx.runMutation(internal.chat.patchAssistantMessageInternal, {
        userId: args.userId,
        messageId: args.assistantMessageId,
        content: "I hit an error while generating that response. Try again, or check your AI settings.",
      });
      return;
    }

    console.log(`[CHAT] response userId=${args.userId} len=${aiResponse.length} ms=${Date.now() - t0} cached=${cached} model=${model}`);

    const { reply, intent } = parseIntentFromResponse(aiResponse);

    await ctx.runMutation(internal.chat.patchAssistantMessageInternal, {
      userId: args.userId,
      messageId: args.assistantMessageId,
      content: reply,
      intent: intent ?? undefined,
      intentStatus: intent ? "proposed" : undefined,
    });

    // Schedule soul file evolution every 5 user messages for fast memory learning
    const userMsgCount = await ctx.runQuery(internal.chat.countUserMessages, {
      userId: args.userId,
      threadId: args.threadId,
    });

    if (userMsgCount > 0 && userMsgCount % 5 === 0) {
      await ctx.scheduler.runAfter(0, internal.ai.soulFileEvolve.evolveFromChat, {
        userId: args.userId,
        threadId: args.threadId,
      });
    }
  },
});

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
