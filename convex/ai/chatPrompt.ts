/**
 * Chat prompt builder — dynamically describes the schema so the AI
 * knows what tables/fields it can write to. Zero hardcoded intents.
 *
 * The schema description is derived from the actual Convex schema shape.
 * Adding a new table means the chat automatically supports it.
 */

// ---------------------------------------------------------------------------
// Schema description: derived from convex/schema.ts
// We describe each writable domain table, its fields, types, and constraints.
// This is built once and included in the system prompt.
//
// NOTE: This reads from the schema definition at import time.
// When you add a new table to schema.ts, add its description here too.
// The chat will then automatically support creating records in it.
// ---------------------------------------------------------------------------

type FieldDescription = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
};

type TableDescription = {
  name: string;
  description: string;
  fields: FieldDescription[];
};

/**
 * Tables the AI is allowed to write to via chat intents.
 * System tables (userSettings, aiInsights, savedInsights, soulFiles, chatMessages)
 * are excluded — those are managed by the system, not user chat.
 */
const WRITABLE_TABLES: TableDescription[] = [
  {
    name: "incomeStreams",
    description:
      "Income streams — recurring revenue sources like consulting, employment, products, content, or project-based work",
    fields: [
      { name: "name", type: "string", required: true, description: "Name of the income stream" },
      {
        name: "category",
        type: 'enum: "consulting" | "employment" | "content" | "product" | "project-based"',
        required: true,
      },
      {
        name: "status",
        type: 'enum: "active" | "developing" | "planned" | "paused"',
        required: true,
      },
      { name: "monthlyRevenue", type: "number", required: true, description: "Monthly revenue in dollars" },
      { name: "timeInvestment", type: "number", required: true, description: "Hours per week" },
      { name: "growthRate", type: "number", required: true, description: "Growth rate as percentage" },
      { name: "notes", type: "string", required: false },
      { name: "clientInfo", type: "string", required: false },
    ],
  },
  {
    name: "ideas",
    description:
      "Ideas pipeline — business ideas at various stages from raw thought to launched",
    fields: [
      { name: "title", type: "string", required: true },
      { name: "description", type: "string", required: true },
      { name: "category", type: "string", required: true },
      {
        name: "stage",
        type: 'enum: "raw-thought" | "researching" | "validating" | "developing" | "testing" | "launched"',
        required: true,
      },
      {
        name: "potentialRevenue",
        type: 'enum: "low" | "medium" | "high" | "very-high"',
        required: true,
      },
      {
        name: "implementationComplexity",
        type: "number (1-10)",
        required: true,
      },
      { name: "timeToMarket", type: "string", required: true, description: "e.g. '2 months', '6 weeks'" },
      { name: "requiredSkills", type: "string[]", required: true },
      { name: "marketSize", type: "string", required: true },
      {
        name: "competitionLevel",
        type: 'enum: "low" | "medium" | "high"',
        required: true,
      },
      { name: "aiRelevance", type: "boolean", required: true },
      { name: "hardwareComponent", type: "boolean", required: true },
      { name: "relatedIncomeStream", type: "string", required: false },
      { name: "sourceOfInspiration", type: "string", required: true },
      { name: "nextSteps", type: "string[]", required: true },
      { name: "tags", type: "string[]", required: true },
    ],
  },
  {
    name: "mentorshipSessions",
    description:
      "Mentorship sessions — logs of giving or receiving mentorship, with topics, insights, and action items",
    fields: [
      { name: "mentorName", type: "string", required: true },
      { name: "date", type: "string (ISO date)", required: true },
      { name: "duration", type: "number (minutes, 1-480)", required: true },
      {
        name: "sessionType",
        type: 'enum: "giving" | "receiving"',
        required: true,
      },
      { name: "topics", type: "string[]", required: true },
      { name: "keyInsights", type: "string[]", required: true },
      {
        name: "actionItems",
        type: 'array of { task: string, priority: "low"|"medium"|"high", completed: boolean, dueDate?: string }',
        required: true,
      },
      { name: "rating", type: "number (1-10)", required: true },
      { name: "notes", type: "string", required: true },
    ],
  },
  {
    name: "actionableActions",
    description:
      "Actionable tasks — things the user commits to doing, derived from AI recommendations or user decisions. Tracked from proposal through completion.",
    fields: [
      { name: "title", type: "string", required: true, description: "Short task title" },
      { name: "description", type: "string", required: true, description: "What needs to be done" },
      {
        name: "priority",
        type: 'enum: "low" | "medium" | "high"',
        required: true,
      },
      { name: "dueDate", type: "string (ISO date)", required: false, description: "When it should be done" },
      { name: "aiNotes", type: "string", required: false, description: "AI reasoning or context for why this matters" },
    ],
  },
];

