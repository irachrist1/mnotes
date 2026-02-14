"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BarChart3, ChevronDown, Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

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

export default function IntelligencePage() {
    const [openSections, setOpenSections] = useState<Set<string>>(
        new Set()
    );

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
        </div>
    );
}
