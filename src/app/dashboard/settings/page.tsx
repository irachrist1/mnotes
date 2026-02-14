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
  DEFAULT_PROVIDER,
  DEFAULT_MODEL,
} from "@/lib/aiModels";
import { track } from "@/lib/analytics";

export default function SettingsPage() {
  const settings = useQuery(api.userSettings.get, {});
  const upsertSettings = useMutation(api.userSettings.upsert);

  const [provider, setProvider] = useState<"openrouter" | "google">(DEFAULT_PROVIDER);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [saving, setSaving] = useState(false);

  // Track whether keys are already configured server-side
  const [hasOpenrouterKey, setHasOpenrouterKey] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);

  // Load settings when available (API keys are masked, don't populate inputs)
  useEffect(() => {
    if (settings) {
      setProvider(settings.aiProvider);
      setModel(settings.aiModel);
      setHasOpenrouterKey(!!settings.openrouterApiKey);
      setHasGoogleKey(!!settings.googleApiKey);
      // Don't load masked key values into the input fields
    }
  }, [settings]);

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
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const modelOptions = provider === "openrouter" ? OPENROUTER_MODELS : GOOGLE_MODELS;

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
          </div>
        </div>

        {/* Feedback */}
        <FeedbackWidget />
      </div>
    </>
  );
}
