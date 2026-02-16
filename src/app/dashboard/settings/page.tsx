"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Settings, Zap, Link2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  {
    id: "anthropic" as const,
    label: "Anthropic / Claude",
    description: "Claude Sonnet 4.5 · Opus 4.6",
    note: "Use API key, or run the agent server locally with Claude Code logged in for subscription access.",
  },
  {
    id: "google" as const,
    label: "Google Gemini",
    description: "Gemini 2.0 Flash",
    note: "Fast, cost-effective, great for most tasks.",
  },
  {
    id: "openrouter" as const,
    label: "OpenRouter",
    description: "Multi-model (Claude, GPT-4, Gemini, etc.)",
    note: "Access multiple models with a single API key.",
  },
];

const CONNECTORS = [
  { id: "gmail", label: "Gmail", icon: "📧", description: "Read, search, draft, and send emails" },
  { id: "google-calendar", label: "Google Calendar", icon: "📅", description: "View events, find free slots, create meetings" },
  { id: "outlook", label: "Outlook / Office 365", icon: "📨", description: "Read and send Outlook email + calendar" },
  { id: "github", label: "GitHub", icon: "🐙", description: "PRs, issues, repo activity" },
];

export default function SettingsPage() {
  const settings = useQuery(api.settings.get);
  const upsertSettings = useMutation(api.settings.upsert);

  const [provider, setProvider] = useState<"anthropic" | "google" | "openrouter">("anthropic");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [agentServerUrl, setAgentServerUrl] = useState("http://localhost:3001");
  const [agentServerSecret, setAgentServerSecret] = useState("");
  const [showKeys, setShowKeys] = useState(false);
  const [agentStatus, setAgentStatus] = useState<{
    mode?: string; model?: string; description?: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.aiProvider ?? "anthropic");
    setAgentServerUrl(settings.agentServerUrl ?? "http://localhost:3001");
  }, [settings]);

  const checkAgentStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/agent/status");
      const data = await res.json() as { mode?: string; model?: string; description?: string };
      setAgentStatus(data);
    } catch {
      setAgentStatus({ mode: "error", description: "Could not reach agent server" });
    } finally {
      setChecking(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await upsertSettings({
        aiProvider: provider,
        ...(anthropicKey ? { anthropicApiKey: anthropicKey } : {}),
        ...(googleKey ? { googleApiKey: googleKey } : {}),
        ...(openrouterKey ? { openrouterApiKey: openrouterKey } : {}),
        agentServerUrl: agentServerUrl || undefined,
        ...(agentServerSecret ? { agentServerSecret } : {}),
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-6 max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-semibold text-stone-200">Settings</h1>
        </div>
        <p className="text-sm text-stone-500">Configure Jarvis and connect your accounts.</p>
      </div>

      {/* Agent Server */}
      <section>
        <h2 className="text-sm font-semibold text-stone-300 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Agent Server
        </h2>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-4">
          <div>
            <label className="text-xs text-stone-500 block mb-1">Agent Server URL</label>
            <input
              type="url"
              value={agentServerUrl}
              onChange={(e) => setAgentServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-base sm:text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-amber-500/50 transition-colors"
            />
            <p className="text-xs text-stone-600 mt-1">
              Local: <code className="text-amber-400/70">http://localhost:3001</code> · VPS: your server URL
            </p>
          </div>
          <div>
            <label className="text-xs text-stone-500 block mb-1">Agent Server Secret (optional)</label>
            <div className="relative">
              <input
                type={showKeys ? "text" : "password"}
                value={agentServerSecret}
                onChange={(e) => setAgentServerSecret(e.target.value)}
                placeholder="Shared secret for request auth"
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 pr-9 text-base sm:text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-amber-500/50 transition-colors"
              />
              <button onClick={() => setShowKeys(!showKeys)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={checkAgentStatus} disabled={checking} className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors disabled:opacity-50">
              {checking ? "Checking…" : "Check connection"}
            </button>
            {agentStatus && (
              <div className="flex items-center gap-1.5 text-xs">
                {agentStatus.mode === "error"
                  ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span className={agentStatus.mode === "error" ? "text-red-400" : "text-stone-400"}>
                  {agentStatus.description}{agentStatus.model && ` · ${agentStatus.model}`}
                </span>
              </div>
            )}
          </div>
          <div className="bg-stone-800/50 rounded-lg px-3 py-2.5 text-xs text-stone-500 space-y-1">
            <p className="font-medium text-stone-400">Claude subscription access:</p>
            <p>Run <code className="text-amber-400">claude</code> CLI on your machine → log in once → agent server auto-uses your subscription. No API key needed locally.</p>
            <p className="text-stone-600">On VPS: set <code className="text-amber-400/70">ANTHROPIC_API_KEY</code> env var instead.</p>
          </div>
        </div>
      </section>

      {/* AI Provider */}
      <section>
        <h2 className="text-sm font-semibold text-stone-300 mb-3">AI Provider (fallback for Gemini)</h2>
        <div className="space-y-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${provider === p.id ? "bg-amber-500/10 border-amber-500/30" : "bg-stone-900 border-stone-800 hover:border-stone-700"}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${provider === p.id ? "bg-amber-400 border-amber-400" : "border-stone-600"}`} />
                <span className={`text-sm font-medium ${provider === p.id ? "text-amber-400" : "text-stone-300"}`}>{p.label}</span>
                <span className="text-xs text-stone-500 ml-auto">{p.description}</span>
              </div>
              {provider === p.id && <p className="text-xs text-stone-500 mt-2 ml-5">{p.note}</p>}
            </button>
          ))}
        </div>
        <div className="mt-4 bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400 font-medium">API Keys</span>
            <button onClick={() => setShowKeys(!showKeys)} className="text-stone-500 hover:text-stone-300">
              {showKeys ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {[
            { key: "anthropic", label: "Anthropic API Key", placeholder: "sk-ant-...", val: anthropicKey, set: setAnthropicKey, has: settings?.hasAnthropicKey },
            { key: "google", label: "Google AI Key", placeholder: "AIza...", val: googleKey, set: setGoogleKey, has: settings?.hasGoogleKey },
            { key: "openrouter", label: "OpenRouter API Key", placeholder: "sk-or-...", val: openrouterKey, set: setOpenrouterKey, has: settings?.hasOpenrouterKey },
          ].map(({ key, label, placeholder, val, set, has }) => (
            <div key={key}>
              <label className="text-xs text-stone-500 flex items-center gap-1.5 mb-1">
                {label}
                {has && <span className="text-emerald-500 text-xs">✓ saved</span>}
              </label>
              <input
                type={showKeys ? "text" : "password"}
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={has ? "••••••• (already saved)" : placeholder}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-base sm:text-sm text-stone-200 placeholder-stone-500 outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section>
        <h2 className="text-sm font-semibold text-stone-300 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-amber-400" />
          Integrations
        </h2>
        <div className="space-y-2">
          {CONNECTORS.map((connector) => (
            <div key={connector.id} className="flex items-center gap-3 bg-stone-900 border border-stone-800 rounded-xl p-3">
              <span className="text-xl">{connector.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-300">{connector.label}</div>
                <div className="text-xs text-stone-500">{connector.description}</div>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors flex-shrink-0">
                Connect
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-stone-600 mt-2">OAuth connector flows coming soon. GitHub uses a personal access token.</p>
      </section>

      {/* Save */}
      <div className="pb-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 text-stone-950 font-medium text-sm transition-colors"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
