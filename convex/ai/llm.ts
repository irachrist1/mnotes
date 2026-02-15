"use node";

import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

export type AiProvider = "openrouter" | "google" | "anthropic";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_cost?: number;
};

export async function callChat(args: {
  provider: AiProvider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  title: string;
}): Promise<{ content: string; usage?: OpenRouterUsage }> {
  if (args.provider === "openrouter") {
    const apiMessages = [
      { role: "system" as const, content: args.systemPrompt },
      ...args.messages,
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
        "HTTP-Referer": "https://mnotes.app",
        "X-Title": args.title,
      },
      body: JSON.stringify({
        model: args.model || "google/gemini-3-flash-preview",
        messages: apiMessages,
        temperature: args.temperature,
        max_tokens: args.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: OpenRouterUsage;
    };

    return {
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage,
    };
  }

  if (args.provider === "google") {
    const genAI = new GoogleGenerativeAI(args.apiKey);
    const generativeModel = genAI.getGenerativeModel({
      model: args.model || "gemini-3-flash-preview",
      systemInstruction: args.systemPrompt,
    });

    const contents = args.messages.map((m) => ({
      role: m.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: m.content }],
    }));

    const result = await generativeModel.generateContent({
      contents,
      generationConfig: {
        temperature: args.temperature,
        maxOutputTokens: args.maxTokens,
      },
    });

    return { content: result.response.text() };
  }

  const client = new Anthropic({ apiKey: args.apiKey });
  const res = await client.messages.create({
    model: args.model,
    system: args.systemPrompt,
    max_tokens: args.maxTokens,
    temperature: args.temperature,
    messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const text = res.content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  return { content: text };
}

export function resolveApiKeyFromSettings(settings: {
  aiProvider: AiProvider;
  openrouterApiKey?: string;
  googleApiKey?: string;
  anthropicApiKey?: string;
}): { apiKey: string | null; missingReason: string | null } {
  if (settings.aiProvider === "openrouter") {
    return settings.openrouterApiKey
      ? { apiKey: settings.openrouterApiKey, missingReason: null }
      : { apiKey: null, missingReason: "No OpenRouter API key configured (Settings)." };
  }
  if (settings.aiProvider === "google") {
    return settings.googleApiKey
      ? { apiKey: settings.googleApiKey, missingReason: null }
      : { apiKey: null, missingReason: "No Google AI API key configured (Settings)." };
  }
  return settings.anthropicApiKey
    ? { apiKey: settings.anthropicApiKey, missingReason: null }
    : { apiKey: null, missingReason: "No Anthropic API key configured (Settings)." };
}

