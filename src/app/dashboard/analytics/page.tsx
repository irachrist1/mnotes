"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DoughnutChart, BarChart, LineChart } from "@/components/ui/Charts";
import { DollarSign, TrendingUp, Lightbulb, Users, Target, Clock } from "lucide-react";
import { WEEKS_PER_MONTH } from "@/lib/constants";

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

const STAGES_ORDER = ["raw-thought", "researching", "validating", "developing", "testing", "launched"] as const;
const CATEGORY_ORDER = ["consulting", "employment", "content", "product", "project-based"] as const;

export default function AnalyticsPage() {
  const streams = useQuery(api.incomeStreams.list);
  const ideas = useQuery(api.ideas.list);
  const sessions = useQuery(api.mentorshipSessions.list);
  const isLoading = streams === undefined || ideas === undefined || sessions === undefined;

  const totalRevenue = streams?.reduce((s, i) => s + i.monthlyRevenue, 0) ?? 0;
  const totalWeeklyRevenue = totalRevenue / WEEKS_PER_MONTH;
  const activeStreams = streams?.filter((i) => i.status === "active").length ?? 0;
  const avgGrowth = streams && streams.length > 0
    ? (streams.reduce((s, i) => s + i.growthRate, 0) / streams.length).toFixed(1)
    : "0";
  const totalTime = streams?.reduce((s, i) => s + i.timeInvestment, 0) ?? 0;
  const revenuePerHour = totalTime > 0
    ? (totalRevenue / (totalTime * WEEKS_PER_MONTH)).toFixed(2)
    : "0";

  const revenueByCategory = useMemo(() => {
    if (!streams) return {};
    return streams.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + s.monthlyRevenue;
      return acc;
    }, {});
  }, [streams]);

  const ideasByStage = useMemo(() => {
    if (!ideas) return {};
    return ideas.reduce<Record<string, number>>((acc, idea) => {
      acc[idea.stage] = (acc[idea.stage] || 0) + 1;
      return acc;
    }, {});
  }, [ideas]);

  const totalMentorshipHours = sessions
    ? Math.round(sessions.reduce((s, m) => s + m.duration, 0) / 60)
    : 0;
  const avgRating = sessions && sessions.length > 0
    ? (sessions.reduce((s, m) => s + m.rating, 0) / sessions.length).toFixed(1)
    : "—";
  const topStreams = streams
    ? [...streams].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 5)
    : [];

  // Revenue efficiency data for chart
  const revenueEfficiency = useMemo(() => {
    if (!streams || streams.length === 0) return { labels: [], data: [] };
    const sorted = [...streams]
      .filter((s) => s.timeInvestment > 0)
      .sort((a, b) => {
        const effA = a.monthlyRevenue / (a.timeInvestment * WEEKS_PER_MONTH);
        const effB = b.monthlyRevenue / (b.timeInvestment * WEEKS_PER_MONTH);
        return effB - effA;
      })
      .slice(0, 6);
    return {
      labels: sorted.map((s) => s.name.length > 15 ? s.name.slice(0, 12) + "..." : s.name),
      data: sorted.map((s) => Math.round(s.monthlyRevenue / (s.timeInvestment * WEEKS_PER_MONTH))),
    };
  }, [streams]);

  // Revenue projection: current revenue * (1 + avg growth rate)^months
  const revenueProjection = useMemo(() => {
    if (!streams || streams.length === 0) return { labels: [], datasets: [] };
    const avgGrowthRate = streams.reduce((s, i) => s + i.growthRate, 0) / streams.length / 100;
    const months = ["Now", "+1mo", "+2mo", "+3mo", "+4mo", "+5mo", "+6mo"];
    const projected = months.map((_, i) => Math.round(totalRevenue * Math.pow(1 + avgGrowthRate, i)));
    return {
      labels: months,
      datasets: [{ label: "Projected Revenue", data: projected }],
    };
  }, [streams, totalRevenue]);

  const revenueCategoryEntries = useMemo(() => {
    return CATEGORY_ORDER
      .filter((key) => revenueByCategory[key] !== undefined)
      .map((key) => ({
        label: categoryLabel[key] ?? key,
        value: revenueByCategory[key],
      }));
  }, [revenueByCategory]);

  return (
    <>
      <PageHeader title="Analytics" description="Comprehensive insights into your business" />

      {/* Stat Cards */}
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
            detail={`${activeStreams} active streams • ~$${totalWeeklyRevenue.toFixed(2)}/wk`}
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

      {/* Charts Row 1: Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Revenue by Category
          </h3>
          {isLoading ? (
            <div className="h-[220px] bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
          ) : revenueCategoryEntries.length > 0 ? (
            <DoughnutChart
              labels={revenueCategoryEntries.map((entry) => entry.label)}
              data={revenueCategoryEntries.map((entry) => entry.value)}
            />
          ) : (
            <p className="text-sm text-stone-400 py-4 text-center">No data</p>
          )}
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Revenue Projection (6 months)
          </h3>
          {isLoading ? (
            <div className="h-[220px] bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
          ) : revenueProjection.datasets.length > 0 && totalRevenue > 0 ? (
            <LineChart
              labels={revenueProjection.labels}
              datasets={revenueProjection.datasets}
            />
          ) : (
            <p className="text-sm text-stone-400 py-4 text-center">No data</p>
          )}
        </div>
      </div>

      {/* Charts Row 2: Ideas Pipeline + Revenue Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Ideas Pipeline Funnel
          </h3>
          {isLoading ? (
            <div className="h-[220px] bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
          ) : ideas && ideas.length > 0 ? (
            <BarChart
              labels={STAGES_ORDER.map((s) => stageLabel[s])}
              data={STAGES_ORDER.map((s) => ideasByStage[s] ?? 0)}
              label="Ideas"
              horizontal
            />
          ) : (
            <p className="text-sm text-stone-400 py-4 text-center">No data</p>
          )}
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Revenue per Hour ($/hr)
          </h3>
          {isLoading ? (
            <div className="h-[220px] bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
          ) : revenueEfficiency.labels.length > 0 ? (
            <BarChart
              labels={revenueEfficiency.labels}
              data={revenueEfficiency.data}
              label="$/hr"
            />
          ) : (
            <p className="text-sm text-stone-400 py-4 text-center">No data</p>
          )}
        </div>
      </div>

      {/* Detail Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Top Revenue Streams
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
              ))}
            </div>
          ) : topStreams.length > 0 ? (
            <div className="space-y-2">
              {topStreams.map((stream, i) => (
                <div
                  key={stream._id}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-medium text-stone-400 w-5 tabular-nums">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {stream.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone-400">
                      {stream.growthRate > 0 ? "+" : ""}{stream.growthRate}%
                    </span>
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
            <p className="text-sm text-stone-400 py-4 text-center">No data</p>
          )}
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-5">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Mentorship Overview
          </h3>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-stone-100 dark:bg-stone-800 rounded animate-pulse" />
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Giving</p>
                  <p className="text-lg font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                    {sessions.filter((s) => s.sessionType === "giving").length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mb-0.5">Receiving</p>
                  <p className="text-lg font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                    {sessions.filter((s) => s.sessionType === "receiving").length}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Frequent Mentors
                </p>
                <div className="flex flex-wrap gap-1">
                  {[...new Set(sessions.map((s) => s.mentorName))].slice(0, 6).map((name) => (
                    <Badge key={name} variant="default">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">
                  Common Topics
                </p>
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    const topicCounts: Record<string, number> = {};
                    sessions.forEach((s) =>
                      s.topics.forEach((t) => {
                        topicCounts[t] = (topicCounts[t] || 0) + 1;
                      })
                    );
                    return Object.entries(topicCounts)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 8)
                      .map(([topic]) => (
                        <Badge key={topic} variant="info">
                          {topic}
                        </Badge>
                      ));
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-400 py-4 text-center">No data</p>
          )}
        </div>
      </div>
    </>
  );
}
