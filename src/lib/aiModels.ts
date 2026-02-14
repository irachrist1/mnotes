/**
 * Shared AI model options — used by both onboarding setup and Settings page.
 */

export type ModelOption = {
  value: string;
  label: string;
};

export const OPENROUTER_MODELS: ModelOption[] = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Newest, fast)" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro (Newest, powerful)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Stable, cheap)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Deep reasoning)" },
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (Best for analysis)" },
  { value: "openai/gpt-4o", label: "GPT-4o (Good all-rounder)" },
  { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick (Open source)" },
];

export const GOOGLE_MODELS: ModelOption[] = [
  { value: "gemini-3-flash-preview", label: "Gemini 3 Flash (Newest, fast)" },
  { value: "gemini-3-pro-preview", label: "Gemini 3 Pro (Newest, powerful)" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Stable)" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite (Ultra fast)" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Deep reasoning)" },
];

export const DEFAULT_PROVIDER = "openrouter" as const;
export const DEFAULT_MODEL = "google/gemini-2.5-flash";
