"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

const ChatPanel = dynamic(
  () => import("@/components/chat/ChatPanel").then((m) => m.ChatPanel),
  { ssr: false }
);

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function parseSoulName(content?: string): string | null {
  if (!content) return null;
  const m = content.match(/^Name:\s*(.+)/m);
  return m ? m[1].trim() : null;
}

type NudgeTone = "blue" | "amber" | "red" | "emerald" | "stone";

const NUDGE_TONE: Record<NudgeTone, { hairline: string; bg: string; icon: string }> = {
  blue: {
    hairline: "bg-blue-600/55 dark:bg-blue-400/45",
    bg: "bg-blue-50/60 dark:bg-blue-500/[0.06]",
    icon: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    hairline: "bg-amber-600/55 dark:bg-amber-400/45",
    bg: "bg-amber-50/60 dark:bg-amber-500/[0.06]",
    icon: "text-amber-600 dark:text-amber-400",
  },
  red: {
    hairline: "bg-red-600/55 dark:bg-red-400/45",
    bg: "bg-red-50/60 dark:bg-red-500/[0.06]",
    icon: "text-red-600 dark:text-red-400",
  },
  emerald: {
    hairline: "bg-emerald-600/55 dark:bg-emerald-400/45",
    bg: "bg-emerald-50/60 dark:bg-emerald-500/[0.06]",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  stone: {
    hairline: "bg-stone-300 dark:bg-white/[0.10]",
    bg: "bg-stone-50 dark:bg-white/[0.04]",
    icon: "text-stone-600 dark:text-stone-400",
  },
};

function NudgeCard({
  icon: Icon,
  title,
  body,
  meta,
  href,
  tone,
  onDismiss,
  dismissLabel,
  actions,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  meta?: string;
  href: string;
  tone: NudgeTone;
  onDismiss?: () => void;
  dismissLabel?: string;
  actions?: Array<{ label: string; onClick: () => void }>;
}) {
  const styles = NUDGE_TONE[tone];
  return (
    <div className={`card p-4 w-[320px] sm:w-[360px] flex gap-3 ${styles.bg} relative overflow-hidden shrink-0`}>
      {/* Premium accent hairline */}
      <div className={`absolute left-0 top-0 h-[2px] w-full ${styles.hairline}`} aria-hidden="true" />
      <div className={`w-9 h-9 rounded-lg bg-white/60 dark:bg-white/[0.06] border border-stone-200/60 dark:border-white/[0.08] flex items-center justify-center shrink-0 ${styles.icon}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
              {title}
            </p>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2">
              {body}
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="shrink-0 p-1 rounded text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-white/60 dark:hover:bg-white/[0.06] transition-colors duration-150"
              aria-label={dismissLabel ?? "Dismiss"}
              title={dismissLabel ?? "Dismiss"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Link href={href} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
            View
          </Link>
          {actions?.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors duration-150"
            >
              {action.label}
            </button>
          ))}
          {meta && (
            <span className="text-[11px] text-stone-400 dark:text-stone-500 tabular-nums ml-auto">
              {meta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function GoalBar({
  label,
  percentage,
  current,
  target,
  unit,
}: {
  label: string;
  percentage: number;
  current: number;
  target: number;
  unit: string;
}) {
  const pct = Math.max(0, Math.min(percentage, 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-stone-700 dark:text-stone-300 truncate">{label}</span>
        <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums flex-shrink-0">
          {unit === "$"
            ? `$${current.toLocaleString()} / $${target.toLocaleString()}`
            : `${current} / ${target} ${unit}`}
        </span>
      </div>
      <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const soulFile = useQuery(api.soulFile.get);
  const isEmpty = useQuery(api.dashboard.isEmpty);
  const undoneTaskCount = useQuery(api.tasks.countUndone);
  const overdueTasks = useQuery(api.tasks.listOverdue);
  const goalData = useQuery(api.dashboard.goalProgress);
  const activity = useQuery(api.dashboard.recentActivity);

  const unreadDigests = useQuery(api.aiInsights.getUnreadDigests, {});
  const notifications = useQuery(api.notifications.list, {});
  const proactive = useQuery(api.proactiveSuggestions.list, { limit: 4 });

  const dismissNotification = useMutation(api.notifications.dismiss);
  const markInsightStatus = useMutation(api.aiInsights.updateStatus);
  const dismissProactive = useMutation(api.proactiveSuggestions.dismiss);
  const approveProactive = useMutation(api.proactiveSuggestions.approve);

  const [chatActive, setChatActive] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail;
      if (detail?.prompt) setPendingPrompt(detail.prompt);
      setChatActive(true);
    };
    window.addEventListener("mnotes:open-chat", handler);
    return () => window.removeEventListener("mnotes:open-chat", handler);
  }, []);

  // Keep Home chat state in sync with the shell's close events.
  useEffect(() => {
    const handler = () => setChatActive(false);
    window.addEventListener("mnotes:chat-closed", handler);
    return () => window.removeEventListener("mnotes:chat-closed", handler);
  }, []);

  const userName = parseSoulName(soulFile?.content);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const toggleTaskDone = useMutation(api.tasks.toggleDone);

  const nudges = useMemo(() => {
    if (unreadDigests === undefined || notifications === undefined || overdueTasks === undefined || proactive === undefined) return null;

    const cards: Array<{
      key: string;
      icon: React.ElementType;
      title: string;
      body: string;
      meta?: string;
      href: string;
      tone: NudgeTone;
      onDismiss?: () => void;
      dismissLabel?: string;
      actions?: Array<{ label: string; onClick: () => void }>;
    }> = [];

    const digest = (unreadDigests ?? [])[0];
    if (digest) {
      cards.push({
        key: String(digest._id),
        icon: Sparkles,
        title: digest.title || "Weekly digest",
        body: (digest.body || "").replace(/\s+/g, " ").slice(0, 180),
        meta: "Weekly digest",
        href: `/dashboard/intelligence?insightId=${digest._id}`,
        tone: "blue",
        onDismiss: () => void markInsightStatus({ id: digest._id as Id<"aiInsights">, status: "read" }),
        dismissLabel: "Mark digest as read",
      });
    }

    // Client-side overdue task nudges (immediate, no cron dependency)
    for (const task of (overdueTasks ?? []).slice(0, 3)) {
      const daysOverdue = Math.floor((Date.now() - new Date(task.dueDate!).getTime()) / 86400000);
      cards.push({
        key: `overdue-${task._id}`,
        icon: Clock,
        title: task.title,
        body: `Due ${daysOverdue === 1 ? "yesterday" : `${daysOverdue} days ago`}. Still relevant?`,
        meta: `${daysOverdue}d overdue`,
        href: `/dashboard/data?tab=tasks&taskId=${task._id}`,
        tone: "red",
        actions: [
          { label: "Mark done", onClick: () => void toggleTaskDone({ id: task._id }) },
        ],
      });
    }

    // Proactive suggestions (approve -> creates task and queues agent)
    for (const s of (proactive ?? []).slice(0, 2)) {
      cards.push({
        key: `proactive-${s._id}`,
        icon: Sparkles,
        title: s.title,
        body: s.body,
        meta: "Suggestion",
        href: "/dashboard/data?tab=tasks",
        tone: "amber",
        onDismiss: () => void dismissProactive({ id: s._id }),
        dismissLabel: "Dismiss suggestion",
        actions: [
          {
            label: "Approve",
            onClick: () => {
              void approveProactive({ id: s._id });
            },
          },
        ],
      });
    }

    const unreadNotifications = (notifications ?? []).filter((n) => !n.read).slice(0, 4);
    for (const n of unreadNotifications) {
      const tone: NudgeTone =
        n.type === "agent-task"
          ? /failed/i.test(n.title) ? "red" : /finished|ready/i.test(n.title) ? "emerald" : "blue"
          : n.type === "overdue-action" ? "red"
            : n.type === "stale-idea" ? "amber"
              : n.type === "milestone" ? "emerald"
                : "blue";
      cards.push({
        key: String(n._id),
        icon: n.type === "milestone" ? CheckCircle2 : n.type === "stale-idea" ? AlertTriangle : Activity,
        title: n.title,
        body: n.body,
        meta: relativeTime(n.createdAt),
        href: n.actionUrl || "/dashboard",
        tone,
        onDismiss: () => void dismissNotification({ id: n._id as Id<"notifications"> }),
        dismissLabel: "Dismiss nudge",
      });
    }

    if (cards.length === 0) {
      const taskMsg = (undoneTaskCount ?? 0) > 0
        ? `${undoneTaskCount} agent task${undoneTaskCount === 1 ? " is" : "s are"} running in the background.`
        : "All caught up. Start a conversation or create a task and I'll get to work.";
      cards.push({
        key: "up-to-date",
        icon: Sparkles,
        title: "All clear",
        body: taskMsg,
        href: "/dashboard/data?tab=tasks",
        tone: "stone",
      });
    }

    return cards;
  }, [approveProactive, dismissNotification, dismissProactive, markInsightStatus, notifications, overdueTasks, proactive, toggleTaskDone, unreadDigests, undoneTaskCount]);

  if (chatActive) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[520px]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setChatActive(false);
              window.dispatchEvent(new CustomEvent("mnotes:chat-closed"));
            }}
            className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to overview
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            AI Assistant Active
          </div>
        </div>

        <div className="flex-1 min-h-0 card overflow-hidden">
          <ChatPanel
            open={true}
            onClose={() => {
              setChatActive(false);
              window.dispatchEvent(new CustomEvent("mnotes:chat-closed"));
            }}
            inline={true}
            pendingPrompt={pendingPrompt}
            onPromptConsumed={() => setPendingPrompt(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
          {greeting}{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Here&apos;s what I&apos;ve been working on for you
        </p>
      </div>

      {isEmpty && (
        <button
          onClick={() => setChatActive(true)}
          className="w-full card p-5 flex items-center gap-4 border-dashed border-2 hover:border-stone-400 dark:hover:border-stone-600 transition-colors duration-150"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              Let&apos;s get to work
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Tell me what happened today and I&apos;ll start organizing and executing.
            </p>
          </div>
        </button>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Nudges
          </h2>
          <Link
            href="/dashboard/intelligence"
            className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors duration-150"
          >
            View intelligence
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {nudges === null ? (
            <>
              <div className="card p-4 w-[320px] sm:w-[360px]">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full mt-3" />
                <Skeleton className="h-3 w-5/6 mt-2" />
              </div>
              <div className="card p-4 w-[320px] sm:w-[360px]">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-full mt-3" />
                <Skeleton className="h-3 w-4/6 mt-2" />
              </div>
            </>
          ) : (
            nudges.map((n) => (
              <NudgeCard
                key={n.key}
                icon={n.icon}
                title={n.title}
                body={n.body}
                meta={n.meta}
                href={n.href}
                tone={n.tone}
                onDismiss={n.onDismiss}
                dismissLabel={n.dismissLabel}
                actions={n.actions}
              />
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Goals I&apos;m tracking
            </h2>
          </div>

          {goalData === undefined ? (
            <div className="space-y-4" aria-label="Loading goals">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          ) : goalData.goals.length > 0 ? (
            <div className="space-y-4">
              {goalData.goals.map((g, i) => (
                <GoalBar
                  key={i}
                  label={g.label}
                  percentage={g.percentage}
                  current={g.current}
                  target={g.target}
                  unit={g.unit}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-6 text-center">
              Add goals in your soul file and I&apos;ll track progress here.
            </p>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              What I&apos;ve done recently
            </h2>
          </div>

          {activity === undefined ? (
            <div className="space-y-3" aria-label="Loading activity">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
          ) : activity.length > 0 ? (
            <div className="space-y-1">
              {activity.slice(0, 8).map((act) => (
                <Link
                  key={act.id}
                  href={
                    act.type === "income" ? "/dashboard/data?tab=income" :
                      act.type === "idea" ? "/dashboard/data?tab=ideas" :
                        act.type === "mentorship" ? "/dashboard/data?tab=mentorship" :
                          act.type === "task" ? `/dashboard/data?tab=tasks&taskId=${act.id}` :
                            `/dashboard/intelligence?insightId=${act.id}`
                  }
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-stone-50 dark:hover:bg-white/[0.04] transition-colors duration-150"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600/[0.08] dark:bg-blue-400/[0.10] flex items-center justify-center shrink-0">
                    <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-stone-700 dark:text-stone-300 truncate flex-1">
                    {act.title}
                  </span>
                  <span className="text-[11px] text-stone-400 dark:text-stone-500 flex-shrink-0 tabular-nums">
                    {relativeTime(act.timestamp)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-6 text-center">
              I&apos;ll show my work here as I take action.
            </p>
          )}
        </section>
      </div>

      <button
        onClick={() => setChatActive(true)}
        className="w-full card px-4 py-3 flex items-center gap-3 text-left hover:border-stone-300 dark:hover:border-stone-700 transition-colors duration-150 group"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600/[0.08] dark:bg-blue-400/[0.10] flex items-center justify-center shrink-0">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-sm text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors duration-150 flex-1">
          Ask anything or tell me what happened today…
        </span>
        <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-stone-400 border border-stone-200 dark:border-stone-700 rounded">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
