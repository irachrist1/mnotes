"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { DollarSign, Lightbulb, Users, ListTodo } from "lucide-react";
import { motion } from "framer-motion";

// Lazy-load each tab's content — only the active tab is mounted
const IncomeContent = dynamic(
    () => import("@/app/dashboard/income/page").then((m) => m.IncomeContent),
    { ssr: false, loading: () => <TabSkeleton /> }
);
const IdeasContent = dynamic(
    () => import("@/app/dashboard/ideas/page").then((m) => m.IdeasContent),
    { ssr: false, loading: () => <TabSkeleton /> }
);
const MentorshipContent = dynamic(
    () => import("@/app/dashboard/mentorship/page").then((m) => m.MentorshipContent),
    { ssr: false, loading: () => <TabSkeleton /> }
);
const TasksContent = dynamic(
    () =>
        import("@/components/dashboard/TasksContent").then((m) => m.TasksContent),
    { ssr: false, loading: () => <TabSkeleton /> }
);

const TABS = [
    { key: "income", label: "Income", icon: DollarSign },
    { key: "ideas", label: "Ideas", icon: Lightbulb },
    { key: "mentorship", label: "Mentorship", icon: Users },
    { key: "tasks", label: "Tasks", icon: ListTodo },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function TabSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-stone-100 dark:bg-stone-800 rounded" />
            <div className="h-32 bg-stone-100 dark:bg-stone-800 rounded-lg" />
            <div className="h-64 bg-stone-100 dark:bg-stone-800 rounded-lg" />
        </div>
    );
}

function DataPageInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const rawTab = searchParams.get("tab");
    const activeTab: TabKey = TABS.some((t) => t.key === rawTab)
        ? (rawTab as TabKey)
        : "income";

    const setTab = useCallback(
        (tab: TabKey) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("tab", tab);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, router, pathname]
    );

    return (
        <>
            {/* Sticky tab bar */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6">
                <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setTab(tab.key)}
                                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                        ? "text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800"
                                        : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/50"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="data-tab-indicator"
                                        className="absolute inset-0 rounded-md bg-stone-100 dark:bg-stone-800 -z-10"
                                        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Active tab content */}
            <div>
                {activeTab === "income" && <IncomeContent />}
                {activeTab === "ideas" && <IdeasContent />}
                {activeTab === "mentorship" && <MentorshipContent />}
                {activeTab === "tasks" && <TasksContent />}
            </div>
        </>
    );
}

export default function DataPage() {
    return (
        <Suspense fallback={<TabSkeleton />}>
            <DataPageInner />
        </Suspense>
    );
}
