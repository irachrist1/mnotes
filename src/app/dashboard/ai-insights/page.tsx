"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SlideOver } from "@/components/ui/SlideOver";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { DoughnutChart, BarChart } from "@/components/ui/LazyCharts";
import {
  Sparkles,
  RefreshCw,
  Brain,
  BookmarkPlus,
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
import { WEEKS_PER_MONTH } from "@/lib/constants";
import { useSearchParams } from "next/navigation";

type InsightType = "all" | "revenue" | "idea" | "mentorship";
type StatusFilter = "active" | "all" | "dismissed";
type InsightsTab = "generated" | "saved";
const INSIGHT_TYPE_ORDER = ["revenue", "idea", "mentorship"] as const;

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

export function getSaveButtonLabel(args: {
  isSaved: boolean;
  isSaving: boolean;
  isNearDuplicate: boolean;
}): string {
  if (args.isSaved) return "Saved";
  if (args.isSaving) return "Saving...";
  if (args.isNearDuplicate) return "Similar exists";
  return "Save";
}

export default function AIInsightsPage() {
  const searchParams = useSearchParams();
  const streams = useQuery(api.incomeStreams.list);
  const ideas = useQuery(api.ideas.list);
  const sessions = useQuery(api.mentorshipSessions.list);
  const settings = useQuery(api.userSettings.get, {});
  const generatedInsights = useQuery(api.aiInsights.listGenerated, {});
  const durableInsights = useQuery(api.savedInsights.list, {
    includeArchived: false,
    limit: 2000,
  });

  const analyzeAction = useAction(api.ai.analyze.analyze);
  const saveGeneratedInsight = useAction(api.aiInsights.saveGenerated);
  const updateStatus = useMutation(api.aiInsights.updateStatus);
  const removeInsight = useMutation(api.aiInsights.remove);
  const archiveSavedInsight = useMutation(api.savedInsights.archive);
  const togglePinSavedInsight = useMutation(api.savedInsights.togglePin);
  const removeSavedInsight = useMutation(api.savedInsights.remove);
  const touchSavedInsightUsage = useMutation(api.savedInsights.touchUsage);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<InsightsTab>("generated");
  const [typeFilter, setTypeFilter] = useState<InsightType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [selectedInsightId, setSelectedInsightId] = useState<Id<"aiInsights"> | null>(null);
  const [selectedSavedInsightId, setSelectedSavedInsightId] = useState<Id<"savedInsights"> | null>(null);
  const [savingInsightId, setSavingInsightId] = useState<Id<"aiInsights"> | null>(null);
  const [nearDuplicateIds, setNearDuplicateIds] = useState<Set<string>>(new Set());
  const [showCharts, setShowCharts] = useState(true);
  const routeSelectionRef = useRef<string | null>(null);

  const isDataReady = streams !== undefined && ideas !== undefined && sessions !== undefined;
  const hasData = (streams?.length ?? 0) > 0 || (ideas?.length ?? 0) > 0 || (sessions?.length ?? 0) > 0;
  const isInsightsLoading = generatedInsights === undefined;

  // Compute stats
  const allInsights = generatedInsights ?? [];
  const allSavedInsights = durableInsights ?? [];
  const totalInsights = allInsights.length;
  const totalSavedInsights = allSavedInsights.length;
  const unreadCount = allInsights.filter((i) => i.status === "unread").length;
  const highPriorityCount = allInsights.filter((i) => i.priority === "high" && i.status !== "dismissed").length;
  const highPrioritySavedCount = allSavedInsights.filter((i) => i.priority === "high").length;
  const pinnedSavedCount = allSavedInsights.filter((i) => i.pinned).length;
  const avgConfidence = totalInsights > 0
    ? Math.round((allInsights.reduce((s, i) => s + i.confidence, 0) / totalInsights) * 100)
    : 0;
  const avgSavedConfidence = totalSavedInsights > 0
    ? Math.round((allSavedInsights.reduce((s, i) => s + i.confidence, 0) / totalSavedInsights) * 100)
    : 0;
  const savedSourceIds = useMemo(
    () => new Set(allSavedInsights.map((insight) => String(insight.sourceInsightId))),
    [allSavedInsights]
  );
  const insightsForCharts = activeTab === "saved" ? allSavedInsights : allInsights;

  // Chart data
  const insightsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    insightsForCharts.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return counts;
  }, [insightsForCharts]);

  const insightsByPriority = useMemo(() => {
    const active = activeTab === "saved"
      ? allSavedInsights
      : allInsights.filter((i) => i.status !== "dismissed");
    return {
      high: active.filter((i) => i.priority === "high").length,
      medium: active.filter((i) => i.priority === "medium").length,
      low: active.filter((i) => i.priority === "low").length,
    };
  }, [activeTab, allInsights, allSavedInsights]);

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

  const filteredSavedInsights = useMemo(() => {
    let filtered = allSavedInsights;
    if (typeFilter !== "all") {
      filtered = filtered.filter((i) => i.type === typeFilter);
    }
    return filtered;
  }, [allSavedInsights, typeFilter]);

  const selectedInsight = selectedInsightId
    ? allInsights.find((i) => i._id === selectedInsightId)
    : null;
  const selectedSavedInsight = selectedSavedInsightId
    ? allSavedInsights.find((i) => i._id === selectedSavedInsightId)
    : null;

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "saved") {
      setActiveTab("saved");
    } else if (tabParam === "generated") {
      setActiveTab("generated");
    }

    const savedId = searchParams.get("saved");
    if (!savedId || !allSavedInsights.length) return;
    if (routeSelectionRef.current === savedId) return;

    const match = allSavedInsights.find((insight) => String(insight._id) === savedId);
    if (!match) return;

    routeSelectionRef.current = savedId;
    setActiveTab("saved");
    setSelectedSavedInsightId(match._id);
    void touchSavedInsightUsage({ id: match._id }).catch(() => {
      // Non-blocking usage tracking.
    });
  }, [allSavedInsights, searchParams, touchSavedInsightUsage]);

  useEffect(() => {
    if (activeTab === "saved") {
      setSelectedInsightId(null);
      return;
    }
    setSelectedSavedInsightId(null);
  }, [activeTab]);

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
                weeklyRevenue: Number((s.monthlyRevenue / WEEKS_PER_MONTH).toFixed(2)),
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
              sessions: sessions.slice(0, 12).map((s) => ({
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

  const handleOpenSavedDetail = (id: Id<"savedInsights">) => {
    setSelectedSavedInsightId(id);
    void touchSavedInsightUsage({ id }).catch(() => {
      // Non-blocking usage tracking.
    });
  };

  const handleToggleSavedPin = async (id: Id<"savedInsights">, current: boolean) => {
    try {
      await togglePinSavedInsight({ id, pinned: !current });
      toast.success(current ? "Insight unpinned" : "Insight pinned");
    } catch {
      toast.error("Failed to update pin");
    }
  };

  const handleArchiveSaved = async (id: Id<"savedInsights">) => {
    try {
      await archiveSavedInsight({ id, archived: true });
      if (selectedSavedInsightId === id) setSelectedSavedInsightId(null);
      toast.success("Insight archived");
    } catch {
      toast.error("Failed to archive insight");
    }
  };

  const handleDeleteSaved = async (id: Id<"savedInsights">) => {
    try {
      await removeSavedInsight({ id });
      if (selectedSavedInsightId === id) setSelectedSavedInsightId(null);
      toast.success("Saved insight deleted");
    } catch {
      toast.error("Failed to delete saved insight");
    }
  };

  const handleSave = async (id: Id<"aiInsights">, allowNearDuplicate = false) => {
    if (savedSourceIds.has(String(id))) return;

    setSavingInsightId(id);
    try {
      const result = await saveGeneratedInsight({
        generatedInsightId: id,
        allowNearDuplicate,
      });

      if (result.status === "saved") {
        setNearDuplicateIds((prev) => {
          const next = new Set(prev);
          next.delete(String(id));
          return next;
        });
        toast.success("Insight saved");
        return;
      }

      if (result.status === "already_saved") {
        setNearDuplicateIds((prev) => {
          const next = new Set(prev);
          next.delete(String(id));
          return next;
        });
        toast.message("Insight already saved");
        return;
      }

      setNearDuplicateIds((prev) => {
        const next = new Set(prev);
        next.add(String(id));
        return next;
      });

      const confirmSave = window.confirm(
        `A similar saved insight already exists (${Math.round(result.similarity * 100)}% match). Save anyway?`
      );
      if (confirmSave) {
        await handleSave(id, true);
      }
    } catch {
      toast.error("Failed to save insight");
    } finally {
      setSavingInsightId((current) => (current === id ? null : current));
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
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-stone-400" />
          </div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
            AI Settings Required
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-4">
            Configure your AI provider and API key to start generating insights.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-secondary text-sm transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
            {activeTab === "generated" && (
              <button
                onClick={generateInsights}
                disabled={loading || !hasData || !settings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md btn-primary text-sm transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {loading ? "Analyzing..." : "Generate Insights"}
              </button>
            )}
          </div>
        }
      />

      <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5 mb-4 w-fit">
        {([
          { key: "generated", label: "Generated" },
          { key: "saved", label: "Saved" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {settings === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label={activeTab === "saved" ? "Saved Insights" : "Total Insights"}
            value={activeTab === "saved" ? totalSavedInsights : totalInsights}
            detail={activeTab === "saved"
              ? `${pinnedSavedCount} pinned`
              : `${allInsights.filter((i) => i.status !== "dismissed").length} active`}
            icon={Brain}
          />
          <StatCard
            label={activeTab === "saved" ? "Pinned" : "Unread"}
            value={activeTab === "saved" ? pinnedSavedCount : unreadCount}
            detail={activeTab === "saved"
              ? "quick access"
              : unreadCount > 0 ? "needs attention" : "all caught up"}
            icon={Eye}
          />
          <StatCard
            label="High Priority"
            value={activeTab === "saved" ? highPrioritySavedCount : highPriorityCount}
            detail="active insights"
            icon={AlertTriangle}
          />
          <StatCard
            label="Avg Confidence"
            value={`${activeTab === "saved" ? avgSavedConfidence : avgConfidence}%`}
            detail="across all insights"
            icon={BarChart3}
          />
        </div>
      )}

      {/* Charts Section */}
      {insightsForCharts.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors mb-3"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showCharts ? "Hide" : "Show"} Charts
            {showCharts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-5">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
                  Insights by Type
                </h3>
                <DoughnutChart
                  labels={INSIGHT_TYPE_ORDER.filter((type) => insightsByType[type] !== undefined).map(typeLabel)}
                  data={INSIGHT_TYPE_ORDER.filter((type) => insightsByType[type] !== undefined).map((type) => insightsByType[type])}
                />
              </div>
              <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 p-5">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
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
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
          {(["all", "revenue", "idea", "mentorship"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              {t === "all" ? "All" : typeLabel(t)}
            </button>
          ))}
        </div>
        {activeTab === "generated" && (
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
            {(["active", "all", "dismissed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                }`}
              >
                {s === "active" ? "Active" : s === "all" ? "All" : "Dismissed"}
              </button>
            ))}
          </div>
        )}
        {(activeTab === "generated" ? filteredInsights.length : filteredSavedInsights.length) > 0 && (
          <span className="text-xs text-stone-400 ml-auto">
            {activeTab === "generated" ? filteredInsights.length : filteredSavedInsights.length} insight{(activeTab === "generated" ? filteredInsights.length : filteredSavedInsights.length) !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Insights List */}
      {activeTab === "generated" ? (
        !hasData && isDataReady ? (
          <EmptyState
            icon={Sparkles}
            title="No data to analyze"
            description="Add income streams, ideas, or mentorship sessions first, then come back for AI insights."
          />
        ) : filteredInsights.length === 0 && !isInsightsLoading ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-stone-400" />
            </div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
              {totalInsights === 0 ? "Ready to analyze" : "No matching insights"}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-4">
              {totalInsights === 0
                ? 'Click "Generate Insights" to get AI-powered analysis of your business data.'
                : "Try adjusting your filters to see more insights."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInsights.map((insight) => {
              const Icon = insightIcon(insight.type);
              const isSaved = savedSourceIds.has(String(insight._id));
              const isSaving = savingInsightId === insight._id;
              const isNearDuplicate = nearDuplicateIds.has(String(insight._id));
              return (
                <div
                  key={insight._id}
                  className={`card p-5 cursor-pointer card-hover ${
                    insight.status === "unread"
                      ? "ring-1 ring-purple-200 dark:ring-purple-800/50"
                      : ""
                  }`}
                  onClick={() => openDetail(insight._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-stone-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                          {insight.title}
                        </h3>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleSave(insight._id);
                            }}
                            disabled={isSaved || isSaving}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              isSaved
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 cursor-default"
                                : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                            } disabled:opacity-70`}
                            title="Save insight"
                          >
                            {getSaveButtonLabel({
                              isSaved,
                              isSaving,
                              isNearDuplicate,
                            })}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismiss(insight._id);
                            }}
                            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors rounded-md hover:bg-stone-100 dark:hover:bg-stone-800"
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
                        {isSaved && (
                          <Badge variant="success">saved</Badge>
                        )}
                        <span className="text-xs text-stone-400 tabular-nums">
                          {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className="text-xs text-stone-400">
                          {insight.model}
                        </span>
                        <span className="text-xs text-stone-400 ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(insight.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                        {insight.body}
                      </p>
                      {insight.actionItems.length > 0 && (
                        <p className="text-xs text-stone-400 mt-2">
                          {insight.actionItems.length} action item{insight.actionItems.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredSavedInsights.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <BookmarkPlus className="w-6 h-6 text-stone-400" />
          </div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
            No saved insights yet
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mb-4">
            Save insights from the Generated tab to build your long-term memory.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSavedInsights.map((insight) => {
            const Icon = insightIcon(insight.type);
            return (
              <div
                key={insight._id}
                className="card p-5 cursor-pointer card-hover"
                onClick={() => handleOpenSavedDetail(insight._id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-stone-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {insight.title}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleToggleSavedPin(insight._id, insight.pinned);
                          }}
                          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                            insight.pinned
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                          }`}
                        >
                          {insight.pinned ? "Pinned" : "Pin"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleArchiveSaved(insight._id);
                          }}
                          className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors rounded-md hover:bg-stone-100 dark:hover:bg-stone-800"
                          title="Archive"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={priorityVariant(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      {insight.pinned && (
                        <Badge variant="info">pinned</Badge>
                      )}
                      <span className="text-xs text-stone-400 tabular-nums">
                        {Math.round(insight.confidence * 100)}%
                      </span>
                      <span className="text-xs text-stone-400">
                        {insight.model}
                      </span>
                      <span className="text-xs text-stone-400 ml-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(insight.savedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2">
                      {insight.bodySummary || insight.body}
                    </p>
                    {insight.actionItems.length > 0 && (
                      <p className="text-xs text-stone-400 mt-2">
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
            {(() => {
              const isSaved = savedSourceIds.has(String(selectedInsight._id));
              const isSaving = savingInsightId === selectedInsight._id;
              const isNearDuplicate = nearDuplicateIds.has(String(selectedInsight._id));
              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleSave(selectedInsight._id)}
                    disabled={isSaved || isSaving}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isSaved
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 cursor-default"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                    } disabled:opacity-70`}
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    {getSaveButtonLabel({
                      isSaved,
                      isSaving,
                      isNearDuplicate,
                    })}
                  </button>
                </div>
              );
            })()}

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const Icon = insightIcon(selectedInsight.type);
                  return (
                    <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-stone-500" />
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
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                {selectedInsight.title}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
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
              <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                Analysis
              </h4>
              <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4">
                {selectedInsight.body}
              </div>
            </div>

            {/* Action Items */}
            {selectedInsight.actionItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                  Recommended Actions
                </h4>
                <ul className="space-y-2">
                  {selectedInsight.actionItems.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
              {selectedInsight.status !== "dismissed" && (
                <button
                  onClick={() => handleDismiss(selectedInsight._id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
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

      <SlideOver
        open={selectedSavedInsight !== null && selectedSavedInsight !== undefined}
        onClose={() => setSelectedSavedInsightId(null)}
        title="Saved Insight"
        wide
      >
        {selectedSavedInsight && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => void handleToggleSavedPin(selectedSavedInsight._id, selectedSavedInsight.pinned)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedSavedInsight.pinned
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
              >
                {selectedSavedInsight.pinned ? "Unpin" : "Pin"}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={priorityVariant(selectedSavedInsight.priority)}>
                  {selectedSavedInsight.priority} priority
                </Badge>
                <Badge variant="default">
                  {typeLabel(selectedSavedInsight.type)}
                </Badge>
                {selectedSavedInsight.pinned && (
                  <Badge variant="info">pinned</Badge>
                )}
              </div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                {selectedSavedInsight.title}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Saved {new Date(selectedSavedInsight.savedAt).toLocaleString()}
                </span>
                <span>{Math.round(selectedSavedInsight.confidence * 100)}% confidence</span>
                <span>{selectedSavedInsight.model}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                Analysis
              </h4>
              <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4">
                {selectedSavedInsight.body}
              </div>
            </div>

            {selectedSavedInsight.actionItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                  Recommended Actions
                </h4>
                <ul className="space-y-2">
                  {selectedSavedInsight.actionItems.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3"
                    >
                      <CheckCircle2 className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => void handleArchiveSaved(selectedSavedInsight._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-sm font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Archive
              </button>
              <button
                onClick={() => void handleDeleteSaved(selectedSavedInsight._id)}
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
