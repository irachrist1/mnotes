"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  DollarSign,
  Lightbulb,
  Users,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

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
  const totalIdeas = ideas?.length ?? 0;
  const totalSessions = sessions?.length ?? 0;
  const avgRating = sessions && sessions.length > 0
    ? (sessions.reduce((s, m) => s + m.rating, 0) / sessions.length).toFixed(1)
    : "—";

  return (
    <>
      <PageHeader title="Overview" description="Your entrepreneurial business at a glance" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (<CardSkeleton key={i} />))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Monthly Revenue" value={`$${totalRevenue.toLocaleString()}`} detail={`${activeStreams} active streams`} icon={DollarSign} />
          <StatCard label="Active Streams" value={activeStreams} detail={`${incomeStreams?.length ?? 0} total`} icon={TrendingUp} />
          <StatCard label="Ideas" value={totalIdeas} detail="in pipeline" icon={Lightbulb} />
          <StatCard label="Mentorship" value={totalSessions} detail={`avg rating ${avgRating}`} icon={Users} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OverviewPanel title="Income Streams" href="/dashboard/income" loading={isLoading}>
          {incomeStreams && incomeStreams.length > 0 ? (
            <div className="space-y-2">
              {incomeStreams.slice(0, 5).map((stream) => (
                <div key={stream._id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{stream.name}</span>
                    <Badge variant={statusVariant(stream.status)}>{stream.status}</Badge>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">${stream.monthlyRevenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (<p className="text-sm text-gray-400 py-4 text-center">No income streams yet</p>)}
        </OverviewPanel>

        <OverviewPanel title="Ideas Pipeline" href="/dashboard/ideas" loading={isLoading}>
          {ideas && ideas.length > 0 ? (
            <div className="space-y-2">
              {ideas.slice(0, 5).map((idea) => (
                <div key={idea._id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{idea.title}</span>
                  <Badge variant="default">{stageLabel[idea.stage] ?? idea.stage}</Badge>
                </div>
              ))}
            </div>
          ) : (<p className="text-sm text-gray-400 py-4 text-center">No ideas yet</p>)}
        </OverviewPanel>

        <OverviewPanel title="Recent Mentorship" href="/dashboard/mentorship" loading={isLoading}>
          {sessions && sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <div key={session._id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{session.mentorName}</span>
                    <Badge variant={session.sessionType === "giving" ? "purple" : "info"}>{session.sessionType}</Badge>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{session.rating}/10</span>
                </div>
              ))}
            </div>
          ) : (<p className="text-sm text-gray-400 py-4 text-center">No sessions yet</p>)}
        </OverviewPanel>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <MiniStat label="Avg Growth Rate" value={incomeStreams && incomeStreams.length > 0 ? `${(incomeStreams.reduce((s, i) => s + i.growthRate, 0) / incomeStreams.length).toFixed(1)}%` : "—"} />
            <MiniStat label="Total Time/wk" value={incomeStreams ? `${incomeStreams.reduce((s, i) => s + i.timeInvestment, 0)}h` : "—"} />
            <MiniStat label="Ideas Launched" value={ideas ? ideas.filter((i) => i.stage === "launched").length.toString() : "—"} />
            <MiniStat label="Action Items" value={sessions ? sessions.reduce((s, m) => s + m.actionItems.filter((a) => !a.completed).length, 0).toString() : "—"} />
          </div>
        </div>
      </div>
    </>
  );
}

function OverviewPanel({ title, href, loading, children }: { title: string; href: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <Link href={href} className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-8 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />))}</div>
      ) : children}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
    </div>
  );
}
