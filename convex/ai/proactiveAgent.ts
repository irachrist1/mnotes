"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { captureAiGeneration, captureEvent } from "../lib/posthog";
import { callChat, resolveApiKeyFromSettings, type AiProvider } from "./llm";
import { createHash } from "node:crypto";

/**
 * Proactive agent loop (P9) - minimal initial version.
 *
 * This does NOT run the agent automatically. It creates suggestions the user can approve
 * to create/queue real tasks.
 */
export const runAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(internal.soulFile.listAllUserIds);
    for (const { userId } of users) {
      await ctx.scheduler.runAfter(0, internal.ai.proactiveAgent.generateForUser, { userId });
    }
  },
});

export const generateForUser = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const [settings, soulFile] = await Promise.all([
      ctx.runQuery(internal.userSettings.getForUser, { userId: args.userId }),
      ctx.runQuery(internal.soulFile.getByUserId, { userId: args.userId }),
    ]);

    // Pick candidate tasks that are undone and haven't been run successfully.
    const tasks = await ctx.runQuery(internal.tasks.listForUserInternal, {
      userId: args.userId,
      limit: 40,
      includeDone: false,
    });

    const candidates = (tasks as any[]).filter((t) => {
      if (t.done) return false;
      const status = String(t.agentStatus ?? "idle");
      if (status === "queued" || status === "running") return false;
      // If succeeded and has output, don't suggest rerun by default.
      if (status === "succeeded" && typeof t.agentResult === "string" && t.agentResult.trim()) return false;
      return true;
    });

    // Prefer high priority, then oldest.
    const scorePriority = (p: string) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
    candidates.sort((a, b) => {
      const pa = scorePriority(String(a.priority ?? "medium"));
      const pb = scorePriority(String(b.priority ?? "medium"));
      if (pb !== pa) return pb - pa;
      return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    });

    const top = candidates.slice(0, 2);
    const provider = settings?.aiProvider as AiProvider | undefined;
    const { apiKey } = resolveApiKeyFromSettings({
      aiProvider: provider ?? "openrouter",
      openrouterApiKey: (settings as any)?.openrouterApiKey,
      googleApiKey: (settings as any)?.googleApiKey,
      anthropicApiKey: (settings as any)?.anthropicApiKey,
    });

    // If AI is configured, use it to decide the best suggestions. Fallback to deterministic rules.
    if (settings && provider && apiKey) {
      const soulExcerpt = (soulFile?.content ?? "").slice(0, 5000);
      const taskSummaries = top.map((t) => ({
        id: String(t._id),
        title: String(t.title ?? ""),
        note: typeof t.note === "string" ? t.note.slice(0, 900) : "",
        dueDate: t.dueDate ?? null,
        priority: t.priority ?? "medium",
        agentStatus: t.agentStatus ?? "idle",
        createdAt: t.createdAt ?? null,
      }));

      const systemPrompt = `You are Jarvis inside MNotes. Your job is to propose proactive suggestions that are worth running as agent tasks.

Rules:
- Only propose 1-2 suggestions.
- Suggestions must be concrete and likely valuable.
- Prefer the user's highest-priority unfinished work.
- Do NOT invent facts. Use only the provided context.
- Output ONLY valid JSON with shape:
{ "suggestions": Array<{ "title": string, "body": string, "taskTitle": string, "taskNote"?: string, "priority": "low"|"medium"|"high", "sourceTaskId"?: string }> }`;

      const userPrompt = `## User Profile Excerpt
${soulExcerpt || "(none)"}

## Candidate tasks
${JSON.stringify(taskSummaries, null, 2)}

Return suggestions JSON:`;

      const t0 = Date.now();
      try {
        const res = await callChat({
          provider,
          apiKey,
          model: String((settings as any)?.aiModel ?? "google/gemini-3-flash-preview"),
          systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
          temperature: 0.25,
          maxTokens: 700,
          title: "MNotes Proactive Suggestions",
        });

        captureAiGeneration({
          distinctId: args.userId,
          model: String((settings as any)?.aiModel ?? ""),
          provider,
          feature: "proactive-suggestions",
          latencySeconds: (Date.now() - t0) / 1000,
          input: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt.slice(0, 4000) }],
          output: res.content.slice(0, 8000),
          inputTokens: res.usage?.prompt_tokens,
          outputTokens: res.usage?.completion_tokens,
          totalCostUsd: res.usage?.total_cost,
        });

        const parsed = parseSuggestionsJson(res.content);
        const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
        let created = 0;

        for (const s of suggestions.slice(0, 2)) {
          const title = typeof s?.title === "string" ? s.title.trim() : "";
          const body = typeof s?.body === "string" ? s.body.trim() : "";
          const taskTitle = typeof s?.taskTitle === "string" ? s.taskTitle.trim() : "";
          const taskNote = typeof s?.taskNote === "string" ? s.taskNote : undefined;
          const priority = s?.priority === "high" || s?.priority === "low" ? s.priority : "medium";
          const sourceTaskId = typeof s?.sourceTaskId === "string" ? s.sourceTaskId.trim() : "";

          if (!title || !body || !taskTitle) continue;
          const hash = sha256(`${title}\n${taskTitle}\n${priority}\n${taskNote ?? ""}\n${body}`);

          await ctx.runMutation(internal.proactiveSuggestions.createInternal, {
            userId: args.userId,
            title,
            body,
            contentHash: hash,
            taskTitle,
            taskNote,
            priority,
            sourceTaskId: sourceTaskId ? (sourceTaskId as any) : undefined,
          });
          created++;
        }

        void captureEvent({
          distinctId: args.userId,
          event: "proactive_suggestions_generated",
          properties: { created, provider, model: (settings as any)?.aiModel },
        });

        if (created > 0) return;
      } catch (err) {
        console.error("[PROACTIVE] AI suggestion generation failed", err);
      }
    }

    // Fallback (rule-based).
    for (const t of top) {
      const title = `Want me to run Jarvis on: ${t.title}`;
      const body = "I can break this down into steps, pull relevant context from your notes, and produce a usable deliverable.";
      const hash = sha256(`${title}\n${t.title}\n${t.priority ?? "medium"}`);
      await ctx.runMutation(internal.proactiveSuggestions.createForTaskInternal, {
        userId: args.userId,
        sourceTaskId: t._id,
        title,
        body,
        contentHash: hash,
        taskTitle: t.title,
        taskNote: t.note,
        priority: t.priority ?? "medium",
      });
    }
  },
});

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function parseSuggestionsJson(text: string): any | null {
  const raw = String(text ?? "");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = raw.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}
