/**
 * Memory MCP server — runs as a subprocess.
 * Provides tools for Jarvis to read/write the three-tier memory system in Convex.
 *
 * Uses the userId-accepting Convex functions (saveByUserId, searchByUserId,
 * listByTierByUserId) so this server can operate without an authenticated session.
 */

import { ConvexHttpClient } from "convex/browser";
import { createInterface } from "readline";

const CONVEX_URL = process.env.CONVEX_URL ?? "";
const USER_ID = process.env.USER_ID ?? "";

if (!CONVEX_URL) {
  process.stderr.write("memory-server: CONVEX_URL is required\n");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

const rl = createInterface({ input: process.stdin });

type MemoryRow = {
  tier: "persistent" | "archival" | "session";
  category: string;
  title: string;
  content: string;
  importance: number;
};

function respond(id: unknown, result: unknown) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}

function respondError(id: unknown, message: string) {
  process.stdout.write(
    JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code: -32000, message },
    }) + "\n"
  );
}

const TOOLS = [
  {
    name: "memory_save",
    description:
      "Save a memory about the user. Use this proactively to remember important facts, preferences, corrections, and project details. Always save when the user corrects you or shares important personal information.",
    inputSchema: {
      type: "object",
      properties: {
        tier: {
          type: "string",
          enum: ["persistent", "archival", "session"],
          description:
            "persistent: always loaded (facts/preferences). archival: on-demand (heavy docs). session: this conversation only.",
        },
        category: {
          type: "string",
          description:
            "Category: 'fact', 'preference', 'project', 'correction', 'note'",
        },
        title: {
          type: "string",
          description: "Short title for this memory (5-10 words)",
        },
        content: {
          type: "string",
          description: "The memory content to save",
        },
        importance: {
          type: "number",
          description:
            "Importance 1-10. Corrections=10, major preferences=8-9, facts=5-7, minor=1-4",
        },
      },
      required: ["tier", "category", "title", "content"],
    },
  },
  {
    name: "memory_search",
    description:
      "Search through stored memories. Use this when you need to recall something about the user.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for" },
        tier: {
          type: "string",
          enum: ["persistent", "archival", "session"],
          description: "Optional: filter by tier",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "memory_list",
    description: "List all persistent memories about the user.",
    inputSchema: {
      type: "object",
      properties: {
        tier: {
          type: "string",
          enum: ["persistent", "archival", "session"],
          description: "Which tier to list (default: persistent)",
        },
      },
    },
  },
];

rl.on("line", async (line) => {
  let req: {
    jsonrpc: string;
    id: unknown;
    method: string;
    params?: unknown;
  };
  try {
    req = JSON.parse(line);
  } catch {
    return;
  }

  const { id, method, params } = req;

  if (method === "initialize") {
    respond(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "memory", version: "1.0.0" },
    });
    return;
  }

  // Handle notifications/initialized (MCP lifecycle — no response needed)
  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list") {
    respond(id, { tools: TOOLS });
    return;
  }

  if (method === "tools/call") {
    const p = params as { name: string; arguments: Record<string, unknown> };
    try {
      const result = await handleTool(p.name, p.arguments);
      respond(id, {
        content: [
          {
            type: "text",
            text:
              typeof result === "string"
                ? result
                : JSON.stringify(result, null, 2),
          },
        ],
      });
    } catch (err) {
      respondError(id, err instanceof Error ? err.message : "Tool error");
    }
    return;
  }

  // Unknown method — respond with null per JSON-RPC
  respond(id, null);
});

async function handleTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "memory_save": {
      await convex.mutation("memory:saveByUserId" as any, {
        userId: USER_ID,
        tier: args.tier as "persistent" | "archival" | "session",
        category: String(args.category ?? "fact"),
        title: String(args.title),
        content: String(args.content),
        importance: typeof args.importance === "number" ? args.importance : 5,
        source: "agent" as const,
      });
      return `Memory saved: "${args.title}" (${args.tier}, importance ${args.importance ?? 5})`;
    }

    case "memory_search": {
      const results = (await convex.query("memory:searchByUserId" as any, {
        userId: USER_ID,
        query: String(args.query),
        tier: args.tier as
          | "persistent"
          | "archival"
          | "session"
          | undefined,
        limit: 10,
      })) as MemoryRow[];
      if (!results.length) return "No memories found for that query.";
      return results
        .map((m) => `[${m.tier}/${m.category}] **${m.title}**: ${m.content}`)
        .join("\n\n");
    }

    case "memory_list": {
      const tier =
        (args.tier as "persistent" | "archival" | "session") ?? "persistent";
      const results = (await convex.query(
        "memory:listByTierByUserId" as any,
        {
          userId: USER_ID,
          tier,
          limit: 30,
        }
      )) as MemoryRow[];
      if (!results.length) return `No ${tier} memories found.`;
      return results
        .map(
          (m) =>
            `- **${m.title}** (${m.category}, importance ${m.importance}): ${m.content}`
        )
        .join("\n");
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
