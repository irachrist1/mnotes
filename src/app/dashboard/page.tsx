"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { motion } from "framer-motion";
import {
  DollarSign,
  Lightbulb,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  Target,
} from "lucide-react";
import Link from "next/link";
import { WEEKS_PER_MONTH } from "@/lib/constants";

const container = {
  enter: { transition: { staggerChildren: 0.05 } },
};

const item = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const statusVariant = (s: string) => {
  switch (s) {
    case "active": return "success" as const;
    case "developing": return "info" as const;
    case "planned": return "default" as const;
    case "paused": return "warning" as const;
    default: return "default" as const;
  }
};

const stageLabel: Record<string, string> = {
  "raw-thought": "Raw Thought",
  researching: "Researching",
  validating: "Validating",
  developing: "Developing",
  testing: "Testing",
  launched: "Launched",
};

export default function DashboardPage() {
  const incomeStreams = useQuery(api.incomeStreams.list);
  const ideas = useQuery(api.ideas.list);
  const sessions = useQuery(api.mentorshipSessions.list);

  const isLoading = incomeStreams === undefined || ideas === undefined || sessions === undefined;

  const totalRevenue = incomeStreams?.reduce((s, i) => s + i.monthlyRevenue, 0) ?? 0;
  const activeStreams = incomeStreams?.filter((i) => i.status === "active").length ?? 0;
  const totalTime = incomeStreams?.reduce((s, i) => s + i.timeInvestment, 0) ?? 0;
  const totalIdeas = ideas?.length ?? 0;
  const totalSessions = sessions?.length ?? 0;
  const avgRating = sessions && sessions.length > 0
    ? (sessions.reduce((s, m) => s + m.rating, 0) / sessions.length).toFixed(1)
    : "—";
  const pendingActions = sessions
    ? sessions.reduce((s, m) => s + m.actionItems.filter((a) => !a.completed).length, 0)
    : 0;

  return (
    <>
      <PageHeader title="Overview" description="Your business at a glance" />

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="initial"
          animate="enter"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            label="Monthly Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
          />
          <StatCard
            label="Active Streams"
            value={activeStreams}
            detail={`${incomeStreams?.length ?? 0} total`}
            icon={TrendingUp}
          />
          <StatCard
            label="Ideas"
            value={totalIdeas}
            detail={`${ideas?.filter((i) => i.stage === "launched").length ?? 0} launched`}
            icon={Lightbulb}
          />
          <StatCard
            label="Mentorship"
            value={totalSessions}
            detail={`avg rating ${avgRating}/10`}
            icon={Users}
          />
        </motion.div>
      )}

      {/* Panels Grid */}
      <motion.div
        variants={container}
        initial="initial"
        animate="enter"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Income Streams */}
        <motion.div variants={item}>
          <OverviewPanel title="Income Streams" href="/dashboard/income" loading={isLoading}>
            {incomeStreams && incomeStreams.length > 0 ? (
              <div className="space-y-1">
                {incomeStreams.slice(0, 5).map((stream) => (
                  <div
                    key={stream._id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                        {stream.name}
                      </span>
                      <Badge variant={statusVariant(stream.status)}>{stream.status}</Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-stone-900 dark:text-stone-100 tabular-nums block">
                        ${stream.monthlyRevenue.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 tabular-nums">
                        ~${(stream.monthlyRevenue / WEEKS_PER_MONTH).toFixed(2)}/wk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 py-6 text-center">No income streams yet</p>
            )}
          </OverviewPanel>
        </motion.div>

        {/* Ideas Pipeline */}
        <motion.div variants={item}>
          <OverviewPanel title="Ideas Pipeline" href="/dashboard/ideas" loading={isLoading}>
            {ideas && ideas.length > 0 ? (
              <div className="space-y-1">
                {ideas.slice(0, 5).map((idea) => (
                  <div
                    key={idea._id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {idea.title}
                    </span>
                    <Badge variant="default">{stageLabel[idea.stage] ?? idea.stage}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 py-6 text-center">No ideas yet</p>
            )}
          </OverviewPanel>
        </motion.div>

        {/* Recent Mentorship */}
        <motion.div variants={item}>
          <OverviewPanel title="Recent Mentorship" href="/dashboard/mentorship" loading={isLoading}>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-1">
                {sessions.slice(0, 5).map((session) => (
                  <div
                    key={session._id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                        {session.mentorName}
                      </span>
                      <Badge variant={session.sessionType === "giving" ? "purple" : "info"}>
                        {session.sessionType}
                      </Badge>
                    </div>
                    <span className="text-xs text-stone-500 dark:text-stone-400 tabular-nums">
                      {session.rating}/10
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 py-6 text-center">No sessions yet</p>
            )}
          </OverviewPanel>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={item}>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <MiniStat
                label="Avg Growth Rate"
                value={
                  incomeStreams && incomeStreams.length > 0
                    ? `${(incomeStreams.reduce((s, i) => s + i.growthRate, 0) / incomeStreams.length).toFixed(1)}%`
                    : "—"
                }
                icon={TrendingUp}
              />
              <MiniStat
                label="Total Time/wk"
                value={incomeStreams ? `${totalTime}h` : "—"}
                icon={Clock}
              />
              <MiniStat
                label="Ideas Launched"
                value={ideas ? ideas.filter((i) => i.stage === "launched").length.toString() : "—"}
                icon={Target}
              />
              <MiniStat
                label="Action Items"
                value={pendingActions.toString()}
                icon={Lightbulb}
                highlight={pendingActions > 0}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

function OverviewPanel({
  title,
  href,
  loading,
  children,
}: {
  title: string;
  href: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 skeleton" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: typeof TrendingUp;
  highlight?: boolean;
}) {
  return (
    <div className="py-3 px-3 rounded-lg bg-stone-50 dark:bg-white/[0.02]">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && (
          <Icon
            className={`w-3 h-3 ${
              highlight ? "text-blue-600 dark:text-blue-400" : "text-stone-400 dark:text-stone-500"
            }`}
            strokeWidth={1.5}
          />
        )}
        <p className="text-[11px] text-stone-500 dark:text-stone-400 uppercase tracking-wider font-medium">
          {label}
        </p>
      </div>
      <p
        className={`text-lg font-semibold tabular-nums ${
          highlight
            ? "text-blue-600 dark:text-blue-400"
            : "text-stone-900 dark:text-stone-100"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
