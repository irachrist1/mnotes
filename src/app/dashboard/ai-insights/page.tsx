"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SlideOver } from "@/components/ui/SlideOver";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DoughnutChart, BarChart } from "@/components/ui/Charts";
import {
  Sparkles,
  RefreshCw,
  Brain,
  TrendingUp,
  Lightbulb,
  Users,
  X,
  Settings,
  Eye,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";

type InsightType = "all" | "revenue" | "idea" | "mentorship";
type StatusFilter = "active" | "all" | "dismissed";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function AIInsightsPage() {
  const streams = useQuery(api.incomeStreams.list);
  const ideas = useQuery(api.ideas.list);
  const sessions = useQuery(api.mentorshipSessions.list);
  const settings = useQuery(api.userSettings.get, {});
  const savedInsights = useQuery(api.aiInsights.list, {});

  const analyzeAction = useAction(api.ai.analyze.analyze);
  const updateStatus = useMutation(api.aiInsights.updateStatus);
  const removeInsight = useMutation(api.aiInsights.remove);

  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<InsightType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [selectedInsightId, setSelectedInsightId] = useState<Id<"aiInsights"> | null>(null);
  const [showCharts, setShowCharts] = useState(true);

  const isDataReady = streams !== undefined && ideas !== undefined && sessions !== undefined;
  const hasData = (streams?.length ?? 0) > 0 || (ideas?.length ?? 0) > 0 || (sessions?.length ?? 0) > 0;
  const isInsightsLoading = savedInsights === undefined;

  // Compute stats
  const allInsights = savedInsights ?? [];
  const totalInsights = allInsights.length;
  const unreadCount = allInsights.filter((i) => i.status === "unread").length;
  const highPriorityCount = allInsights.filter((i) => i.priority === "high" && i.status !== "dismissed").length;
  const avgConfidence = totalInsights > 0
    ? Math.round((allInsights.reduce((s, i) => s + i.confidence, 0) / totalInsights) * 100)
    : 0;

  // Chart data
  const insightsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    allInsights.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return counts;
  }, [allInsights]);

  const insightsByPriority = useMemo(() => {
    const active = allInsights.filter((i) => i.status !== "dismissed");
    return {
      high: active.filter((i) => i.priority === "high").length,
      medium: active.filter((i) => i.priority === "medium").length,
      low: active.filter((i) => i.priority === "low").length,
    };
  }, [allInsights]);

  // Filtered insights
  const filteredInsights = useMemo(() => {
    let filtered = allInsights;
    if (typeFilter !== "all") {
      filtered = filtered.filter((i) => i.type === typeFilter);
    }
    if (statusFilter === "active") {
      filtered = filtered.filter((i) => i.status !== "dismissed");
    } else if (statusFilter === "dismissed") {
      filtered = filtered.filter((i) => i.status === "dismissed");
    }
    return filtered;
  }, [allInsights, typeFilter, statusFilter]);

  const selectedInsight = selectedInsightId
    ? allInsights.find((i) => i._id === selectedInsightId)
    : null;

  const generateInsights = async () => {
    if (!isDataReady || !hasData) return;

    if (!settings) {
      toast.error("Please configure AI settings first");
      return;
    }

    setLoading(true);
    try {
      const promises = [];

      if (streams && streams.length > 0) {
        promises.push(
          analyzeAction({
            analysisType: "revenue",
            businessData: JSON.stringify({
              incomeStreams: streams.map((s) => ({
                name: s.name,
                monthlyRevenue: s.monthlyRevenue,
                status: s.status,
                category: s.category,
                timeInvestment: s.timeInvestment,
                growthRate: s.growthRate,
              })),
            }),
          })
        );
      }

      if (ideas && ideas.length > 0) {
        promises.push(
          analyzeAction({
            analysisType: "idea",
            businessData: JSON.stringify({
              ideas: ideas.map((i) => ({
                title: i.title,
                description: i.description,
                stage: i.stage,
                potentialRevenue: i.potentialRevenue,
                implementationComplexity: i.implementationComplexity,
                aiRelevance: i.aiRelevance,
                hardwareComponent: i.hardwareComponent,
              })),
            }),
          })
        );
      }

      if (sessions && sessions.length > 0) {
        promises.push(
          analyzeAction({
            analysisType: "mentorship",
            businessData: JSON.stringify({
              sessions: sessions.slice(0, 5).map((s) => ({
                mentorName: s.mentorName,
                sessionType: s.sessionType,
                topics: s.topics,
                keyInsights: s.keyInsights,
                rating: s.rating,
                date: s.date,
              })),
            }),
          })
        );
      }

      await Promise.all(promises);
      toast.success(`Generated ${promises.length} new insight${promises.length > 1 ? "s" : ""}`);
    } catch (err) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : "Failed to generate insights";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: Id<"aiInsights">) => {
    try {
      await updateStatus({ id, status: "dismissed" });
      toast.success("Insight dismissed");
    } catch {
      toast.error("Failed to dismiss insight");
    }
  };

  const handleMarkRead = async (id: Id<"aiInsights">) => {
    try {
      await updateStatus({ id, status: "read" });
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleDelete = async (id: Id<"aiInsights">) => {
    try {
      await removeInsight({ id });
      if (selectedInsightId === id) setSelectedInsightId(null);
      toast.success("Insight deleted");
    } catch {
      toast.error("Failed to delete insight");
    }
  };

  const openDetail = (id: Id<"aiInsights">) => {
    setSelectedInsightId(id);
    const insight = allInsights.find((i) => i._id === id);
    if (insight?.status === "unread") {
      handleMarkRead(id);
    }
  };

  const insightIcon = (type: string) => {
    switch (type) {
      case "revenue": return TrendingUp;
      case "idea": return Lightbulb;
      case "mentorship": return Users;
      default: return Brain;
    }
  };

  const priorityVariant = (p: string) => {
    switch (p) {
      case "high": return "danger" as const;
      case "medium": return "warning" as const;
      default: return "default" as const;
    }
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case "unread": return "purple" as const;
      case "read": return "default" as const;
      case "dismissed": return "default" as const;
      default: return "default" as const;
    }
  };

  const typeLabel = (t: string) => {
    switch (t) {
      case "revenue": return "Revenue";
      case "idea": return "Ideas";
      case "mentorship": return "Mentorship";
      default: return t;
    }
  };

  // Settings not configured
  if (settings === null) {
    return (
      <>
        <PageHeader title="AI Insights" description="AI-powered analysis of your business data" />
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            AI Settings Required
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
            Configure your AI provider and API key to start generating insights.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Go to Settings
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="AI Insights"
        description="AI-powered analysis of your business data"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
            <button
              onClick={generateInsights}
              disabled={loading || !hasData || !settings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {loading ? "Analyzing..." : "Generate Insights"}
            </button>
          </div>
        }
      />

      {/* Stat Cards */}
      {isInsightsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Insights"
            value={totalInsights}
            detail={`${allInsights.filter((i) => i.status !== "dismissed").length} active`}
            icon={Brain}
          />
          <StatCard
            label="Unread"
            value={unreadCount}
            detail={unreadCount > 0 ? "needs attention" : "all caught up"}
            icon={Eye}
          />
          <StatCard
            label="High Priority"
            value={highPriorityCount}
            detail="active insights"
            icon={AlertTriangle}
          />
          <StatCard
            label="Avg Confidence"
            value={`${avgConfidence}%`}
            detail="across all insights"
            icon={BarChart3}
          />
        </div>
      )}

      {/* Charts Section */}
      {totalInsights > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors mb-3"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showCharts ? "Hide" : "Show"} Charts
            {showCharts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Insights by Type
                </h3>
                <DoughnutChart
                  labels={Object.keys(insightsByType).map(typeLabel)}
                  data={Object.values(insightsByType)}
                />
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Active Insights by Priority
                </h3>
                <BarChart
                  labels={["High", "Medium", "Low"]}
                  data={[insightsByPriority.high, insightsByPriority.medium, insightsByPriority.low]}
                  label="Insights"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(["all", "revenue", "idea", "mentorship"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {t === "all" ? "All" : typeLabel(t)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(["active", "all", "dismissed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              {s === "active" ? "Active" : s === "all" ? "All" : "Dismissed"}
            </button>
          ))}
        </div>
        {filteredInsights.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {filteredInsights.length} insight{filteredInsights.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Insights List */}
      {!hasData && isDataReady ? (
        <EmptyState
          icon={<Sparkles className="w-10 h-10" />}
          title="No data to analyze"
          description="Add income streams, ideas, or mentorship sessions first, then come back for AI insights."
        />
      ) : filteredInsights.length === 0 && !isInsightsLoading ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Brain className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {totalInsights === 0 ? "Ready to analyze" : "No matching insights"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
            {totalInsights === 0
              ? 'Click "Generate Insights" to get AI-powered analysis of your business data.'
              : "Try adjusting your filters to see more insights."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInsights.map((insight) => {
            const Icon = insightIcon(insight.type);
            return (
              <div
                key={insight._id}
                className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors ${
                  insight.status === "unread"
                    ? "ring-1 ring-purple-200 dark:ring-purple-800/50"
                    : ""
                }`}
                onClick={() => openDetail(insight._id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {insight.title}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(insight._id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={priorityVariant(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <Badge variant={statusVariant(insight.status)}>
                        {insight.status}
                      </Badge>
                      <span className="text-xs text-gray-400 tabular-nums">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                      <span className="text-xs text-gray-400">
                        {insight.model}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(insight.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {insight.body}
                    </p>
                    {insight.actionItems.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {insight.actionItems.length} action item{insight.actionItems.length !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail SlideOver */}
      <SlideOver
        open={selectedInsight !== null && selectedInsight !== undefined}
        onClose={() => setSelectedInsightId(null)}
        title="Insight Detail"
        wide
      >
        {selectedInsight && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = insightIcon(selectedInsight.type);
                  return (
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                  );
                })()}
                <Badge variant={priorityVariant(selectedInsight.priority)}>
                  {selectedInsight.priority} priority
                </Badge>
                <Badge variant="default">
                  {typeLabel(selectedInsight.type)}
                </Badge>
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {selectedInsight.title}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(selectedInsight.createdAt).toLocaleString()}
                </span>
                <span>
                  {Math.round(selectedInsight.confidence * 100)}% confidence
                </span>
                <span>{selectedInsight.model}</span>
              </div>
            </div>

            {/* Body */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Analysis
              </h4>
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                {selectedInsight.body}
              </div>
            </div>

            {/* Action Items */}
            {selectedInsight.actionItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Recommended Actions
                </h4>
                <ul className="space-y-2">
                  {selectedInsight.actionItems.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              {selectedInsight.status !== "dismissed" && (
                <button
                  onClick={() => handleDismiss(selectedInsight._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Dismiss
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedInsight._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}
      </SlideOver>
    </>
  );
}
