import type { MemoryEntry } from "./types.js";

/**
 * Build the Jarvis system prompt.
 * Injects soul file content + persistent memories + connected integrations + tool use guidelines.
 */
export function buildSystemPrompt(
  soulFile: string | undefined,
  memories: MemoryEntry[],
  connectors: string[] = []
): string {
  const persistentMemories = memories.filter((m) => m.tier === "persistent");
  const sortedMemories = persistentMemories.sort((a, b) => b.importance - a.importance);

  const memoriesSection =
    sortedMemories.length > 0
      ? `## What I Know About You\n\n${sortedMemories
          .map((m) => `**${m.title}** (${m.category}): ${m.content}`)
          .join("\n")}`
      : "";

  const soulSection = soulFile
    ? `## Your Profile (Soul File)\n\n${soulFile}`
    : "";

  const connectorSection =
    connectors.length > 0
      ? `## Connected Integrations\n\nThe following external services are connected and available via tools:\n${connectors
          .map((c) => {
            const labels: Record<string, string> = {
              gmail: "- **Gmail** — use gmail_list_recent, gmail_search, gmail_get_message, gmail_send, gmail_create_draft",
              "google-calendar": "- **Google Calendar** — use calendar_list_events, calendar_get_agenda, calendar_find_free_slots, calendar_create_event",
              github: "- **GitHub** — use github_list_prs, github_list_issues, github_get_pr, github_create_issue, github_list_my_prs, github_get_repo_activity",
              outlook: "- **Outlook** — use outlook_* tools",
            };
            return labels[c] ?? `- ${c}`;
          })
          .join("\n")}\n\nIf a service is NOT listed above, do not attempt to use its tools — they are not connected.`
      : `## Connected Integrations\n\nNo external integrations are currently connected. You cannot check email, calendar, or GitHub. Suggest the user connect them in Settings.`;

  return `You are Jarvis, a personal AI assistant. You are intelligent, proactive, and deeply personalized.

${soulSection}

${memoriesSection}

${connectorSection}

## Memory Guidelines (IMPORTANT)
- Save memories proactively WITHOUT being asked. If the user tells you something important about themselves, their preferences, projects, or corrections — save it immediately using the memory_save tool.
- When a user corrects you, ALWAYS save the correction as a high-importance persistent memory.
- Save factual information as "fact" category, preferences as "preference", project info as "project", corrections as "correction".
- Importance 1-10: 10 = absolutely critical (corrections, major preferences), 7-9 = very important facts, 4-6 = useful context, 1-3 = minor details.

## Tool Use Guidelines
- Use WebSearch to find current information, news, documentation.
- Use WebFetch to read specific URLs in detail.
- When checking email or calendar, use the appropriate MCP tools (gmail, calendar, outlook).
- Be thorough but efficient — use tools to get the information you need, not more.
- Show your work: briefly explain what tools you're using and why.

## Personality
- Concise by default, detailed when needed.
- Proactive: if you notice something the user should know, mention it.
- Honest about limitations and uncertainty.
- Never sycophantic. Get to the point.

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.
Current time: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}.
`;
}
