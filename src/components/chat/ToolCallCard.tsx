"use client";

import { useState } from "react";
import { ChevronRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const TOOL_ICONS: Record<string, string> = {
  memory_save: "🧠",
  memory_search: "🔍",
  memory_list: "📋",
  gmail_list_recent: "📧",
  gmail_search: "🔍",
  gmail_get_message: "📨",
  gmail_send: "📤",
  gmail_create_draft: "📝",
  calendar_list_events: "📅",
  calendar_get_agenda: "🗓️",
  calendar_find_free_slots: "⏰",
  calendar_create_event: "➕",
  outlook_list_emails: "📧",
  outlook_search_emails: "🔍",
  outlook_get_email: "📨",
  outlook_send_email: "📤",
  outlook_list_calendar: "📅",
  github_list_prs: "🔀",
  github_list_issues: "🐛",
  github_get_pr: "👁️",
  github_create_issue: "📌",
  github_get_repo_activity: "📊",
  github_list_my_prs: "🔀",
  WebSearch: "🌐",
  WebFetch: "🔗",
  Bash: "💻",
  Read: "📖",
  Write: "✏️",
  Edit: "✏️",
};

interface ToolCall {
  name: string;
  input: string;
  output?: string;
  status: "running" | "done" | "error";
}

export function ToolCallCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const icon = TOOL_ICONS[tool.name] ?? "⚙️";

  const friendlyName = tool.name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex gap-3 my-1">
      {/* Left gutter — matches agent avatar width */}
      <div className="w-7 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs border transition-colors text-left
            ${tool.status === "running"
              ? "bg-blue-600/5 border-blue-600/20 text-blue-600 dark:text-blue-400"
              : tool.status === "error"
              ? "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
              : "bg-stone-100/50 dark:bg-stone-800/50 border-stone-200/50 dark:border-stone-700/50 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }
          `}
        >
          <span className="text-sm">{icon}</span>
          <span className="flex-1 font-medium truncate">{friendlyName}</span>

          {tool.status === "running" && (
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
          )}
          {tool.status === "done" && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          )}
          {tool.status === "error" && (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          )}

          {(tool.output || tool.input) && (
            <ChevronRight
              className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          )}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-1 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-700/50 text-xs overflow-hidden">
            {tool.input && tool.input !== "{}" && (
              <div className="px-3 py-2 border-b border-stone-200/50 dark:border-stone-700/50">
                <div className="text-stone-400 dark:text-stone-500 mb-1 font-medium">Input</div>
                <pre className="text-stone-600 dark:text-stone-300 whitespace-pre-wrap break-all font-mono leading-relaxed">
                  {prettifyJson(tool.input)}
                </pre>
              </div>
            )}
            {tool.output && (
              <div className="px-3 py-2">
                <div className="text-stone-400 dark:text-stone-500 mb-1 font-medium">
                  {tool.status === "error" ? "Error" : "Output"}
                </div>
                <pre className={`whitespace-pre-wrap break-all font-mono leading-relaxed ${tool.status === "error" ? "text-red-500 dark:text-red-300" : "text-stone-600 dark:text-stone-300"}`}>
                  {tool.output.length > 600 ? tool.output.slice(0, 600) + "…" : tool.output}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function prettifyJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}
