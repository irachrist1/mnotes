"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ChatButton } from "@/components/chat/ChatButton";
import { Toaster } from "sonner";
import { useConvexAvailable } from "@/components/ConvexClientProvider";

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
