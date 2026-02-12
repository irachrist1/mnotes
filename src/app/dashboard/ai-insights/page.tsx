"use client";

import { useState } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkles, RefreshCw, Brain, TrendingUp, Lightbulb, Users, X, Settings } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";

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

  const isDataReady = streams !== undefined && ideas !== undefined && sessions !== undefined;
  const hasData = (streams?.length ?? 0) > 0 || (ideas?.length ?? 0) > 0 || (sessions?.length ?? 0) > 0;

  const generateInsights = async () => {
    if (!isDataReady || !hasData) return;
    
    if (!settings) {
      toast.error("Please configure AI settings first");
      return;
    }

    setLoading(true);
    try {
      const promises = [];

      // Generate revenue insights if we have income streams
      if (streams && streams.length > 0) {
        const revenueData = JSON.stringify({
          incomeStreams: streams.map((s) => ({
            name: s.name,
            monthlyRevenue: s.monthlyRevenue,
            status: s.status,
            category: s.category,
            timeInvestment: s.timeInvestment,
            growthRate: s.growthRate,
          })),
        });
        promises.push(
          analyzeAction({
            analysisType: "revenue",
            businessData: revenueData,
          })
        );
      }

      // Generate idea insights if we have ideas
      if (ideas && ideas.length > 0) {
        const ideaData = JSON.stringify({
          ideas: ideas.map((i) => ({
            title: i.title,
            description: i.description,
            stage: i.stage,
            potentialRevenue: i.potentialRevenue,
            implementationComplexity: i.implementationComplexity,
            aiRelevance: i.aiRelevance,
            hardwareComponent: i.hardwareComponent,
          })),
        });
        promises.push(
          analyzeAction({
            analysisType: "idea",
            businessData: ideaData,
          })
        );
      }

      // Generate mentorship insights if we have sessions
      if (sessions && sessions.length > 0) {
        const mentorshipData = JSON.stringify({
          sessions: sessions.slice(0, 5).map((s) => ({
            mentorName: s.mentorName,
            sessionType: s.sessionType,
            topics: s.topics,
            keyInsights: s.keyInsights,
            rating: s.rating,
            date: s.date,
          })),
        });
        promises.push(
          analyzeAction({
            analysisType: "mentorship",
            businessData: mentorshipData,
          })
        );
      }

      await Promise.all(promises);
      toast.success(`Generated ${promises.length} new insight${promises.length > 1 ? 's' : ''}`);
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
    } catch (err) {
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

  const insightIcon = (type: string) => {
    switch (type) {
      case "revenue":
        return TrendingUp;
      case "idea":
        return Lightbulb;
      case "mentorship":
        return Users;
      default:
        return Brain;
    }
  };

  const priorityVariant = (p: string) => {
    switch (p) {
      case "high":
        return "danger" as const;
      case "medium":
        return "warning" as const;
      default:
        return "default" as const;
    }
  };

  const statusVariant = (s: string) => {
    switch (s) {
      case "unread":
        return "purple" as const;
      case "read":
        return "default" as const;
      case "dismissed":
        return "muted" as const;
      default:
        return "default" as const;
    }
  };

  const activeInsights = savedInsights?.filter((i) => i.status !== "dismissed") || [];

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
              {loading ? "Analyzing…" : "Generate Insights"}
            </button>
          </div>
        }
      />

      {!settings ? (
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
      ) : !hasData && isDataReady ? (
        <EmptyState
          icon={Sparkles}
          title="No data to analyze"
          description="Add income streams, ideas, or mentorship sessions first, then come back for AI insights."
        />
      ) : activeInsights.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Brain className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Ready to analyze
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
            Click &ldquo;Generate Insights&rdquo; to get AI-powered analysis of your business data.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeInsights.map((insight) => {
            const Icon = insightIcon(insight.type);
            return (
              <div
                key={insight._id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5"
                onClick={() => {
                  if (insight.status === "unread") {
                    handleMarkRead(insight._id);
                  }
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {insight.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={priorityVariant(insight.priority)}>
                        {insight.priority}
                      </Badge>
                      <Badge variant={statusVariant(insight.status)}>
                        {insight.status}
                      </Badge>
                      <span className="text-xs text-gray-400 tabular-nums">
                        {Math.round(insight.confidence * 100)}% confidence
                      </span>
                      <span className="text-xs text-gray-400">
                        {insight.model}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(insight._id);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed whitespace-pre-wrap">
                  {insight.body}
                </p>
                {insight.actionItems.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                      Recommended Actions
                    </p>
                    <ul className="space-y-1">
                      {insight.actionItems.map((item, j) => (
                        <li
                          key={j}
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1.5"
                        >
                          <span className="text-gray-400 mt-0.5">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
