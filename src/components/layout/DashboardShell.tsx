"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { Toaster } from "sonner";
import { useConvexAvailable } from "@/components/ConvexClientProvider";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

const Sidebar = dynamic(
  () => import("@/components/layout/Sidebar").then((m) => m.Sidebar),
  { ssr: false }
);

const CommandPalette = dynamic(
  () => import("@/components/layout/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false }
);

/* Skeleton shown while the ChatPanel JS chunk loads */
function ChatPanelSkeleton() {
  return (
    <>
      {/* Backdrop to avoid any background flicker while chunk loads (mobile) */}
      <div className="fixed inset-0 z-[55] bg-black/50 sm:hidden animate-fade-in" aria-hidden="true" />

      <div
        className={[
          "fixed z-[60] flex flex-col overflow-hidden",
          "inset-0",
          "sm:inset-auto sm:bottom-20 sm:right-6 sm:w-[400px] sm:max-h-[min(600px,calc(100vh-8rem))] sm:rounded-2xl sm:shadow-2xl",
          "chat-panel-enter",
        ].join(" ")}
        style={{ background: "rgb(var(--color-surface))" }}
      >
        {/* Desktop-only border */}
        <div className="hidden sm:block absolute inset-0 rounded-2xl pointer-events-none" style={{ border: "1px solid rgb(var(--color-border))" }} />

        {/* Header skeleton */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-white/[0.06] shrink-0 safe-area-top">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg skeleton" />
            <div className="w-24 h-4 skeleton rounded" />
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg skeleton" />
            <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg skeleton" />
          </div>
        </div>

        {/* Messages skeleton */}
        <div className="flex-1 px-4 py-4 space-y-4">
          <div className="flex justify-start">
            <div className="w-3/4 h-12 skeleton rounded-xl" />
          </div>
          <div className="flex justify-end">
            <div className="w-1/2 h-8 skeleton rounded-xl" />
          </div>
          <div className="flex justify-start">
            <div className="w-2/3 h-16 skeleton rounded-xl" />
          </div>
        </div>

        {/* Input skeleton */}
        <div className="border-t border-stone-200 dark:border-white/[0.06] px-3 py-3 shrink-0 safe-area-bottom">
          <div className="flex items-end gap-2">
            <div className="flex-1 h-10 skeleton rounded-xl" />
            <div className="w-10 h-10 sm:w-9 sm:h-9 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    </>
  );
}

const ChatPanel = dynamic(
  () => import("@/components/chat/ChatPanel").then((m) => m.ChatPanel),
  { ssr: false, loading: () => <ChatPanelSkeleton /> }
);

export function DashboardShell({
  children,
  initialChatOpen = false,
}: {
  children: React.ReactNode;
  initialChatOpen?: boolean;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const chatAutoOpened = useRef(false);
  const convexAvailable = useConvexAvailable();
  const pathname = usePathname();
  const agentStatus = useQuery(api.tasks.currentAgentStatus);
  const [dismissedPillTaskId, setDismissedPillTaskId] = useState<string | null>(null);
  const pillTouchStartX = useRef<number | null>(null);

  // Auto-open chat for freshly onboarded users (initialChatOpen resolves async)
  useEffect(() => {
    if (initialChatOpen && !chatAutoOpened.current) {
      chatAutoOpened.current = true;
      setChatOpen(true);
    }
  }, [initialChatOpen]);

  // Close chat panel when navigating to a different page
  useEffect(() => {
    setChatOpen(false);
    window.dispatchEvent(new CustomEvent("mnotes:chat-closed"));
  }, [pathname]);

  useEffect(() => {
    if (!agentStatus) {
      setDismissedPillTaskId(null);
      return;
    }
    if (dismissedPillTaskId && dismissedPillTaskId !== agentStatus.taskId) {
      setDismissedPillTaskId(null);
    }
  }, [agentStatus, dismissedPillTaskId]);

  // Listen for "mnotes:open-chat" custom events from QuickActionCards
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail;
      if (detail?.prompt) {
        setPendingPrompt(detail.prompt);
      }
      setChatOpen(true);
    };
    window.addEventListener("mnotes:open-chat", handler);
    return () => window.removeEventListener("mnotes:open-chat", handler);
  }, []);

  // Lock page scroll immediately when chat opens (even while ChatPanel chunk is still loading).
  useEffect(() => {
    if (!chatOpen) return;
    const mq = window.matchMedia("(max-width: 639px)");
    if (!mq.matches) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = "";
      html.style.height = "";
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [chatOpen]);

  // Preload chat chunk for near-instant open (keeps it dashboard-only).
  const preloadChat = () => {
    void import("@/components/chat/ChatPanel");
  };

  return (
    <div className="min-h-screen bg-dot-pattern" style={{ background: 'rgb(var(--color-background))' }}>

      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className: 'card',
          style: {
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
          },
        }}
      />
      {convexAvailable && <Sidebar />}
      {convexAvailable && <CommandPalette />}
      <div className="relative lg:pl-16">
        {convexAvailable && (
          <div className="flex items-center justify-end max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-0">
            <NotificationBell />
          </div>
        )}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Chat */}
      {convexAvailable && (
        <ChatPanel
          open={chatOpen}
          onClose={() => {
            setChatOpen(false);
            window.dispatchEvent(new CustomEvent("mnotes:chat-closed"));
          }}
          pendingPrompt={pendingPrompt}
          onPromptConsumed={() => setPendingPrompt(null)}
        />
      )}

      {/* Mobile Jarvis status pill */}
      {convexAvailable && agentStatus && dismissedPillTaskId !== agentStatus.taskId && (
        <div className="fixed bottom-4 left-4 right-4 z-[45] sm:hidden">
          <div
            className="card px-3 py-3 flex items-center justify-between gap-2 border border-stone-200 dark:border-white/[0.08]"
            onTouchStart={(e) => {
              pillTouchStartX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = pillTouchStartX.current;
              const end = e.changedTouches[0]?.clientX ?? null;
              pillTouchStartX.current = null;
              if (start === null || end === null) return;
              if (Math.abs(end - start) > 72) {
                setDismissedPillTaskId(agentStatus.taskId);
              }
            }}
          >
            <Link
              href={`/dashboard/data?tab=tasks&taskId=${agentStatus.taskId}`}
              className="min-w-0 flex-1 flex items-center justify-between gap-3"
              aria-label="Open running task"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {agentStatus.mode === "attention" ? "Jarvis needs attention" : "Jarvis is working"}
                </p>
                <p className={`text-[11px] truncate mt-0.5 ${
                  agentStatus.mode === "attention"
                    ? "text-red-600 dark:text-red-400"
                    : "text-stone-600 dark:text-stone-400"
                }`}>
                  {agentStatus.title}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`w-2 h-2 rounded-full ${agentStatus.mode === "attention" ? "bg-red-500" : "bg-blue-500 animate-pulse"}`} aria-hidden="true" />
                <span className={`text-[11px] font-medium tabular-nums ${
                  agentStatus.mode === "attention"
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}>
                  {Math.max(0, Math.min(100, Math.round(agentStatus.progress ?? 0)))}%
                </span>
              </div>
            </Link>
            <button
              onClick={() => setDismissedPillTaskId(agentStatus.taskId)}
              className="shrink-0 px-2 py-1 rounded-md text-[10px] font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/[0.06]"
              aria-label="Dismiss status pill"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
