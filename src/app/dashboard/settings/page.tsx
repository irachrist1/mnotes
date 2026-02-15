"use client";

import { useState, useEffect, useRef } from "react";
import { useAction, useQuery, useMutation } from "convex/react";
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
  { name: "list_agent_files", description: "Lists agent-created draft files." },
  { name: "read_agent_file", description: "Reads an agent-created file." },
  { name: "update_agent_file", description: "Updates an agent-created file." },
  { name: "create_task", description: "Creates a new task (optionally queues Jarvis to run on it)." },
  { name: "update_task", description: "Updates a task (mark done, update notes, etc.)." },
  { name: "send_notification", description: "Sends an in-app notification." },
  { name: "request_approval", description: "Requests approval for external or irreversible actions (pause/resume)." },
  { name: "web_search", description: "Searches the public web (requires approval per task; optional Tavily key)." },
  { name: "read_url", description: "Reads a public URL into text/markdown (requires approval per task)." },
];

export default function SettingsPage() {
  const settings = useQuery(api.userSettings.get, {});
  const soulFile = useQuery(api.soulFile.get, {});
  const soulRevisions = useQuery(api.soulFileRevisions.list, { limit: 8 });
  const upsertSettings = useMutation(api.userSettings.upsert);
  const evolveSoul = useMutation(api.soulFile.evolve);
  const restoreSoulRevision = useMutation(api.soulFileRevisions.restore);
  const connectors = useQuery(api.connectors.tokens.list, {});
  const clearConnectorToken = useMutation(api.connectors.tokens.clearToken);
  const startGoogleOauth = useAction(api.connectors.googleOauth.start);
  const startGithubOauth = useAction(api.connectors.githubOauth.start);

  const [provider, setProvider] = useState<"openrouter" | "google" | "anthropic">(DEFAULT_PROVIDER);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [searchProvider, setSearchProvider] = useState<"jina" | "tavily" | "perplexity">("jina");
  const [searchApiKey, setSearchApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasGithubToken, setHasGithubToken] = useState(false);
  const [connectingGithub, setConnectingGithub] = useState<null | "read" | "write">(null);
  const [connectingGoogle, setConnectingGoogle] = useState<null | "gmail" | "google-calendar">(null);

  const [soulDraft, setSoulDraft] = useState("");
  const [soulDirty, setSoulDirty] = useState(false);
  const [savingSoul, setSavingSoul] = useState(false);
  const [restoringSoulRevId, setRestoringSoulRevId] = useState<string | null>(null);
  const soulHydratedRef = useRef(false);

  // Track whether keys are already configured server-side
  const [hasOpenrouterKey, setHasOpenrouterKey] = useState(false);
  const [hasGoogleKey, setHasGoogleKey] = useState(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [hasSearchKey, setHasSearchKey] = useState(false);

  // Load settings when available (API keys are masked, don't populate inputs)
  useEffect(() => {
    if (settings) {
      setProvider(settings.aiProvider);
      setModel(settings.aiModel);
      setHasOpenrouterKey(!!settings.openrouterApiKey);
      setHasGoogleKey(!!settings.googleApiKey);
      setHasAnthropicKey(!!(settings as any).anthropicApiKey);
      setSearchProvider(((settings as any).searchProvider as "jina" | "tavily" | "perplexity" | undefined) ?? "jina");
      setHasSearchKey(!!(settings as any).searchApiKey);
      // Don't load masked key values into the input fields
    }
  }, [settings]);

  // Hydrate the soul file draft once.
  useEffect(() => {
    if (soulHydratedRef.current) return;
    if (!soulFile) return;
    soulHydratedRef.current = true;
    setSoulDraft(soulFile.content ?? "");
    setSoulDirty(false);
  }, [soulFile]);

  useEffect(() => {
    if (!connectors) return;
    const gh = connectors.find((c) => c.provider === "github");
    setHasGithubToken(Boolean(gh?.connected));
  }, [connectors]);

  const githubConn = connectors?.find((c) => c.provider === "github");
  const githubScopes = Array.isArray((githubConn as any)?.scopes) ? (githubConn as any).scopes as string[] : [];
  const hasGithubWrite = githubScopes.includes("repo") || githubScopes.includes("public_repo");

  const gmailConn = connectors?.find((c) => c.provider === "gmail");
  const calConn = connectors?.find((c) => c.provider === "google-calendar");
  const hasGmail = Boolean(gmailConn?.connected);
  const hasCalendar = Boolean(calConn?.connected);
  const gmailScopes = Array.isArray((gmailConn as any)?.scopes) ? (gmailConn as any).scopes as string[] : [];
  const calScopes = Array.isArray((calConn as any)?.scopes) ? (calConn as any).scopes as string[] : [];

  const hasGmailWrite = gmailScopes.includes("https://www.googleapis.com/auth/gmail.compose")
    || gmailScopes.includes("https://www.googleapis.com/auth/gmail.modify")
    || gmailScopes.includes("https://mail.google.com/");

  const hasCalendarWrite = calScopes.includes("https://www.googleapis.com/auth/calendar");

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = (event as any)?.data;
      if (!data || typeof data !== "object") return;

      const type = String((data as any).type || "");
      const provider = String((data as any).provider || "");
      if (type === "mnotes:connector_connected") {
        if (provider === "gmail" || provider === "google-calendar") {
          toast.success(provider === "gmail" ? "Gmail connected" : "Google Calendar connected");
          track("connector_connected", { provider });
        } else if (provider === "github") {
          toast.success("GitHub connected");
          track("connector_connected", { provider });
        } else {
          toast.success("Connector connected");
        }
        setConnectingGithub(null);
        setConnectingGoogle(null);
      }
      if (type === "mnotes:connector_error") {
        const err = String((data as any).error || "Connection failed");
        toast.error(err);
        track("connector_error", { provider: provider || undefined, error: err });
        setConnectingGithub(null);
        setConnectingGoogle(null);
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

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
        searchProvider,
        searchApiKey: (searchProvider === "tavily" || searchProvider === "perplexity") ? (searchApiKey || undefined) : undefined,
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
      if (searchApiKey && (searchProvider === "tavily" || searchProvider === "perplexity")) {
        setHasSearchKey(true);
        setSearchApiKey("");
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

  const connectGoogle = async (provider: "gmail" | "google-calendar", access: "read" | "write") => {
    if (connectingGoogle) return;
    setConnectingGoogle(provider);
    try {
      const { authUrl } = await startGoogleOauth({ provider, origin: window.location.origin, access });
      const w = 520;
      const h = 680;
      const left = Math.max(0, Math.round((window.screen.width - w) / 2));
      const top = Math.max(0, Math.round((window.screen.height - h) / 2));
      const popup = window.open(
        authUrl,
        "mnotes_google_oauth",
        `popup=yes,width=${w},height=${h},left=${left},top=${top}`
      );
      if (!popup) {
        toast.error("Popup blocked. Allow popups and try again.");
        setConnectingGoogle(null);
        return;
      }

      // Best-effort: clear the "connecting" state if the user closes the popup without completing.
      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          if (Date.now() - startedAt > 1500) setConnectingGoogle(null);
        }
      }, 700);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start Google OAuth");
      setConnectingGoogle(null);
    }
  };

  const connectGithub = async (access: "read" | "write") => {
    if (connectingGithub) return;
    setConnectingGithub(access);
    try {
      const { authUrl } = await startGithubOauth({ origin: window.location.origin, access });
      const w = 520;
      const h = 680;
      const left = Math.max(0, Math.round((window.screen.width - w) / 2));
      const top = Math.max(0, Math.round((window.screen.height - h) / 2));
      const popup = window.open(
        authUrl,
        "mnotes_github_oauth",
        `popup=yes,width=${w},height=${h},left=${left},top=${top}`
      );
      if (!popup) {
        toast.error("Popup blocked. Allow popups and try again.");
        setConnectingGithub(null);
        return;
      }

      const startedAt = Date.now();
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          if (Date.now() - startedAt > 1500) setConnectingGithub(null);
        }
      }, 700);
    } catch (err) {
      console.error(err);
      toast.error("Failed to start GitHub OAuth");
      setConnectingGithub(null);
    }
  };

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
              placeholder="e.g., google/gemini-3-flash-preview"
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

        {/* Web Tools */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Web Tools (Search + Read URL)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                These tools let Jarvis search the public web and read links. The agent will always ask for approval before using them.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Search provider
              </label>
              <Select
                value={searchProvider}
                onChange={(val) => setSearchProvider(val as "jina" | "tavily" | "perplexity")}
                options={[
                  { value: "jina", label: "Jina (no key, returns digest)" },
                  { value: "tavily", label: "Tavily (API key required)" },
                  { value: "perplexity", label: "Perplexity (API key required)" },
                ]}
              />
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Jina works without a key, but results are less structured. Tavily and Perplexity return structured results but need a key.
              </p>
            </div>

            {(searchProvider === "tavily" || searchProvider === "perplexity") && (
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  {searchProvider === "tavily" ? "Tavily API Key" : "Perplexity API Key"}
                </label>
                <input
                  type="password"
                  value={searchApiKey}
                  onChange={(e) => setSearchApiKey(e.target.value)}
                  placeholder={hasSearchKey ? "Key configured. Enter new key to replace." : (searchProvider === "tavily" ? "tvly-..." : "pplx-...")}
                  className="input-field w-full"
                />
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Get a key at{" "}
                  <a
                    href={searchProvider === "tavily" ? "https://app.tavily.com/" : "https://www.perplexity.ai/settings/api"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-900 dark:text-stone-100 hover:underline"
                  >
                    {searchProvider === "tavily" ? "app.tavily.com" : "perplexity.ai/settings/api"}
                  </a>
                </p>
              </div>
            )}
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
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">Connections</p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                When a service is connected below, Jarvis can use it as tools during tasks. External side-effects will always require approval.
              </p>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-stone-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Memory (Soul File)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                This is Jarvis's long-term memory about you. You can edit it, and restore older versions.
              </p>
            </div>
          </div>

          {!soulFile ? (
            <p className="text-xs text-stone-500 dark:text-stone-400">
              No soul file yet. Complete onboarding first.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Version {soulFile.version} · last updated {new Date(soulFile.updatedAt).toLocaleString()}
                </p>
                <button
                  onClick={async () => {
                    if (savingSoul) return;
                    setSavingSoul(true);
                    try {
                      await evolveSoul({ content: soulDraft });
                      setSoulDirty(false);
                      toast.success("Memory saved");
                      track("memory_saved");
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to save memory");
                    } finally {
                      setSavingSoul(false);
                    }
                  }}
                  disabled={savingSoul || !soulDirty}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium btn-primary disabled:opacity-60"
                >
                  {savingSoul ? "Saving…" : soulDirty ? "Save" : "Saved"}
                </button>
              </div>

              <textarea
                value={soulDraft}
                onChange={(e) => {
                  setSoulDraft(e.target.value);
                  setSoulDirty(true);
                }}
                className="input-field w-full h-56 font-mono text-xs"
              />

              <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-4 bg-white/50 dark:bg-black/10">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    Version history
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    {Array.isArray(soulRevisions) ? `${soulRevisions.length} saved` : "Loading…"}
                  </p>
                </div>

                {!Array.isArray(soulRevisions) ? (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Loading…</p>
                ) : soulRevisions.length === 0 ? (
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                    No previous versions yet.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {soulRevisions.map((r: any) => (
                      <div key={r._id} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] text-stone-700 dark:text-stone-200">
                            v{r.version} · {r.source === "ai-evolve" ? "AI evolve" : "Manual"} · {new Date(r.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            if (restoringSoulRevId) return;
                            if (!confirm(`Restore soul file to version v${r.version}? This will create a new version.`)) return;
                            setRestoringSoulRevId(String(r._id));
                            try {
                              await restoreSoulRevision({ revisionId: r._id });
                              setSoulDirty(false);
                              soulHydratedRef.current = false; // rehydrate textarea on next query update
                              toast.success("Restored");
                              track("memory_restored", { version: r.version });
                            } catch (err) {
                              console.error(err);
                              toast.error("Failed to restore");
                            } finally {
                              setRestoringSoulRevId(null);
                            }
                          }}
                          disabled={!!restoringSoulRevId}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Connections */}
        <div className="card p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-stone-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Connections
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Connect external services so Jarvis can take real actions (with approvals).
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    GitHub
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {hasGithubToken ? "Connected" : "Not connected"}
                  </p>
                </div>
                {hasGithubToken ? (
                  <button
                    onClick={async () => {
                      try {
                        await clearConnectorToken({ provider: "github" });
                        toast.success("GitHub disconnected");
                        setHasGithubToken(false);
                        track("connector_disconnected", { provider: "github" });
                      } catch {
                        toast.error("Failed to disconnect GitHub");
                      } finally {
                        setConnectingGithub(null);
                      }
                    }}
                    disabled={!!connectingGithub}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => void connectGithub("read")}
                    disabled={!!connectingGithub}
                    className="px-3 py-1.5 rounded-md text-xs font-medium btn-primary disabled:opacity-60"
                  >
                    {connectingGithub ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>

              {hasGithubToken && (
                <div className="mt-3 rounded-md bg-black/5 dark:bg-white/[0.06] p-3">
                  <p className="text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                    Tools unlocked
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {[
                      { name: "github_list_my_pull_requests", desc: "Lists your open PRs (read-only)." },
                      ...(hasGithubWrite ? [{ name: "github_create_issue", desc: "Creates an issue (requires approval)." }] : []),
                    ].map((t) => (
                      <div key={t.name} className="flex items-start justify-between gap-3">
                        <span className="text-[11px] font-mono text-stone-900 dark:text-stone-100">
                          {t.name}
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {t.desc}
                        </span>
                      </div>
                    ))}
                  </div>

                  {!hasGithubWrite && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Connected without repo write scope. Enable write to create issues (scope: repo).
                      </p>
                      <button
                        onClick={() => void connectGithub("write")}
                        disabled={!!connectingGithub}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                      >
                        Enable write
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    Gmail
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {hasGmail ? "Connected" : "Not connected"}
                  </p>
                </div>
                {hasGmail ? (
                  <button
                    onClick={async () => {
                      try {
                        await clearConnectorToken({ provider: "gmail" });
                        toast.success("Gmail disconnected");
                        track("connector_disconnected", { provider: "gmail" });
                      } catch {
                        toast.error("Failed to disconnect Gmail");
                      }
                    }}
                    disabled={connectingGoogle === "gmail"}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => void connectGoogle("gmail", "read")}
                    disabled={!!connectingGoogle}
                    className="px-3 py-1.5 rounded-md text-xs font-medium btn-primary disabled:opacity-60"
                  >
                    {connectingGoogle === "gmail" ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>

              {hasGmail && (
                <div className="mt-3 rounded-md bg-black/5 dark:bg-white/[0.06] p-3">
                  <p className="text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                    Tools unlocked
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {[
                      { name: "gmail_list_recent", desc: "Lists recent email headers (read-only)." },
                      ...(hasGmailWrite ? [
                        { name: "gmail_create_draft", desc: "Creates a draft email (no send)." },
                        { name: "gmail_send_email", desc: "Sends an email (requires approval)." },
                      ] : []),
                    ].map((t) => (
                      <div key={t.name} className="flex items-start justify-between gap-3">
                        <span className="text-[11px] font-mono text-stone-900 dark:text-stone-100">
                          {t.name}
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {t.desc}
                        </span>
                      </div>
                    ))}
                  </div>

                  {!hasGmailWrite && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Connected read-only. Enable write to draft/send.
                      </p>
                      <button
                        onClick={() => void connectGoogle("gmail", "write")}
                        disabled={!!connectingGoogle}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                      >
                        Enable write
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-stone-200 dark:border-stone-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    Google Calendar
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {hasCalendar ? "Connected" : "Not connected"}
                  </p>
                </div>
                {hasCalendar ? (
                  <button
                    onClick={async () => {
                      try {
                        await clearConnectorToken({ provider: "google-calendar" });
                        toast.success("Google Calendar disconnected");
                        track("connector_disconnected", { provider: "google-calendar" });
                      } catch {
                        toast.error("Failed to disconnect Google Calendar");
                      }
                    }}
                    disabled={connectingGoogle === "google-calendar"}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => void connectGoogle("google-calendar", "read")}
                    disabled={!!connectingGoogle}
                    className="px-3 py-1.5 rounded-md text-xs font-medium btn-primary disabled:opacity-60"
                  >
                    {connectingGoogle === "google-calendar" ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>

              {hasCalendar && (
                <div className="mt-3 rounded-md bg-black/5 dark:bg-white/[0.06] p-3">
                  <p className="text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                    Tools unlocked
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {[
                      { name: "calendar_list_upcoming", desc: "Lists upcoming events (read-only)." },
                      ...(hasCalendarWrite ? [
                        { name: "calendar_create_event", desc: "Creates an event (requires approval)." },
                      ] : []),
                    ].map((t) => (
                      <div key={t.name} className="flex items-start justify-between gap-3">
                        <span className="text-[11px] font-mono text-stone-900 dark:text-stone-100">
                          {t.name}
                        </span>
                        <span className="text-[11px] text-stone-500 dark:text-stone-400">
                          {t.desc}
                        </span>
                      </div>
                    ))}
                  </div>

                  {!hasCalendarWrite && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        Connected read-only. Enable write to create events.
                      </p>
                      <button
                        onClick={() => void connectGoogle("google-calendar", "write")}
                        disabled={!!connectingGoogle}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.06] disabled:opacity-60"
                      >
                        Enable write
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback */}
        <FeedbackWidget />
      </div>
    </>
  );
}
