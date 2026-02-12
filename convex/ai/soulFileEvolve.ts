"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Scheduled internal action: evolves the user's soul file based on recent chat.
 * Called by chatSend.ts every 5 user messages via ctx.scheduler.runAfter.
 *
 * Modeled after OpenClaw/Jarvis memory architecture:
 * - MEMORY.md is updated after every important interaction
 * - Preferences, operating principles, and key facts are captured aggressively
 * - The soul file is the AI's ONLY persistent memory — everything important goes here
 */
export const evolveFromChat = internalAction({
  args: {
    userId: v.string(),
    threadId: v.optional(v.id("chatThreads")),
  },
  handler: async (ctx, args): Promise<void> => {
    // Load soul file and settings in parallel
    const [soulFile, settings] = await Promise.all([
      ctx.runQuery(internal.soulFile.getByUserId, { userId: args.userId }),
      ctx.runQuery(internal.userSettings.getForUser, { userId: args.userId }),
    ]);

    if (!soulFile) return; // Nothing to evolve yet
    if (!settings) return; // No AI configured — skip silently

    const apiKey = settings.aiProvider === "openrouter"
      ? settings.openrouterApiKey
      : settings.googleApiKey;

    if (!apiKey) return;

    // Load recent messages for context
    const recentMessages = await ctx.runQuery(internal.chat.listMessagesForUser, {
      userId: args.userId,
      threadId: args.threadId,
      limit: 20,
    });

    if (recentMessages.length === 0) return;

    const conversationText = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = `You are maintaining a living soul file — the AI's ONLY long-term memory about this user. This is critical. Everything important about them must end up here. If it's not in the soul file, the AI won't remember it next conversation.

Think of yourself as a diligent note-taker who captures what matters and throws away what doesn't.

## What to update (check ALL sections every time)

- **## Identity** — Update if the user corrected their name, role, focus area, or renamed the assistant.
- **## Operating Principles** — HOW the user wants the AI to behave. Add rules you learn from their reactions:
  - If they said "be more concise" → add "keep responses brief"
  - If they got annoyed at something → add "don't do X"
  - If they praised a behavior → add "continue doing X"
  - These are the user's personalized instructions for the AI.
- **## Goals** — Add new goals the user mentioned. Update existing goals if progress was shared (e.g., "hit $8k/mo" → update the revenue target). Remove goals they explicitly abandoned. Be specific — include numbers, timelines, context.
- **## Preferences** — Communication style, tool preferences, scheduling preferences, writing style preferences. Anything the user expressed a preference about. Be specific:
  - "prefers casual tone" not "has communication preferences"
  - "wants morning check-ins at 7am" not "likes check-ins"
  - "hates being told what they already said" not "prefers concise communication"
- **## Patterns** — Behavioral observations from the conversation: when they work, how they communicate, what topics they return to, decision-making style, what they get excited about. Only record patterns clearly evidenced.
- **## Notes** — Key facts, life events, important context. New client? Major decision? Something they want to remember? Project updates? It goes here. ALWAYS include dates. This section is a running log of important things.

## Rules

- Keep the exact same markdown structure and section headers
- Be aggressive about capturing information — if in doubt, write it down. It's better to have too much in the soul file than too little.
- Be specific and factual — use exact quotes, names, numbers, and dates when available
- Remove stale placeholder text like "(will learn over time through conversation)" and replace with real observations
- NEVER remove existing content unless it's placeholder text or explicitly contradicted by newer information
- If nothing meaningful was learned from this conversation, return the file UNCHANGED (don't add filler)
- When updating Notes, append new entries — don't reorganize existing ones

Return the complete updated soul file markdown and nothing else.`;

    const userPrompt = `Current soul file:\n\n${soulFile.content}\n\n---\n\nRecent conversation:\n\n${conversationText}\n\n---\n\nReturn the updated soul file:`;

    let evolved: string;
    try {
      if (settings.aiProvider === "openrouter") {
        evolved = await callOpenRouter(systemPrompt, userPrompt, settings.aiModel, apiKey);
      } else {
        evolved = await callGoogle(systemPrompt, userPrompt, settings.aiModel, apiKey);
      }
    } catch {
      // Evolution is best-effort — don't crash the scheduler
      return;
    }

    // Sanity check: must look like a soul file
    if (!evolved || evolved.length < 50 || !evolved.includes("## Identity")) return;

    await ctx.runMutation(internal.soulFile.evolveInternal, {
      userId: args.userId,
      content: evolved.trim(),
    });
  },
});

async function callOpenRouter(
  system: string,
  user: string,
  model: string,
  apiKey: string
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://mnotes.app",
      "X-Title": "MNotes Soul Evolution",
    },
    body: JSON.stringify({
      model: model || "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGoogle(
  system: string,
  user: string,
  model: string,
  apiKey: string
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model: model || "gemini-3-flash-preview",
    systemInstruction: system,
  });

  const result = await generativeModel.generateContent({
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });

  return result.response.text();
}
