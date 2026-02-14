"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "framer-motion";
import {
  DollarSign,
  Lightbulb,
  Users,
  ListTodo,
  Sparkles,
  Target,
  Activity,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Animation variants (shared across the page)
// ---------------------------------------------------------------------------
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ---------------------------------------------------------------------------
// Soul file helpers (reuse from original page)
// ---------------------------------------------------------------------------
function parseSoulName(content?: string): string | null {
  if (!content) return null;
  const m = content.match(/^Name:\s*(.+)/m);
  return m ? m[1].trim() : null;
}

// ---------------------------------------------------------------------------
// Nudge card data — shows smart contextual counts
// ---------------------------------------------------------------------------
type NudgeProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail?: string;
  href: string;
  color: string;
};

function NudgeCard({ icon: Icon, label, value, detail, href, color }: NudgeProps) {
  return (
    <motion.div variants={fadeUp}>
      <Link
        href={href}
        className="card p-4 flex items-center gap-3 hover:border-stone-300 dark:hover:border-stone-700 transition-all group"
      >
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-stone-500 dark:text-stone-400">{label}</p>
          <p className="text-lg font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
            {value}
          </p>
          {detail && (
            <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{detail}</p>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 dark:group-hover:text-stone-400 transition-colors" />
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Goal Progress Bar
// ---------------------------------------------------------------------------
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
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-stone-700 dark:text-stone-300 truncate">{label}</span>
        <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums flex-shrink-0 ml-2">
          {unit === "$" ? `$${current.toLocaleString()} / $${target.toLocaleString()}` : `${current} / ${target} ${unit}`}
        </span>
      </div>
      <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Feed Item
// ---------------------------------------------------------------------------
const typeIcon: Record<string, React.ElementType> = {
  income: DollarSign,
  idea: Lightbulb,
  mentorship: Users,
  task: ListTodo,
  insight: Sparkles,
};
const typeColor: Record<string, string> = {
  income: "text-emerald-500",
  idea: "text-violet-500",
  mentorship: "text-blue-500",
  task: "text-amber-500",
  insight: "text-pink-500",
};

const typeRoute: Record<string, string> = {
  income: "/dashboard/data?tab=income",
  idea: "/dashboard/data?tab=ideas",
  mentorship: "/dashboard/data?tab=mentorship",
  task: "/dashboard/data?tab=tasks",
  insight: "/dashboard/intelligence",
};

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

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const soulFile = useQuery(api.soulFile.get);
  const incomeStreams = useQuery(api.incomeStreams.list);
  const ideas = useQuery(api.ideas.list);
  const sessions = useQuery(api.mentorshipSessions.list);
  const undoneTaskCount = useQuery(api.tasks.countUndone);
  const goalData = useQuery(api.dashboard.goalProgress);
  const recentActivityData = useQuery(api.dashboard.recentActivity);
  const isEmpty = useQuery(api.dashboard.isEmpty);

  const userName = parseSoulName(soulFile?.content);
  const totalRevenue =
    incomeStreams?.reduce((sum, s) => sum + s.monthlyRevenue, 0) ?? 0;
  const activeStreams =
    incomeStreams?.filter((s) => s.status === "active").length ?? 0;
  const ideaCount = ideas?.length ?? 0;
  const sessionCount = sessions?.length ?? 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("mnotes:open-chat"));
  };

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
          {greeting}{userName ? `, ${userName}` : ""} 👋
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Here&apos;s what&apos;s happening with your business
        </p>
      </motion.div>

      {/* Chat CTA for new users */}
      {isEmpty && (
        <motion.div variants={fadeUp}>
          <button
            onClick={handleOpenChat}
            className="w-full card p-5 flex items-center gap-4 border-dashed border-2 hover:border-stone-400 dark:hover:border-stone-600 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                Start a conversation
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Tell me about your business and I&apos;ll help you track everything
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-stone-500 ml-auto" />
          </button>
        </motion.div>
      )}

      {/* Nudge cards row */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        variants={stagger}
      >
        <NudgeCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={totalRevenue !== undefined ? `$${totalRevenue.toLocaleString()}` : "—"}
          detail={`${activeStreams} active stream${activeStreams !== 1 ? "s" : ""}`}
          href="/dashboard/data?tab=income"
          color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        />
        <NudgeCard
          icon={Lightbulb}
          label="Ideas"
          value={ideaCount}
          detail="in pipeline"
          href="/dashboard/data?tab=ideas"
          color="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
        />
        <NudgeCard
          icon={Users}
          label="Mentorship"
          value={sessionCount}
          detail="sessions logged"
          href="/dashboard/data?tab=mentorship"
          color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <NudgeCard
          icon={ListTodo}
          label="Open Tasks"
          value={undoneTaskCount ?? 0}
          detail="to do"
          href="/dashboard/data?tab=tasks"
          color="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
        />
      </motion.div>

      {/* Two-column bottom: Goals + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Goal Progress */}
        <motion.div variants={fadeUp} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Goal Progress
            </h2>
          </div>
          {goalData === undefined ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-3/4" />
              <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded" />
              <div className="h-4 bg-stone-100 dark:bg-stone-800 rounded w-1/2" />
              <div className="h-2 bg-stone-100 dark:bg-stone-800 rounded" />
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
              Add goals in your soul file to track progress here
            </p>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={fadeUp} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Recent Activity
            </h2>
          </div>
          {recentActivityData === undefined ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-stone-100 dark:bg-stone-800 rounded-full" />
                  <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded flex-1" />
                </div>
              ))}
            </div>
          ) : recentActivityData.length > 0 ? (
            <div className="space-y-1">
              {recentActivityData.slice(0, 8).map((act) => {
                const Icon = typeIcon[act.type] ?? Activity;
                const color = typeColor[act.type] ?? "text-stone-400";
                const route = typeRoute[act.type] ?? "/dashboard";
                return (
                  <Link
                    key={act.id}
                    href={route}
                    className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                    <span className="text-sm text-stone-700 dark:text-stone-300 truncate flex-1">
                      {act.title}
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 flex-shrink-0 tabular-nums">
                      {relativeTime(act.timestamp)}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-6 text-center">
              Activity will show up here as you add data
            </p>
          )}
        </motion.div>
      </div>

      {/* Embedded chat prompt at the bottom */}
      <motion.div variants={fadeUp}>
        <button
          onClick={handleOpenChat}
          className="w-full card px-4 py-3 flex items-center gap-3 text-left hover:border-stone-300 dark:hover:border-stone-700 transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-600/10 dark:from-violet-500/20 dark:to-purple-600/20 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          </div>
          <span className="text-sm text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors flex-1">
            Ask me anything about your business…
          </span>
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono text-stone-400 border border-stone-200 dark:border-stone-700 rounded">
            ⌘K
          </kbd>
        </button>
      </motion.div>
    </motion.div>
  );
}
