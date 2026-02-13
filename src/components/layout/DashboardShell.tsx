"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ChatButton } from "@/components/chat/ChatButton";
import { Toaster } from "sonner";
import { useConvexAvailable } from "@/components/ConvexClientProvider";

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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const convexAvailable = useConvexAvailable();

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
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Chat */}
      {convexAvailable && <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />}
      {/* Never render the floating button while open: mobile uses full-screen, and panel has its own close button. */}
      {convexAvailable && !chatOpen && (
        <div onPointerDown={preloadChat} onMouseEnter={preloadChat}>
          <ChatButton open={false} onClick={() => setChatOpen(true)} />
        </div>
      )}
    </div>
  );
}
