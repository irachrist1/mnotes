"use client";

import { useState } from "react";
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
    <div
      className="fixed inset-0 sm:inset-auto sm:bottom-20 sm:right-6 z-[60] sm:w-[400px] sm:max-h-[min(600px,calc(100vh-8rem))] flex flex-col sm:rounded-2xl overflow-hidden"
      style={{ background: "rgb(var(--color-surface))" }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-white/[0.06] shrink-0">
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
      <div className="border-t border-stone-200 dark:border-white/[0.06] px-3 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1 h-10 skeleton rounded-xl" />
          <div className="w-10 h-10 sm:w-9 sm:h-9 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}

const ChatPanel = dynamic(
  () => import("@/components/chat/ChatPanel").then((m) => m.ChatPanel),
  { ssr: false, loading: () => <ChatPanelSkeleton /> }
);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const convexAvailable = useConvexAvailable();

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
      {convexAvailable && !chatOpen && <ChatButton open={false} onClick={() => setChatOpen(true)} />}
    </div>
  );
}
