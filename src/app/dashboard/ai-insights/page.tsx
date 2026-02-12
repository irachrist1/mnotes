"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkles, RefreshCw, Brain, TrendingUp, Lightbulb, Users } from "lucide-react";
import { toast } from "sonner";
import { aiService, type AIInsight } from "@/services/ai.service";

export default function AIInsightsPage() {
  const streams = useQuery(api.incomeStreams.list);
  const ideas = useQuery(api.ideas.list);
  const sessions = useQuery(api.mentorshipSessions.list);

  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [ultraMode, setUltraMode] = useState(false);

  const isDataReady = streams !== undefined && ideas !== undefined && sessions !== undefined;
  const hasData = (streams?.length ?? 0) > 0 || (ideas?.length ?? 0) > 0 || (sessions?.length ?? 0) > 0;

  const generateInsights = async () => {
    if (!isDataReady) return;
    setLoading(true);
    try {
      const result = await aiService.generateBusinessIntelligence(
        {
          incomeStreams: (streams ?? []).map((s) => ({ ...s, id: s._id, trend: s.growthRate > 0 ? "up" : s.growthRate < 0 ? "down" : "stable" })),
          ideas: (ideas ?? []).map((i) => ({ ...i, id: i._id, complexity: i.implementationComplexity, revenuePotential: i.potentialRevenue, isAIRelevant: i.aiRelevance, hasHardwareComponent: i.hardwareComponent })),
          mentorshipSessions: (sessions ?? []).map((s) => ({ ...s, id: s._id })),
          analytics: {},
        },
        ultraMode
      );
      setInsights(result);
      toast.success(`Generated ${result.length} insights`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate insights. Check your AI API keys.");
    } finally { setLoading(false); }
  };

  const insightIcon = (type: string) => { switch (type) { case "revenue_optimization": return TrendingUp; case "idea_scoring": return Lightbulb; case "mentorship_analysis": return Users; default: return Brain; } };
  const priorityVariant = (p: string) => { switch (p) { case "high": return "danger" as const; case "medium": return "warning" as const; default: return "default" as const; } };

  return (
    <>
      <PageHeader title="AI Insights" description="AI-powered analysis of your business data"
        action={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <input type="checkbox" checked={ultraMode} onChange={(e) => setUltraMode(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600 text-gray-900 focus:ring-gray-900" />Ultra Mode
            </label>
            <button onClick={generateInsights} disabled={loading || !hasData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50">
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? "Analyzing…" : "Generate Insights"}
            </button>
          </div>
        }
      />

      {!hasData && isDataReady ? (
        <EmptyState icon={Sparkles} title="No data to analyze" description="Add income streams, ideas, or mentorship sessions first, then come back for AI insights." />
      ) : insights.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4"><Brain className="w-6 h-6 text-gray-400" /></div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Ready to analyze</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">Click &ldquo;Generate Insights&rdquo; to get AI-powered analysis of your business data.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, i) => {
            const Icon = insightIcon(insight.type);
            return (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{insight.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={priorityVariant(insight.priority)}>{insight.priority}</Badge>
                      {insight.mode === "ultra" && <Badge variant="purple">Ultra</Badge>}
                      <span className="text-xs text-gray-400 tabular-nums">{Math.round(insight.confidence)}% confidence</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{insight.insight}</p>
                {insight.actionItems.length > 0 && (
                  <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Recommended Actions</p>
                    <ul className="space-y-1">{insight.actionItems.map((item, j) => (<li key={j} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-1.5"><span className="text-gray-400 mt-0.5">→</span>{item}</li>))}</ul>
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