/**
 * Generate the schema description block for the system prompt.
 */
function buildSchemaDescription(): string {
  const lines: string[] = ["## Available Tables\n"];

  for (const table of WRITABLE_TABLES) {
    lines.push(`### ${table.name}`);
    lines.push(table.description);
    lines.push("");
    lines.push("Fields:");
    for (const field of table.fields) {
      const req = field.required ? "(required)" : "(optional)";
      const desc = field.description ? ` — ${field.description}` : "";
      lines.push(`  - ${field.name}: ${field.type} ${req}${desc}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Build a domain summary from actual user data.
 */
export function buildDomainSummary(data: {
  incomeStreams: Array<{ name: string; category: string; status: string; monthlyRevenue: number }>;
  ideas: Array<{ title: string; stage: string; category: string }>;
  sessions: Array<{ mentorName: string; date: string; rating: number }>;
}): string {
  const lines: string[] = ["## Current Data Summary\n"];

  // Income
  const totalRevenue = data.incomeStreams.reduce((s, i) => s + i.monthlyRevenue, 0);
  const activeStreams = data.incomeStreams.filter((i) => i.status === "active");
  lines.push(`Income: ${data.incomeStreams.length} streams, $${totalRevenue.toLocaleString()}/mo total, ${activeStreams.length} active`);
  if (data.incomeStreams.length > 0) {
    lines.push("  Streams: " + data.incomeStreams.map((s) => `${s.name} (${s.status}, $${s.monthlyRevenue}/mo)`).join(", "));
  }

  // Ideas
  lines.push(`Ideas: ${data.ideas.length} total`);
  if (data.ideas.length > 0) {
    const byStage = new Map<string, number>();
    for (const idea of data.ideas) {
      byStage.set(idea.stage, (byStage.get(idea.stage) ?? 0) + 1);
    }
    lines.push("  By stage: " + [...byStage.entries()].map(([stage, count]) => `${stage}: ${count}`).join(", "));
  }

  // Mentorship
  lines.push(`Mentorship: ${data.sessions.length} sessions`);
  if (data.sessions.length > 0) {
    const mentors = new Set(data.sessions.map((s) => s.mentorName));
    const avgRating = (data.sessions.reduce((s, m) => s + m.rating, 0) / data.sessions.length).toFixed(1);
    lines.push(`  Mentors: ${[...mentors].join(", ")} | Avg rating: ${avgRating}/10`);
  }

  return lines.join("\n");
}

/**
 * Extract a field value from the soul file markdown.
 */
function extractField(soulContent: string | null, field: string): string | null {
  if (!soulContent) return null;
  const regex = new RegExp(`^${field}:\\s*(.+)`, "mi");
  const match = soulContent.match(regex);
  return match?.[1]?.trim() || null;
}

/**
 * Extract a whole section's content from the soul file markdown.
 */
function extractSection(soulContent: string | null, section: string): string | null {
  if (!soulContent) return null;
  const regex = new RegExp(`## ${section}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = soulContent.match(regex);
  return match?.[1]?.trim() || null;
}

/**
 * Build the full system prompt for the chat AI.
 *
 * Modeled after OpenClaw/Jarvis: memory-first, personality-driven, action-oriented.
 * The soul file IS the AI's memory — read it first, reference it always.
 */
export function buildSystemPrompt(
  soulContent: string | null,
  domainSummary: string,
  recentMessages: Array<{ role: string; content: string }>
): string {
  const schemaBlock = buildSchemaDescription();
  const assistantName = extractField(soulContent, "Assistant Name");
  const userName = extractField(soulContent, "Name");
  const operatingPrinciples = extractSection(soulContent, "Operating Principles");
  const recentTurns = recentMessages
    .slice(-6)
    .map((m, index) => {
      const role = m.role === "assistant" ? "Assistant" : "User";
      return `${index + 1}. ${role}: ${m.content.replace(/\s+/g, " ").slice(0, 180)}`;
    })
    .join("\n");

  const name = assistantName ?? "MNotes";

  return `You are ${name}${userName ? `, ${userName}'s` : " — a"} personal AI assistant.

## FIRST: READ YOUR MEMORY

Your soul file below IS your long-term memory. It contains everything you know about this user — their name, goals, patterns, preferences, key events, and how they want you to behave. Read it. Trust it. Reference it.

When the user asks "do you remember" or "what do you know about me" — the answer is in your soul file.
When the user tells you something important (a goal, a preference, a life event) — acknowledge it naturally. The system auto-updates your memory after conversations.

${soulContent ? `### Soul File\n${soulContent}` : "(No soul file yet — this is a new user. Get to know them through conversation.)"}

## WHO YOU ARE

${assistantName ? `The user chose the name "${assistantName}" for you. Always refer to yourself as ${assistantName}. This name is yours.` : `Your default name is MNotes. If the user gives you a different name, use it.`}

${operatingPrinciples ? `## HOW TO BEHAVE (from your soul file)\n${operatingPrinciples}\n` : ""}## CORE BEHAVIOR

- **Do, don't explain.** When asked to do something, execute it. Skip "I'd be happy to help!" — just help.
- **Be resourceful.** Check the data summary and soul file before asking the user for info you already have.
- **No filler.** No "Great question!", no "Absolutely!", no walls of text. Be concise.
- **Have opinions.** You're allowed to disagree, suggest better approaches, and point out when something doesn't add up.
- **Be specific.** Use real numbers, names, and dates from the data. Don't speak in generalities about their own business.
- **Remember everything.** When you learn something new about the user, acknowledge it naturally. Your memory updates automatically.
${userName ? `- **Use their name.** The user is ${userName}. Use it naturally — not every message, but enough that they feel known.` : ""}

## YOUR CAPABILITIES

1. **Answer questions** about their data — revenue, ideas, mentorship, goals, patterns
2. **Create records** by proposing an intent the user can confirm (see below)
3. **Remember context** — your soul file carries everything important across conversations. You never start from scratch.
4. **Give advice** — you know their goals, patterns, and data. Be the advisor who connects the dots.

## HOW INTENTS WORK

When the user wants to create or update data, respond with your message AND a JSON intent block.
The intent block must be valid JSON wrapped in \`\`\`intent fences:

\`\`\`intent
{
  "table": "incomeStreams",
  "operation": "create",
  "data": {
    "name": "Acme Consulting",
    "category": "consulting",
    "status": "active",
    "monthlyRevenue": 3000,
    "timeInvestment": 10,
    "growthRate": 5,
    "notes": "New deal closed Feb 2026"
  }
}
\`\`\`

Rules:
- Only propose ONE intent per message.
- The "data" object must match the table's field schema exactly.
- For "create" operations, include ALL required fields. Fill in reasonable defaults for fields the user didn't mention (e.g., growthRate: 0, rating: 7, stage: "raw-thought").
- For "query" operations, just answer from the data summary — no intent block needed.
- NEVER propose writes to system tables (userSettings, aiInsights, savedInsights, soulFiles, chatMessages).
- If the user's request is ambiguous, ask for clarification instead of guessing.
- Keep your text reply conversational and brief. The intent block does the heavy lifting.

${schemaBlock}

## CURRENT DATA

${domainSummary}

## RECENT TURNS SNAPSHOT

${recentTurns || "(No recent turns in this thread yet.)"}
`;
}

/**
 * Parse an intent block from the AI's response text.
 * Returns null if no intent found.
 */
export function parseIntentFromResponse(text: string): {
  reply: string;
  intent: { table: string; operation: "create" | "update" | "query"; data?: Record<string, unknown> } | null;
} {
  const intentRegex = /```intent\s*\n([\s\S]*?)\n```/;
  const match = text.match(intentRegex);

  if (!match) {
    return { reply: text.trim(), intent: null };
  }

  // Remove the intent block from the visible reply
  const reply = text.replace(intentRegex, "").trim();

  try {
    const parsed = JSON.parse(match[1]);

    // Basic validation
    if (!parsed.table || !parsed.operation) {
      return { reply: text.trim(), intent: null };
    }

    // Validate table is a writable table
    const validTables = WRITABLE_TABLES.map((t) => t.name);
    if (!validTables.includes(parsed.table)) {
      return { reply: text.trim(), intent: null };
    }

    return {
      reply,
      intent: {
        table: parsed.table,
        operation: parsed.operation,
        data: parsed.data ?? undefined,
      },
    };
  } catch {
    // JSON parse failed — return plain reply
    return { reply: text.trim(), intent: null };
  }
}
