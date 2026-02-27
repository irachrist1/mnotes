"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Settings, Zap, Link2, CheckCircle2, AlertCircle, Eye, EyeOff, Mail, CalendarDays, Github, Bell, Clock } from "lucide-react";
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
    description: "Gemini 3 Flash",
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
  { id: "gmail", label: "Gmail", icon: Mail, description: "Read, search, draft, reply, and send emails" },
  { id: "google-calendar", label: "Google Calendar", icon: CalendarDays, description: "View events, find free slots, create meetings" },
  { id: "github", label: "GitHub", icon: Github, description: "PRs, issues, repo activity and repo automation" },
] as const;

type SupportedConnectorId = (typeof CONNECTORS)[number]["id"];

export default function SettingsPage() {
  const settings = useQuery(api.settings.get);
  const connectorStatus = useQuery(api.connectors.tokens.list);
  const upsertSettings = useMutation(api.settings.upsert);
  const clearToken = useMutation(api.connectors.tokens.clearToken);
  const startGoogleOauth = useAction(api.connectors.googleOauth.start);
  const startGithubOauth = useAction(api.connectors.githubOauth.start);

  const scheduledTasks = useQuery(api.scheduledTasks.list);
  const upsertScheduledTask = useMutation(api.scheduledTasks.upsert);
  const toggleScheduledTask = useMutation(api.scheduledTasks.toggle);
  const removeScheduledTask = useMutation(api.scheduledTasks.remove);

  const soulFile = useQuery(api.memory.getSoulFile);
  const upsertSoulFile = useMutation(api.memory.upsertSoulFile);

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soulFileContent, setSoulFileContent] = useState("");
  const [editingSoulFile, setEditingSoulFile] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(localStorage.getItem("jarvis:web-notifications-enabled") === "true");
  }, []);

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.aiProvider ?? "anthropic");
    setAgentServerUrl(settings.agentServerUrl ?? "http://localhost:3001");
  }, [settings]);

  useEffect(() => {
    if (soulFile?.content) setSoulFileContent(soulFile.content);
  }, [soulFile]);

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

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser notifications are not supported.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notification permission was denied.");
      return;
    }
    localStorage.setItem("jarvis:web-notifications-enabled", "true");
    setNotificationsEnabled(true);
    toast.success("Browser notifications enabled");
  };

  const connectConnector = async (connectorId: SupportedConnectorId) => {
    try {
      const origin = window.location.origin;
      const authUrl = connectorId === "github"
        ? (await startGithubOauth({ origin, access: "write" })).authUrl
        : (await startGoogleOauth({ provider: connectorId, origin, access: "write" })).authUrl;

      const popup = window.open(authUrl, "jarvis-connector-auth", "width=560,height=720");
      if (!popup) {
        toast.error("Popup blocked. Please allow popups and retry.");
        return;
      }

      const onMessage = (event: MessageEvent) => {
        const data = event.data as { type?: string; provider?: string; error?: string };
        if (data?.type === "mnotes:connector_connected") {
          toast.success(`${connectorId} connected`);
          window.removeEventListener("message", onMessage);
        }
        if (data?.type === "mnotes:connector_error") {
          toast.error(data.error || "Connector auth failed");
          window.removeEventListener("message", onMessage);
        }
      };

      window.addEventListener("message", onMessage);
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          window.removeEventListener("message", onMessage);
        }
      }, 500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to start OAuth flow");
    }
  };

  const disconnectConnector = async (connectorId: SupportedConnectorId) => {
    try {
      await clearToken({ provider: connectorId });
      toast.success(`${connectorId} disconnected`);
    } catch {
      toast.error("Disconnect failed");
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-6 max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-lg font-semibold text-stone-800 dark:text-stone-200">Settings</h1>
        </div>
        <p className="text-sm text-stone-500">Configure Jarvis and connect your accounts.</p>
      </div>

      {/* Agent Server */}
      <section>
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Agent Server
        </h2>
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-4">
          <div>
            <label className="text-xs text-stone-500 block mb-1">Agent Server URL</label>
            <input
              type="url"
              value={agentServerUrl}
              onChange={(e) => setAgentServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
              className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-base sm:text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-blue-500/50 transition-colors"
            />
            <p className="text-xs text-stone-400 dark:text-stone-600 mt-1">
              Local: <code className="text-blue-600 dark:text-blue-400/70">http://localhost:3001</code> · VPS: your server URL
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
                className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 pr-9 text-base sm:text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-blue-500/50 transition-colors"
              />
              <button onClick={() => setShowKeys(!showKeys)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
                {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={checkAgentStatus} disabled={checking} className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors disabled:opacity-50">
              {checking ? "Checking…" : "Check connection"}
            </button>
            {agentStatus && (
              <div className="flex items-center gap-1.5 text-xs">
                {agentStatus.mode === "error"
                  ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span className={agentStatus.mode === "error" ? "text-red-500 dark:text-red-400" : "text-stone-500 dark:text-stone-400"}>
                  {agentStatus.description}{agentStatus.model && ` · ${agentStatus.model}`}
                </span>
              </div>
            )}
          </div>
          <div className="bg-stone-100/50 dark:bg-stone-800/50 rounded-lg px-3 py-2.5 text-xs text-stone-500 space-y-1">
            <p className="font-medium text-stone-600 dark:text-stone-400">Claude subscription access:</p>
            <p>Run <code className="text-blue-600 dark:text-blue-400">claude</code> CLI on your machine → log in once → agent server auto-uses your subscription. No API key needed locally.</p>
            <p className="text-stone-400 dark:text-stone-600">On VPS: set <code className="text-blue-600/70 dark:text-blue-400/70">ANTHROPIC_API_KEY</code> env var instead.</p>
          </div>
        </div>
      </section>

      {/* AI Provider */}
      <section>
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">AI Provider (fallback for Gemini)</h2>
        <div className="space-y-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors ${provider === p.id ? "bg-blue-600/10 border-blue-600/30" : "bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${provider === p.id ? "bg-blue-600 border-blue-600" : "border-stone-300 dark:border-stone-600"}`} />
                <span className={`text-sm font-medium ${provider === p.id ? "text-blue-600 dark:text-blue-400" : "text-stone-700 dark:text-stone-300"}`}>{p.label}</span>
                <span className="text-xs text-stone-500 ml-auto">{p.description}</span>
              </div>
              {provider === p.id && <p className="text-xs text-stone-500 mt-2 ml-5">{p.note}</p>}
            </button>
          ))}
        </div>
        <div className="mt-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">API Keys</span>
            <button onClick={() => setShowKeys(!showKeys)} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
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
                className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-base sm:text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section>
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Integrations
        </h2>
        <div className="space-y-2">
          {CONNECTORS.map((connector) => {
            const status = connectorStatus?.find((c) => c.provider === connector.id);
            const Icon = connector.icon;
            const isConnected = Boolean(status?.connected);
            return (
              <div key={connector.id} className="flex items-center gap-3 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-stone-700 dark:text-stone-300">{connector.label}</div>
                  <div className="text-xs text-stone-500">{connector.description}</div>
                </div>
                {isConnected ? (
                  <button
                    onClick={() => disconnectConnector(connector.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 transition-colors flex-shrink-0"
                  >
                    Connected ✓ (Disconnect)
                  </button>
                ) : (
                  <button
                    onClick={() => connectConnector(connector.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors flex-shrink-0"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-stone-400 dark:text-stone-600 mt-2">Enabled for this phase: Gmail, Google Calendar, and GitHub.</p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Notifications
        </h2>
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-stone-500">Enable browser notifications so Jarvis can alert you when urgent items are detected.</p>
          <button
            onClick={enableNotifications}
            disabled={notificationsEnabled}
            className="text-xs px-3 py-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 text-stone-700 dark:text-stone-300 transition-colors"
          >
            {notificationsEnabled ? "Notifications enabled ✓" : "Enable browser notifications"}
          </button>
        </div>
      </section>

      {/* Scheduled Tasks */}
      <section>
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Scheduled Tasks
        </h2>
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-stone-500">
            Jarvis can proactively check your accounts and surface important information.
            Requires the agent server to be running.
          </p>
          {scheduledTasks?.length === 0 && (
            <button
              onClick={() => void upsertScheduledTask({
                name: "Morning Briefing",
                prompt: "Check my email for anything urgent, look at my calendar for today and tomorrow, and summarize my open GitHub PRs if I have GitHub connected. Give me a concise morning briefing.",
                schedule: "0 8 * * *",
                enabled: true,
                connectors: ["gmail", "google-calendar", "github"],
              })}
              className="text-xs px-3 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 text-blue-600 dark:text-blue-400 transition-colors"
            >
              + Add Morning Briefing
            </button>
          )}
          <div className="space-y-2">
            {scheduledTasks?.map((task) => (
              <div key={task._id} className="flex items-center gap-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{task.name}</p>
                  <p className="text-xs text-stone-400 truncate">{task.prompt}</p>
                </div>
                <button
                  onClick={() => void toggleScheduledTask({ id: task._id, enabled: !task.enabled })}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    task.enabled
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                      : "bg-stone-100 dark:bg-stone-700 text-stone-500"
                  }`}
                >
                  {task.enabled ? "On" : "Off"}
                </button>
                <button
                  onClick={() => void removeScheduledTask({ id: task._id })}
                  className="text-stone-300 dark:text-stone-600 hover:text-red-400 dark:hover:text-red-400 text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profile (Soul File) */}
      <section>
        <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">
          Your Profile (Soul File)
        </h2>
        <div className="bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-stone-500">
            Jarvis uses this profile to personalize responses. It&apos;s built automatically during onboarding and updated as you interact.
          </p>
          {soulFile ? (
            editingSoulFile ? (
              <div className="space-y-2">
                <textarea
                  value={soulFileContent}
                  onChange={(e) => setSoulFileContent(e.target.value)}
                  rows={10}
                  className="w-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-700 dark:text-stone-300 font-mono outline-none focus:border-blue-500/50 transition-colors resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      await upsertSoulFile({ content: soulFileContent });
                      setEditingSoulFile(false);
                      toast.success("Profile updated");
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                  >Save</button>
                  <button
                    onClick={() => { setSoulFileContent(soulFile.content); setEditingSoulFile(false); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors"
                  >Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <pre className="text-xs text-stone-600 dark:text-stone-400 font-mono whitespace-pre-wrap bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 max-h-48 overflow-y-auto">
                  {soulFile.content || "(empty)"}
                </pre>
                <button
                  onClick={() => setEditingSoulFile(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors"
                >Edit Profile</button>
              </div>
            )
          ) : (
            <p className="text-xs text-stone-400">No profile yet. Complete onboarding to create one.</p>
          )}
        </div>
      </section>

      {/* Save */}
      <div className="pb-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-stone-100 dark:disabled:bg-stone-700 disabled:text-stone-400 dark:disabled:text-stone-500 text-white font-medium text-sm transition-colors"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
