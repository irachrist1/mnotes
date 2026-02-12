"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const generate = action({
  args: {
    prompt: v.string(),
    model: v.string(),
    provider: v.union(v.literal("openrouter"), v.literal("google")),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      if (args.provider === "openrouter") {
        return await callOpenRouter(args.prompt, args.model, args.apiKey);
      } else {
        return await callGoogleAI(args.prompt, args.model, args.apiKey);
      }
    } catch (error) {
      console.error("AI generation error:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to generate AI response"
      );
    }
  },
});

async function callOpenRouter(
  prompt: string,
  model: string,
  apiKey: string
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://mnotes.app",
      "X-Title": "MNotes AI",
    },
    body: JSON.stringify({
      model: model || "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGoogleAI(
  prompt: string,
  model: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model: model || "gemini-2.5-flash",
  });

  const result = await generativeModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  });

  const response = await result.response;
  return response.text();
}
