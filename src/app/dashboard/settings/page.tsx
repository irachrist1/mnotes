"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Save, Key, Sparkles } from "lucide-react";
import { FeedbackWidget } from "@/components/ui/FeedbackWidget";
import { Select } from "@/components/ui/Select";
import { toast } from "sonner";
import {
  OPENROUTER_MODELS,
  GOOGLE_MODELS,
  ANTHROPIC_MODELS,
  DEFAULT_PROVIDER,
  DEFAULT_MODEL,
} from "@/lib/aiModels";
import { track } from "@/lib/analytics";

const BUILTIN_AGENT_TOOLS: { name: string; description: string }[] = [
  { name: "read_soul_file", description: "Reads your soul file (profile / long-term memory)." },
  { name: "list_tasks", description: "Lists your tasks." },
  { name: "list_income_streams", description: "Lists your income streams." },
  { name: "list_ideas", description: "Lists your idea bank." },
  { name: "list_mentorship_sessions", description: "Lists your mentorship sessions." },
  { name: "search_insights", description: "Searches saved insights." },
  { name: "get_task_result", description: "Reads output from a previous agent task." },
  { name: "ask_user", description: "Asks a clarifying question and pauses the agent." },
  { name: "create_file", description: "Creates a draft document/checklist/table and saves it as an agent file." },
  { name: "request_approval", description: "Requests approval for external or irreversible actions (pause/resume)." },
];

export default function SettingsPage() {
  const settings = useQuery(api.userSettings.get, {});
  const upsertSettings = useMutation(api.userSettings.upsert);

  const [provider, setProvider] = useState<"openrouter" | "google" | "anthropic">(DEFAULT_PROVIDER);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [saving, setSaving] = useState(false);

  // Track whether keys are already configured server-side
  const [hasOpenrouterKey, setHasOpenrouterKey] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);

  // Load settings when available (API keys are masked, don't populate inputs)
  useEffect(() => {
    if (settings) {
      setProvider(settings.aiProvider);
      setModel(settings.aiModel);
      setHasOpenrouterKey(!!settings.openrouterApiKey);
      setHasGoogleKey(!!settings.googleApiKey);
      setHasAnthropicKey(!!(settings as any).anthropicApiKey);
      // Don't load masked key values into the input fields
    }
  }, [settings]);

  // Keep model sane when switching providers.
  useEffect(() => {
    if (provider === "anthropic" && !model.startsWith("claude-")) {
      setModel(ANTHROPIC_MODELS[0].value);
    }
    if (provider !== "anthropic" && model.startsWith("claude-")) {
      setModel(DEFAULT_MODEL);
    }
  }, [provider]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send API keys if user entered new values. Omitting them
      // preserves the existing key server-side (upsert patches, not replaces).
      await upsertSettings({
        aiProvider: provider,
        aiModel: model,
        openrouterApiKey: openrouterKey || undefined,
        googleApiKey: googleKey || undefined,
        anthropicApiKey: anthropicKey || undefined,
      });
      track("settings_saved", { provider, model });
      toast.success("Settings saved successfully");
      // Clear local key state after save so masked placeholder shows again
      if (openrouterKey) {
        setHasOpenrouterKey(true);
        setOpenrouterKey("");
      }
      if (googleKey) {
        setHasGoogleKey(true);
        setGoogleKey("");
      }
      if (anthropicKey) {
        setHasAnthropicKey(true);
        setAnthropicKey("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const modelOptions = provider === "openrouter"
    ? OPENROUTER_MODELS
    : provider === "google"
      ? GOOGLE_MODELS
      : ANTHROPIC_MODELS;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure your AI provider and preferences"
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving…" : "Save"}
          </button>
        }
      />

      <div className="max-w-2xl space-y-6">
        {/* AI Provider Section */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                AI Provider
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Choose your AI service provider
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                value="openrouter"
                checked={provider === "openrouter"}
                onChange={(e) => setProvider(e.target.value as "openrouter")}
                className="rounded-full border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
              />
              <div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  OpenRouter
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Access to multiple models (Gemini, Claude, GPT, Llama)
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                value="google"
                checked={provider === "google"}
                onChange={(e) => setProvider(e.target.value as "google")}
                className="rounded-full border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
              />
              <div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Google AI Studio
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Direct access to Gemini models
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                value="anthropic"
                checked={provider === "anthropic"}
                onChange={(e) => setProvider(e.target.value as "anthropic")}
                className="rounded-full border-stone-300 dark:border-stone-600 text-stone-900 focus:ring-stone-900"
              />
              <div>
                <div className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Anthropic
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  Direct access to Claude models (best for agent tasks)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Model Selection */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                AI Model
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Select the model for generating insights
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Select
              value={model}
              onChange={setModel}
              options={modelOptions}
            />
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Or enter a custom model name below
            </p>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g., google/gemini-2.5-flash"
              className="input-field w-full"
            />
          </div>
        </div>

        {/* API Keys */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                API Keys
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Your API keys are stored securely and never exposed to the client
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* OpenRouter API Key */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder={hasOpenrouterKey ? "Key configured. Enter new key to replace." : "sk-or-v1-..."}
                className="input-field w-full"
              />
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Get your key at{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-900 dark:text-stone-100 hover:underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>

            {/* Google AI Studio API Key */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Google AI Studio API Key
              </label>
              <input
                type="password"
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder={hasGoogleKey ? "Key configured. Enter new key to replace." : "AIza..."}
                className="input-field w-full"
              />
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Get your key at{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-900 dark:text-stone-100 hover:underline"
                >
                  aistudio.google.com/app/apikey
                </a>
              </p>
            </div>

            {/* Anthropic API Key */}
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder={hasAnthropicKey ? "Key configured. Enter new key to replace." : "sk-ant-..."}
                className="input-field w-full"
              />
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Get your key at{" "}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-900 dark:text-stone-100 hover:underline"
                >
                  console.anthropic.com/settings/keys
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Agent Tools */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Agent Capabilities
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Tools are the agent's \"hands\". They let it read your saved data and ask questions instead of guessing.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-3 bg-white/50 dark:bg-black/10">
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Tool-use mode</p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                Full model-driven tool calling is enabled for <span className="font-medium">Anthropic</span> (best reliability) and <span className="font-medium">OpenRouter</span> (model-dependent). Google currently runs in a fallback mode (the agent reads some data, but the model does not autonomously call tools yet).
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Built-in tools (always available)</p>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {BUILTIN_AGENT_TOOLS.map((t) => (
                  <div key={t.name} className="rounded-md border border-stone-200 dark:border-stone-800 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-mono text-stone-900 dark:text-stone-100">{t.name}</span>
                      <span className="text-[10px] text-stone-400">built-in</span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-3 bg-white/50 dark:bg-black/10">
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Connections (coming next)</p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                Email, calendar, GitHub, web search, and other external tools will appear here once the connector system ships (with connect/disconnect and approvals).
              </p>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <FeedbackWidget />
      </div>
    </>
  );
}
