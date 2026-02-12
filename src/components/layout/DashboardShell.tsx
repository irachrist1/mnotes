"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Toaster } from "sonner";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dot-pattern" style={{ background: 'rgb(var(--color-background))' }}>
      {/* Dot pattern overlay */}
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none" />

      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          className: 'card',
          style: {
            borderRadius: '12px',
          },
        }}
      />
      <Sidebar />
      <div className="relative lg:pl-56 min-h-screen transition-all duration-200">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
