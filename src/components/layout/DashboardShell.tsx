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

const ChatPanel = dynamic(
  () => import("@/components/chat/ChatPanel").then((m) => m.ChatPanel),
  { ssr: false }
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
      {convexAvailable && <ChatButton open={chatOpen} onClick={() => setChatOpen((v) => !v)} />}
    </div>
  );
}
