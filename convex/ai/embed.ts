import { action } from "../_generated/server";
import { v } from "convex/values";

const DEFAULT_DIMENSIONS = 1536;
const MAX_TEXT_LENGTH = 20_000;

type EmbedResponse = {
  embedding: number[];
  provider: "openrouter" | "google";
  model: string;
  dimensions: number;
  version: "v1";
};

export const embedText = action({
  args: {
    text: v.string(),
    provider: v.union(v.literal("openrouter"), v.literal("google")),
    apiKey: v.string(),
    model: v.optional(v.string()),
    dimensions: v.optional(v.number()),
  },
  handler: async (_ctx, args): Promise<EmbedResponse> => {
    const text = args.text.trim();
    if (text.length === 0) {
      throw new Error("Text cannot be empty for embeddings");
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new Error(`Text is too long for embeddings (max ${MAX_TEXT_LENGTH} chars)`);
    }

    const provider = args.provider;
    const apiKey = args.apiKey;
    const dimensions = normalizeDimensions(args.dimensions);
    if (provider === "openrouter") {
      const model = args.model || "openai/text-embedding-3-small";
      const embedding = await callOpenRouterEmbedding({
        apiKey,
        text,
        model,
        dimensions,
      });
      return {
        embedding,
        provider,
        model,
        dimensions,
        version: "v1",
      };
    }

    const model = args.model || "text-embedding-004";
    const embedding = await callGoogleEmbedding({
      apiKey,
      text,
      model,
      dimensions,
    });
    return {
      embedding,
      provider,
      model,
      dimensions,
      version: "v1",
    };
  },
});

async function callOpenRouterEmbedding(args: {
  apiKey: string;
  text: string;
  model: string;
  dimensions: number;
}): Promise<number[]> {
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${args.apiKey}`,
      "HTTP-Referer": "https://mnotes.app",
      "X-Title": "MNotes AI",
    },
    body: JSON.stringify({
      model: args.model,
      input: args.text,
      dimensions: args.dimensions,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter embedding error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };
  const vector = data.data?.[0]?.embedding;
  if (!vector || !Array.isArray(vector)) {
    throw new Error("OpenRouter embedding response was empty");
  }
  return normalizeEmbedding(vector, args.dimensions);
}

async function callGoogleEmbedding(args: {
  apiKey: string;
  text: string;
  model: string;
  dimensions: number;
}): Promise<number[]> {
  const modelPath = args.model.startsWith("models/")
    ? args.model
    : `models/${args.model}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${modelPath}:embedContent?key=${args.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          role: "user",
          parts: [{ text: args.text }],
        },
        taskType: "RETRIEVAL_DOCUMENT",
        outputDimensionality: args.dimensions,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google embedding error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as {
    embedding?: { values?: number[] };
  };
  const vector = data.embedding?.values;
  if (!vector || !Array.isArray(vector)) {
    throw new Error("Google embedding response was empty");
  }
  return normalizeEmbedding(vector, args.dimensions);
}

function normalizeDimensions(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_DIMENSIONS;
  }
  return Math.max(128, Math.min(3072, Math.floor(value)));
}

function normalizeEmbedding(values: number[], dimensions: number): number[] {
  if (values.length === dimensions) return values;
  if (values.length > dimensions) return values.slice(0, dimensions);
  return [...values, ...new Array(dimensions - values.length).fill(0)];
}
