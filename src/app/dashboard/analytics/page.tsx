"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DollarSign, TrendingUp, Lightbulb, Users, Target, Clock } from "lucide-react";

const stageLabel: Record<string, string> = {
  "raw-thought": "Raw Thought",
  researching: "Researching",
  validating: "Validating",
  developing: "Developing",
  testing: "Testing",
  launched: "Launched",
};

const categoryLabel: Record<string, string> = {
  consulting: "Consulting",
  employment: "Employment",
  content: "Content",
  product: "Product",
  "project-based": "Project-Based",
};

const stageOrder = ["raw-thought", "researching", "validating", "developing", "testing", "launched"];

export default function AnalyticsPage() {
  const streams = useQuery(api.incomeStreams.list);
  const ideas = useQuery(api.ideas.list);
  const sessions = useQuery(api.mentorshipSessions.list);
  const isLoading = streams === undefined || ideas === undefined || sessions === undefined;

  // Revenue stats
  const totalRevenue = streams?.reduce((s, i) => s + i.monthlyRevenue, 0) ?? 0;
  const activeStreams = streams?.filter((i) => i.status === "active").length ?? 0;
  const avgGrowth = streams && streams.length > 0
    ? (streams.reduce((s, i) => s + i.growthRate, 0) / streams.length).toFixed(1)
    : "0";
  const totalTime = streams?.reduce((s, i) => s + i.timeInvestment, 0) ?? 0;
  const revenuePerHour = totalTime > 0 ? (totalRevenue / (totalTime * 4.33)).toFixed(0) : "0";

  // Ideas stats
  const ideasByStage = ideas?.reduce<Record<string, number>>((acc, idea) => {
    acc[idea.stage] = (acc[idea.stage] || 0) + 1;
    return acc;
  }, {}) ?? {};

  // Revenue by category
  const revenueByCategory = streams?.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + s.monthlyRevenue;
    return acc;
  }, {}) ?? {};

  // Revenue by status
  const revenueByStatus = streams?.reduce<Record<string, { count: number; revenue: number }>>((acc, s) => {
    if (!acc[s.status]) acc[s.status] = { count: 0, revenue: 0 };
    acc[s.status].count += 1;
    acc[s.status].revenue += s.monthlyRevenue;
    return acc;
  }, {}) ?? {};

  // Mentorship stats
  const totalMentorshipHours = sessions ? Math.round(sessions.reduce((s, m) => s + m.duration, 0) / 60) : 0;
  const avgRating = sessions && sessions.length > 0
    ? (sessions.reduce((s, m) => s + m.rating, 0) / sessions.length).toFixed(1)
    : "—";
  const topStreams = streams ? [...streams].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 5) : [];

  // Efficiency metrics
  const streamsByEfficiency = streams
    ? [...streams]
        .filter((s) => s.timeInvestment > 0)
        .map((s) => ({
          ...s,
          revenuePerHour: s.monthlyRevenue / (s.timeInvestment * 4.33),
        }))
        .sort((a, b) => b.revenuePerHour - a.revenuePerHour)
    : [];

  // Mentorship topics aggregation
  const topicCounts = sessions?.reduce<Record<string, number>>((acc, s) => {
    s.topics.forEach((t) => {
      acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {}) ?? {};
  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Pending action items
  const pendingActions = sessions
    ? sessions.flatMap((s) =>
        s.actionItems
          .filter((a) => !a.completed)
          .map((a) => ({ ...a, mentorName: s.mentorName, date: s.date }))
      )
      .slice(0, 5)
    : [];

  return (
    <>
      <PageHeader title="Analytics" description="Comprehensive view of your business metrics" />

      {/* Key Metrics */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Monthly Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            detail={`${activeStreams} active streams`}
            icon={DollarSign}
          />
          <StatCard
            label="Revenue / Hour"
            value={`$${revenuePerHour}`}
            detail={`${totalTime}h/week total`}
            icon={Clock}
          />
          <StatCard
            label="Avg Growth Rate"
            value={`${avgGrowth}%`}
            detail="across all streams"
            icon={TrendingUp}
          />
          <StatCard
            label="Ideas in Pipeline"
            value={ideas?.length ?? 0}
            detail={`${ideas?.filter((i) => i.stage === "launched").length ?? 0} launched`}
            icon={Lightbulb}
          />
          <StatCard
            label="Mentorship Hours"
            value={totalMentorshipHours}
            detail={`avg rating ${avgRating}/10`}
            icon={Users}
          />
          <StatCard
            label="Revenue Streams"
            value={streams?.length ?? 0}
            detail={`${Object.keys(revenueByCategory).length} categories`}
            icon={Target}
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Category */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Revenue by Category
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : Object.keys(revenueByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(revenueByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, revenue]) => {
                  const pct = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {categoryLabel[category] ?? category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 tabular-nums">{pct.toFixed(0)}%</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                            ${revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-900 dark:bg-gray-100 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No data</p>
          )}
        </div>

        {/* Ideas Pipeline Funnel */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Ideas Pipeline
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : ideas && ideas.length > 0 ? (
            <div className="space-y-2">
              {stageOrder.map((stage) => {
                const count = ideasByStage[stage] ?? 0;
                const pct = ideas.length > 0 ? (count / ideas.length) * 100 : 0;
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-24 text-right truncate">
                      {stageLabel[stage]}
                    </span>
                    <div className="flex-1 h-7 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                      <div
                        className="h-full bg-gray-900 dark:bg-gray-100 rounded-md flex items-center px-2 transition-all duration-500"
                        style={{ width: `${Math.max(pct, count > 0 ? 12 : 0)}%` }}
                      >
                        {count > 0 && (
                          <span className="text-xs font-medium text-white dark:text-gray-900">
                            {count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No data</p>
          )}
        </div>

        {/* Revenue Efficiency */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Revenue Efficiency
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Revenue per hour, sorted by efficiency
          </p>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : streamsByEfficiency.length > 0 ? (
            <div className="space-y-2">
              {streamsByEfficiency.map((stream, i) => {
                const maxEfficiency = streamsByEfficiency[0].revenuePerHour;
                const pct = maxEfficiency > 0 ? (stream.revenuePerHour / maxEfficiency) * 100 : 0;
                return (
                  <div key={stream._id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-gray-400 w-4 tabular-nums">{i + 1}</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 truncate">{stream.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums flex-shrink-0">
                        ${stream.revenuePerHour.toFixed(0)}/hr
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          i === 0
                            ? "bg-emerald-500"
                            : i === streamsByEfficiency.length - 1
                            ? "bg-amber-500"
                            : "bg-gray-400 dark:bg-gray-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Add time investment to see efficiency</p>
          )}
        </div>

        {/* Stream Status Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Streams by Status
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : Object.keys(revenueByStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(revenueByStatus)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .map(([status, data]) => (
                  <div key={status} className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          status === "active"
                            ? "bg-emerald-500"
                            : status === "developing"
                            ? "bg-blue-500"
                            : status === "planned"
                            ? "bg-gray-400"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {status}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">{data.count} streams</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                      ${data.revenue.toLocaleString()}/mo
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No data</p>
          )}
        </div>

        {/* Top Revenue Streams */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Top Revenue Streams
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : topStreams.length > 0 ? (
            <div className="space-y-1">
              {topStreams.map((stream, i) => (
                <div
                  key={stream._id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-medium text-gray-400 w-5 tabular-nums">{i + 1}</span>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
                        {stream.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {categoryLabel[stream.category] ?? stream.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums block">
                      ${stream.monthlyRevenue.toLocaleString()}
                    </span>
                    <span
                      className={`text-xs tabular-nums ${
                        stream.growthRate > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : stream.growthRate < 0
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                    >
                      {stream.growthRate > 0 ? "+" : ""}
                      {stream.growthRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No data</p>
          )}
        </div>

        {/* Mentorship Overview */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Mentorship Overview
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Giving</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {sessions.filter((s) => s.sessionType === "giving").length}
                  </p>
                </div>
                <div className="py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Receiving</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
                    {sessions.filter((s) => s.sessionType === "receiving").length}
                  </p>
                </div>
              </div>
              {topTopics.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Top Topics
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {topTopics.map(([topic, count]) => (
                      <Badge key={topic} variant="default">
                        {topic} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {[...new Set(sessions.map((s) => s.mentorName))].length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Mentors
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...new Set(sessions.map((s) => s.mentorName))].slice(0, 6).map((name) => (
                      <Badge key={name} variant="info">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No data</p>
          )}
        </div>
      </div>

      {/* Pending Action Items */}
      {pendingActions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Pending Action Items
          </h3>
          <div className="space-y-2">
            {pendingActions.map((action, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{action.task}</p>
                  <p className="text-xs text-gray-400">
                    from {action.mentorName} ({action.date})
                  </p>
                </div>
                <Badge variant={action.priority === "high" ? "danger" : action.priority === "medium" ? "warning" : "default"}>
                  {action.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
