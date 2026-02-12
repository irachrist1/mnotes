"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DollarSign, TrendingUp, Lightbulb, Users, Target, Clock } from "lucide-react";

const stageLabel: Record<string, string> = { "raw-thought": "Raw Thought", researching: "Researching", validating: "Validating", developing: "Developing", testing: "Testing", launched: "Launched" };
const categoryLabel: Record<string, string> = { consulting: "Consulting", employment: "Employment", content: "Content", product: "Product", "project-based": "Project-Based" };

export default function AnalyticsPage() {
  const streams = useQuery(api.incomeStreams.list);
  const ideas = useQuery(api.ideas.list);
  const sessions = useQuery(api.mentorshipSessions.list);
  const isLoading = streams === undefined || ideas === undefined || sessions === undefined;

  const totalRevenue = streams?.reduce((s, i) => s + i.monthlyRevenue, 0) ?? 0;
  const activeStreams = streams?.filter((i) => i.status === "active").length ?? 0;
  const avgGrowth = streams && streams.length > 0 ? (streams.reduce((s, i) => s + i.growthRate, 0) / streams.length).toFixed(1) : "0";
  const totalTime = streams?.reduce((s, i) => s + i.timeInvestment, 0) ?? 0;
  const revenuePerHour = totalTime > 0 ? (totalRevenue / (totalTime * 4.33)).toFixed(2) : "0";

  const ideasByStage = ideas?.reduce<Record<string, number>>((acc, idea) => { acc[idea.stage] = (acc[idea.stage] || 0) + 1; return acc; }, {}) ?? {};
  const revenueByCategory = streams?.reduce<Record<string, number>>((acc, s) => { acc[s.category] = (acc[s.category] || 0) + s.monthlyRevenue; return acc; }, {}) ?? {};
  const totalMentorshipHours = sessions ? Math.round(sessions.reduce((s, m) => s + m.duration, 0) / 60) : 0;
  const avgRating = sessions && sessions.length > 0 ? (sessions.reduce((s, m) => s + m.rating, 0) / sessions.length).toFixed(1) : "—";
  const topStreams = streams ? [...streams].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 5) : [];

  return (
    <>
      <PageHeader title="Analytics" description="Comprehensive insights into your business" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Monthly Revenue" value={`$${totalRevenue.toLocaleString()}`} detail={`${activeStreams} active streams`} icon={DollarSign} />
          <StatCard label="Revenue / Hour" value={`$${revenuePerHour}`} detail={`${totalTime}h/week total`} icon={Clock} />
          <StatCard label="Avg Growth Rate" value={`${avgGrowth}%`} detail="across all streams" icon={TrendingUp} />
          <StatCard label="Ideas in Pipeline" value={ideas?.length ?? 0} detail={`${ideas?.filter((i) => i.stage === "launched").length ?? 0} launched`} icon={Lightbulb} />
          <StatCard label="Mentorship Hours" value={totalMentorshipHours} detail={`avg rating ${avgRating}/10`} icon={Users} />
          <StatCard label="Revenue Streams" value={streams?.length ?? 0} detail={`${Object.keys(revenueByCategory).length} categories`} icon={Target} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue by Category</h3>
          {isLoading ? (<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}</div>
          ) : Object.keys(revenueByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(revenueByCategory).sort(([, a], [, b]) => b - a).map(([category, revenue]) => {
                const pct = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                return (<div key={category}><div className="flex items-center justify-between mb-1"><span className="text-sm text-gray-700 dark:text-gray-300">{categoryLabel[category] ?? category}</span><span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">${revenue.toLocaleString()}</span></div><div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-gray-900 dark:bg-gray-100 rounded-full transition-all" style={{ width: `${pct}%` }} /></div></div>);
              })}
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">No data</p>}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Ideas Pipeline Funnel</h3>
          {isLoading ? (<div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}</div>
          ) : ideas && ideas.length > 0 ? (
            <div className="space-y-2">
              {(["raw-thought", "researching", "validating", "developing", "testing", "launched"] as const).map((stage) => {
                const count = ideasByStage[stage] ?? 0;
                const pct = ideas.length > 0 ? (count / ideas.length) * 100 : 0;
                return (<div key={stage} className="flex items-center gap-3"><span className="text-xs text-gray-500 dark:text-gray-400 w-24 text-right">{stageLabel[stage]}</span><div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden"><div className="h-full bg-gray-900 dark:bg-gray-100 rounded-md flex items-center px-2 transition-all" style={{ width: `${Math.max(pct, count > 0 ? 10 : 0)}%` }}>{count > 0 && <span className="text-xs font-medium text-white dark:text-gray-900">{count}</span>}</div></div></div>);
              })}
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">No data</p>}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Revenue Streams</h3>
          {isLoading ? (<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}</div>
          ) : topStreams.length > 0 ? (
            <div className="space-y-2">
              {topStreams.map((stream, i) => (
                <div key={stream._id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0"><span className="text-xs font-medium text-gray-400 w-5 tabular-nums">{i + 1}</span><span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{stream.name}</span></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">${stream.monthlyRevenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">No data</p>}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Mentorship Overview</h3>
          {isLoading ? (<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />)}</div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Giving</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{sessions.filter((s) => s.sessionType === "giving").length}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Receiving</p><p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{sessions.filter((s) => s.sessionType === "receiving").length}</p></div>
              </div>
              <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Frequent Mentors</p><div className="flex flex-wrap gap-1">{[...new Set(sessions.map((s) => s.mentorName))].slice(0, 6).map((name) => (<Badge key={name} variant="default">{name}</Badge>))}</div></div>
            </div>
          ) : <p className="text-sm text-gray-400 py-4 text-center">No data</p>}
        </div>
      </div>
    </>
  );
}
