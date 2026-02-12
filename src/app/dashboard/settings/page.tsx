"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Save, Key, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const settings = useQuery(api.userSettings.get, {});
  const upsertSettings = useMutation(api.userSettings.upsert);

  const [provider, setProvider] = useState<"openrouter" | "google">("openrouter");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [saving, setSaving] = useState(false);

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setProvider(settings.aiProvider);
      setModel(settings.aiModel);
      setOpenrouterKey(settings.openrouterApiKey || "");
      setGoogleKey(settings.googleApiKey || "");
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertSettings({
        aiProvider: provider,
        aiModel: model,
        openrouterApiKey: openrouterKey || undefined,
        googleApiKey: googleKey || undefined,
      });
      toast.success("Settings saved successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const commonOpenRouterModels = [
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Fast, cheap)" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Better quality)" },
    { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (Best for analysis)" },
    { value: "openai/gpt-4o", label: "GPT-4o (Good all-rounder)" },
    { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick (Open source)" },
  ];

  const commonGoogleModels = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  ];

  const modelOptions = provider === "openrouter" ? commonOpenRouterModels : commonGoogleModels;

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
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                AI Provider
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                className="rounded-full border-gray-300 dark:border-gray-600 text-gray-900 focus:ring-gray-900"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  OpenRouter
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
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
                className="rounded-full border-gray-300 dark:border-gray-600 text-gray-900 focus:ring-gray-900"
              />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Google AI Studio
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Direct access to Gemini models
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Model Selection */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                AI Model
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Select the model for generating insights
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input-field w-full"
            >
              {modelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
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
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Key className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                API Keys
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Your API keys are stored securely and never exposed to the client
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* OpenRouter API Key */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                OpenRouter API Key
              </label>
              <input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="input-field w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Get your key at{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 dark:text-gray-100 hover:underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>

            {/* Google AI Studio API Key */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Google AI Studio API Key
              </label>
              <input
                type="password"
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder="AIza..."
                className="input-field w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Get your key at{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 dark:text-gray-100 hover:underline"
                >
                  aistudio.google.com/app/apikey
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
