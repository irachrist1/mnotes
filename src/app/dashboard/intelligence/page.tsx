"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BarChart3, ChevronDown, Brain, X, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

// Lazy-load both sections — charts and AI logic are heavy
const AIInsightsContent = dynamic(
    () =>
        import("@/app/dashboard/ai-insights/page").then(
            (m) => m.AIInsightsContent
        ),
    { ssr: false, loading: () => <SectionSkeleton /> }
);
const AnalyticsContent = dynamic(
    () =>
        import("@/app/dashboard/analytics/page").then((m) => m.AnalyticsContent),
    { ssr: false, loading: () => <SectionSkeleton /> }
);

function SectionSkeleton() {
    return (
        <div className="space-y-4 py-4" aria-label="Loading section">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
            </div>
            <Skeleton className="h-64 rounded-lg" />
        </div>
    );
}

type Section = {
    key: string;
    label: string;
    icon: React.ElementType;
};

const SECTIONS: Section[] = [
    {
        key: "insights",
        label: "AI Insights",
        icon: Sparkles,
    },
    {
        key: "analytics",
        label: "Analytics",
        icon: BarChart3,
    },
];

function InsightDetailModal({
    insightId,
    onClose,
}: {
    insightId: string;
    onClose: () => void;
}) {
    const insights = useQuery(api.aiInsights.listGenerated, {});
    const insight = insights?.find((i) => String(i._id) === insightId);

    if (insights === undefined) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onMouseDown={onClose} />
                <div className="relative card p-8 max-w-lg w-full mx-4">
                    <div className="space-y-3">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    if (!insight) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onMouseDown={onClose} />
                <div className="relative card p-8 max-w-lg w-full mx-4 text-center">
                    <p className="text-sm text-stone-500">Insight not found.</p>
                    <button onClick={onClose} className="mt-4 text-sm font-medium text-blue-600 hover:underline">Close</button>
                </div>
            </div>
        );
    }

    const priorityVariant = (p: string) => {
        switch (p) {
            case "high": return "danger" as const;
            case "medium": return "warning" as const;
            default: return "default" as const;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onMouseDown={onClose} />
            <div className="relative card max-w-2xl w-full max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-stone-200 dark:border-white/[0.06]">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant={priorityVariant(insight.priority)}>
                                {insight.priority}
                            </Badge>
                            <Badge variant="default">{insight.type}</Badge>
                        </div>
                        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                            {insight.title}
                        </h2>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-stone-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(insight.createdAt).toLocaleString()}
                            </span>
                            <span>{Math.round(insight.confidence * 100)}% confidence</span>
                        </div>
                    </div>
                    <button
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        }}
                        className="btn-icon w-8 h-8 shrink-0"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    <div>
                        <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Analysis</h4>
                        <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap bg-stone-50 dark:bg-stone-800/50 rounded-lg p-4">
                            {insight.body}
                        </div>
                    </div>

                    {insight.actionItems.length > 0 && (
                        <div>
                            <h4 className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">Recommended Actions</h4>
                            <ul className="space-y-2">
                                {insight.actionItems.map((item, j) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3">
                                        <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function IntelligencePage() {
    const searchParams = useSearchParams();
    const [openSections, setOpenSections] = useState<Set<string>>(
        new Set()
    );
    const [detailInsightId, setDetailInsightId] = useState<string | null>(null);

    // Deep-link: ?insightId=xxx opens the detail modal
    useEffect(() => {
        const insightId = searchParams.get("insightId");
        if (insightId) {
            setDetailInsightId(insightId);
            // Auto-open insights section so it's visible behind the modal
            setOpenSections((prev) => {
                const next = new Set(prev);
                next.add("insights");
                return next;
            });
        }
    }, [searchParams]);

    const toggle = (key: string) => {
        setOpenSections((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {/* Page header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-blue-600/[0.08] dark:bg-blue-400/[0.10] flex items-center justify-center">
                    <Brain className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                        Intelligence
                    </h1>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                        What I&apos;ve discovered about your business
                    </p>
                </div>
            </div>

            {/* Collapsible sections */}
            {SECTIONS.map((section) => {
                const isOpen = openSections.has(section.key);
                const Icon = section.icon;
                return (
                    <div key={section.key} className="card overflow-hidden">
                        <button
                            onClick={() => toggle(section.key)}
                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors duration-150 text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                            </div>
                            <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex-1">
                                {section.label}
                            </span>
                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ChevronDown className="w-4 h-4 text-stone-400" />
                            </motion.div>
                        </button>

                        <AnimatePresence initial={false}>
                            {isOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-5 pt-4 pb-5 border-t border-stone-100 dark:border-stone-800">
                                        {section.key === "insights" && <AIInsightsContent hideHeader />}
                                        {section.key === "analytics" && <AnalyticsContent hideHeader />}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}

            {/* Detail modal for deep-linked insights */}
            {detailInsightId && (
                <InsightDetailModal
                    insightId={detailInsightId}
                    onClose={() => setDetailInsightId(null)}
                />
            )}
        </div>
    );
}
