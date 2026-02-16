"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { DollarSign, Lightbulb, Users, ListTodo, FileText, Plug } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

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
const AgentFilesContent = dynamic(
    () =>
        import("@/components/dashboard/AgentFilesContent").then((m) => m.AgentFilesContent),
    { ssr: false, loading: () => <TabSkeleton /> }
);
const ConnectionsContent = dynamic(
    () =>
        import("@/components/dashboard/ConnectionsContent").then((m) => m.ConnectionsContent),
    { ssr: false, loading: () => <TabSkeleton /> }
);

const TABS = [
    { key: "income", label: "Income", icon: DollarSign },
    { key: "ideas", label: "Ideas", icon: Lightbulb },
    { key: "mentorship", label: "Mentorship", icon: Users },
    { key: "tasks", label: "Agent Tasks", icon: ListTodo },
    { key: "files", label: "Files", icon: FileText },
    { key: "connections", label: "Connections", icon: Plug },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function TabSkeleton() {
    return (
        <div className="space-y-4" aria-label="Loading tab">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
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
            <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6 py-2" style={{ background: 'rgb(var(--color-background))' }}>
                <nav className="inline-flex items-center gap-1 bg-stone-100/70 dark:bg-stone-800/50 rounded-xl p-1 overflow-x-auto scrollbar-hide">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setTab(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${isActive
                                    ? "text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-700 shadow-sm"
                                    : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
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
                {activeTab === "files" && <AgentFilesContent />}
                {activeTab === "connections" && <ConnectionsContent />}
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
