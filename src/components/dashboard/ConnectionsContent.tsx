"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CheckCircle2, Circle, ExternalLink, Github, Mail, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

type ProviderInfo = {
  key: string;
  label: string;
  icon: React.ElementType;
  tools: Array<{ name: string; desc: string; writeOnly?: boolean }>;
};

const PROVIDERS: ProviderInfo[] = [
  {
    key: "github",
    label: "GitHub",
    icon: Github,
    tools: [
      { name: "github_list_my_pull_requests", desc: "Lists your open PRs" },
      { name: "github_list_issues", desc: "Lists issues" },
      { name: "github_get_repo_activity", desc: "Shows recent repo activity" },
      { name: "github_create_issue", desc: "Creates an issue (approval required)", writeOnly: true },
    ],
  },
  {
    key: "gmail",
    label: "Gmail",
    icon: Mail,
    tools: [
      { name: "gmail_list_recent", desc: "Lists recent email headers" },
      { name: "gmail_search_messages", desc: "Searches Gmail by query" },
      { name: "gmail_create_draft", desc: "Creates a draft email", writeOnly: true },
      { name: "gmail_send_email", desc: "Sends an email (approval required)", writeOnly: true },
    ],
  },
  {
    key: "google-calendar",
    label: "Google Calendar",
    icon: Calendar,
    tools: [
      { name: "calendar_list_upcoming", desc: "Lists upcoming events" },
      { name: "calendar_get_agenda", desc: "Builds a day-by-day agenda" },
      { name: "calendar_find_free_slots", desc: "Finds free time slots" },
      { name: "calendar_create_event", desc: "Creates an event (approval required)", writeOnly: true },
    ],
  },
];

function hasWriteScope(scopes: string[] | null, provider: string): boolean {
  if (!scopes) return false;
  if (provider === "github") return scopes.includes("repo");
  if (provider === "gmail") return scopes.some((s) => s.includes("gmail.compose") || s.includes("gmail.send"));
  if (provider === "google-calendar") return scopes.some((s) => s === "https://www.googleapis.com/auth/calendar");
  return false;
}

export function ConnectionsContent() {
  const connectors = useQuery(api.connectors.tokens.list, {});

  if (connectors === undefined) {
    return (
      <div className="space-y-4" aria-label="Loading connections">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  const connectedCount = connectors.filter((c) => c.connected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Connected Tools
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {connectedCount} of {PROVIDERS.length} services connected
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          Manage in Settings
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const conn = connectors.find((c) => c.provider === provider.key);
          const connected = conn?.connected ?? false;
          const write = hasWriteScope(conn?.scopes ?? null, provider.key);
          const Icon = provider.icon;
          const lastUsed = conn?.lastUsedAt
            ? new Date(conn.lastUsedAt).toLocaleString()
            : null;

          return (
            <div
              key={provider.key}
              className="card p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {provider.label}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {connected
                      ? write ? "Connected (read + write)" : "Connected (read-only)"
                      : "Not connected"}
                  </p>
                </div>
                {connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />
                )}
              </div>

              {connected && (
                <div className="rounded-md bg-black/5 dark:bg-white/[0.04] p-3 space-y-2">
                  {lastUsed && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Last used: {lastUsed}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-stone-800 dark:text-stone-200">
                    Tools available
                  </p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {provider.tools
                      .filter((t) => !t.writeOnly || write)
                      .map((t) => (
                        <div key={t.name} className="flex items-start justify-between gap-3">
                          <span className="text-[11px] font-mono text-stone-900 dark:text-stone-100">
                            {t.name}
                          </span>
                          <span className="text-[11px] text-stone-500 dark:text-stone-400 text-right">
                            {t.desc}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {!connected && (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Connect in Settings
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
