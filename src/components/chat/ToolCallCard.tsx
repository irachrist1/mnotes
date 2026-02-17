"use client";

import { useState } from "react";
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Brain,
  Search,
  List,
  Mail,
  MailOpen,
  Send as SendIcon,
  FileEdit,
  Calendar,
  CalendarClock,
  Clock,
  CalendarPlus,
  GitPullRequest,
  Bug,
  Eye,
  PlusCircle,
  Activity,
  Globe,
  Link2,
  Terminal,
  FileText,
  Pencil,
  Cog,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TOOL_ICONS: Record<string, LucideIcon> = {
  memory_save: Brain,
  memory_search: Search,
  memory_list: List,
  gmail_list_recent: Mail,
  gmail_search: Search,
  gmail_get_message: MailOpen,
  gmail_send: SendIcon,
  gmail_create_draft: FileEdit,
  calendar_list_events: Calendar,
  calendar_get_agenda: CalendarClock,
  calendar_find_free_slots: Clock,
  calendar_create_event: CalendarPlus,
  outlook_list_emails: Mail,
  outlook_search_emails: Search,
  outlook_get_email: MailOpen,
  outlook_send_email: SendIcon,
  outlook_list_calendar: Calendar,
  github_list_prs: GitPullRequest,
  github_list_issues: Bug,
  github_get_pr: Eye,
  github_create_issue: PlusCircle,
  github_get_repo_activity: Activity,
  github_list_my_prs: GitPullRequest,
  WebSearch: Globe,
  WebFetch: Link2,
  Bash: Terminal,
  Read: FileText,
  Write: Pencil,
  Edit: Pencil,
};

interface ToolCall {
  name: string;
  input: string;
  output?: string;
  status: "running" | "done" | "error";
}

export function ToolCallCard({ tool }: { tool: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TOOL_ICONS[tool.name] ?? Cog;

  const friendlyName = tool.name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex gap-3 my-1">
      <div className="w-7 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs border transition-all text-left
            ${
              tool.status === "running"
                ? "bg-blue-600/5 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/5"
                : tool.status === "error"
                  ? "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
                  : "bg-stone-50 dark:bg-stone-900/80 border-stone-200 dark:border-stone-700/60 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/80 hover:border-stone-300 dark:hover:border-stone-600"
            }
          `}
        >
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
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

        {expanded && (
          <div className="mt-1.5 rounded-xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700/60 text-xs overflow-hidden">
            {tool.input && tool.input !== "{}" && (
              <div className="px-3 py-2.5 border-b border-stone-200/60 dark:border-stone-700/40">
                <div className="text-stone-400 dark:text-stone-500 mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Input
                </div>
                <pre className="text-stone-600 dark:text-stone-300 whitespace-pre-wrap break-all font-mono leading-relaxed">
                  {prettifyJson(tool.input)}
                </pre>
              </div>
            )}
            {tool.output && (
              <div className="px-3 py-2.5">
                <div className="text-stone-400 dark:text-stone-500 mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  {tool.status === "error" ? "Error" : "Output"}
                </div>
                <pre
                  className={`whitespace-pre-wrap break-all font-mono leading-relaxed ${tool.status === "error" ? "text-red-500 dark:text-red-300" : "text-stone-600 dark:text-stone-300"}`}
                >
                  {tool.output.length > 600
                    ? tool.output.slice(0, 600) + "\u2026"
                    : tool.output}
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
